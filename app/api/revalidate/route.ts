// app/api/revalidate/route.ts
import { NextRequest } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs' // ensure revalidateTag/revalidatePath run properly

type JsonObj = Record<string, unknown>

interface WebhookPayload {
  table?: string
  type?: string
  record?: JsonObj
  new?: JsonObj
  old_record?: JsonObj
  old?: JsonObj
}

function getString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

function getBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

async function getUniqueIdByCourseId(courseId?: string | null): Promise<string | null> {
  if (!courseId) return null
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('courses')
    .select('unique_id')
    .eq('id', courseId)
    .maybeSingle() // tolerate 0 rows (e.g., after DELETE)

  if (error) {
    // Only unexpected errors will appear here; 0-row case gives error=null
    console.error('[revalidate] lookup unique_id by course_id failed (unexpected):', error)
    return null
  }
  return data?.unique_id ?? null
}

async function getUniqueIdsByCourseIds(courseIds: (string | null | undefined)[]): Promise<string[]> {
  const ids = Array.from(new Set(courseIds.filter(Boolean) as string[]))
  if (ids.length === 0) return []
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('courses')
    .select('id, unique_id')
    .in('id', ids)

  if (error) {
    console.error('[revalidate] batch lookup unique_ids failed:', error)
    return []
  }
  return (data ?? []).map(r => (r as { unique_id?: string }).unique_id).filter(Boolean) as string[]
}

function revalidateCommonPages() {
  // Pages that render or feature courses
  revalidatePath('/courses', 'page')
  revalidatePath('/', 'page')
}

export async function POST(req: NextRequest) {
  // Basic auth with shared secret
  const secret = req.headers.get('x-revalidate-token')
  if (!secret || secret !== process.env.REVALIDATE_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Parse body safely
  let body: WebhookPayload = {}
  try {
    body = (await req.json()) as WebhookPayload
  } catch {
    body = {}
  }

  const table = body.table
  const type = body.type
  const record: JsonObj | undefined = (body.record as JsonObj) ?? (body.new as JsonObj) ?? undefined
  const oldRecord: JsonObj | undefined = (body.old_record as JsonObj) ?? (body.old as JsonObj) ?? undefined

  // Always refresh list data + pages
  revalidateTag('courses')
  revalidateCommonPages()

  try {
    switch (table) {
      case 'courses': {
        const uniqueId = getString(record?.unique_id) ?? getString(oldRecord?.unique_id) ?? null
        const isBundleNow = getBool(record?.is_bundle)
        const wasBundle    = getBool(oldRecord?.is_bundle)

        if (uniqueId) {
          revalidateTag(`course:${uniqueId}`)
          if (isBundleNow || wasBundle) {
            revalidateTag(`bundle:${uniqueId}`)
          }
        }
        break
      }

      case 'course_plans': {
        // plan changes must refresh the parent course
        const courseId = getString(record?.course_id) ?? getString(oldRecord?.course_id) ?? null
        const uniqueId = await getUniqueIdByCourseId(courseId)
        if (uniqueId) {
          revalidateTag(`course:${uniqueId}`)
        }
        break
      }

      case 'bundle_items': {
        // bundle membership changes refresh bundle and affected child courses
        const bundleId = getString(record?.bundle_course_id) ?? getString(oldRecord?.bundle_course_id) ?? null
        const childId  = getString(record?.child_course_id)  ?? getString(oldRecord?.child_course_id)  ?? null

        const [bundleUniqueIds, childUniqueIds] = await Promise.all([
          getUniqueIdsByCourseIds([bundleId]),
          getUniqueIdsByCourseIds([childId]),
        ])

        for (const bid of bundleUniqueIds) {
          revalidateTag(`bundle:${bid}`)
          revalidateTag(`course:${bid}`)
        }
        for (const cid of childUniqueIds) {
          revalidateTag(`course:${cid}`)
        }
        break
      }

      default:
        // ignore other tables
        break
    }
  } catch (e) {
    console.error('[revalidate] error:', e)
    return new Response(JSON.stringify({ ok: false, error: 'revalidate_failed' }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, table, type }), { status: 200 })
}
