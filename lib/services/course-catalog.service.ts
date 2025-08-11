// lib/services/course-catalog.service.ts
// ============================================
// DB-backed catalog with cache tags for instant webhook revalidation

import { unstable_cache as cache } from 'next/cache'
import { createAnonServerClient } from '@/lib/supabase/anon'
import type { CourseData } from '@/lib/data/courses'

type RawCourse = {
  id: string
  unique_id: string
  name: string
  description: string | null
  is_bundle: boolean
}

type RawPlan = {
  id: string
  course_id: string
  label: '6mo' | '7day'
  category: 'course' | 'bundle'
  type: 'paid' | 'free'
  price: number
  enrollment_id: string
  stripe_price_id: string
}

type RawBundleItem = {
  bundle_course_id: string
  child_course_id: string
}

export class CourseCatalogService {
  /**
   * Cached fetch of the entire catalog (courses, plans, bundle items)
   * List-level tag: 'courses'
   */
  private fetchAllRaw = cache(
    async () => {
      const sb = createAnonServerClient()

      const [
        { data: courses, error: ce },
        { data: plans, error: pe },
        { data: bundles, error: be },
      ] = await Promise.all([
        sb.from('courses').select('*'),
        sb.from('course_plans').select('*'),
        sb.from('bundle_items').select('*'),
      ])

      if (ce) throw ce
      if (pe) throw pe
      if (be) throw be

      return {
        courses: (courses ?? []) as RawCourse[],
        plans: (plans ?? []) as RawPlan[],
        bundles: (bundles ?? []) as RawBundleItem[],
      }
    },
    ['catalog:all'],                 // ✅ array of strings
    { tags: ['courses'] }            // ✅ list-level tag
  )

  /**
   * Convert raw DB rows to CourseData[]
   */
  async getAllCourses(): Promise<CourseData[]> {
    const { courses, plans, bundles } = await this.fetchAllRaw()

    // id(uuid) → unique_id map
    const idToUnique: Record<string, string> = {}
    for (const c of courses) idToUnique[c.id] = c.unique_id

    // group plans by course uuid
    const plansByCourseId: Record<string, RawPlan[]> = {}
    for (const p of plans) (plansByCourseId[p.course_id] ??= []).push(p)

    // bundle uuid → child unique_ids[]
    const childrenByBundleId: Record<string, string[]> = {}
    for (const bi of bundles) {
      const childUnique = idToUnique[bi.child_course_id]
      if (!childUnique) continue
      ;(childrenByBundleId[bi.bundle_course_id] ??= []).push(childUnique)
    }

    return courses.map((c) => ({
      course: {
        Unique_id: c.unique_id,
        name: c.name,
        description: c.description ?? '',
        package: c.is_bundle ? (childrenByBundleId[c.id] ?? []) : [],
      },
      plans: (plansByCourseId[c.id] ?? []).map((pl) => ({
        url: '#', // store real URLs in DB if desired
        category: pl.category,
        type: pl.type,
        label: pl.label,
        price: Number(pl.price),
        enrollment_id: pl.enrollment_id,
        stripe_price_id: pl.stripe_price_id,
      })),
    }))
  }

  /**
   * Cached fetch of a single course by unique_id with param-baked key.
   * Uses tags so /api/revalidate can call revalidateTag('course:<unique_id>').
   */
  private fetchOneRaw(uniqueId: string) {
    return cache(
      async () => {
        const sb = createAnonServerClient()

        // Load the course row by unique_id
        const { data: course, error: ce } = await sb
          .from('courses')
          .select('*')
          .eq('unique_id', uniqueId)
          .single()
        if (ce || !course) return null

        // Load plans
        const { data: plans, error: pe } = await sb
          .from('course_plans')
          .select('*')
          .eq('course_id', course.id)
        if (pe) throw pe

        // Load bundle children (if bundle)
        let children: string[] = []
        if (course.is_bundle) {
          const { data: bundleItems, error: be } = await sb
            .from('bundle_items')
            .select('child_course_id')
            .eq('bundle_course_id', course.id)
          if (be) throw be

          if (bundleItems?.length) {
            const childIds = bundleItems.map((b) => b.child_course_id)
            const { data: childCourses } = await sb
              .from('courses')
              .select('unique_id, id')
              .in('id', childIds)
            children = (childCourses ?? []).map((c) => c.unique_id)
          }
        }

        return {
          course: course as RawCourse,
          plans: (plans ?? []) as RawPlan[],
          children,
        }
      },
      [`catalog:one:${uniqueId}`],                   // ✅ array of strings as cache key
      { tags: ['courses', `course:${uniqueId}`, `bundle:${uniqueId}`] } // ✅ tags used by /api/revalidate
    )()
  }

  /**
   * Convert the single raw payload to CourseData
   */
  async getCourseByUniqueId(uniqueId: string): Promise<CourseData | null> {
    const raw = await this.fetchOneRaw(uniqueId)
    if (!raw) return null

    return {
      course: {
        Unique_id: raw.course.unique_id,
        name: raw.course.name,
        description: raw.course.description ?? '',
        package: raw.course.is_bundle ? raw.children : [],
      },
      plans: raw.plans.map((pl) => ({
        url: '#',
        category: pl.category,
        type: pl.type,
        label: pl.label,
        price: Number(pl.price),
        enrollment_id: pl.enrollment_id,
        stripe_price_id: pl.stripe_price_id,
      })),
    }
  }
}

export const courseCatalogService = new CourseCatalogService()
