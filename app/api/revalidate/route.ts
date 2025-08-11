import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

interface WebhookPayload {
  table?: string
  type?: string
  record?: Record<string, unknown>
  new?: Record<string, unknown>
  old_record?: Record<string, unknown>
  old?: Record<string, unknown>
}

async function getUniqueIdByCourseId(courseId?: string | null): Promise<string | null> {
  if (!courseId) return null
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('courses')
    .select('unique_id')
    .eq('id', courseId)
    .single()
  if (error) {
    console.error('[revalidate] lookup unique_id by course_id failed:', error)
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
  return (data ?? []).map(r => r.unique_id).filter(Boolean)
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-token')
  if (!secret || secret !== process.env.REVALIDATE_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: WebhookPayload = {}
  try {
    body = (await req.json()) as WebhookPayload
  } catch {
    body = {}
  }

  const table = body.table
  const type = body.type
  const record = body.record ?? body.new ?? null
  const oldRecord = body.old_record ?? body.old ?? null

  // Always refresh the list page cache
  revalidateTag('courses')

  try {
    switch (table) {
      case 'courses': {
        const uniqueId = (record?.unique_id as string) ?? (oldRecord?.unique_id as string) ?? null
        if (uniqueId) {
          revalidateTag(`course:${uniqueId}`)
          if (record?.is_bundle || oldRecord?.is_bundle) {
            revalidateTag(`bundle:${uniqueId}`)
          }
        }
        break
      }

      case 'course_plans': {
        const courseId = (record?.course_id as string) ?? (oldRecord?.course_id as string) ?? null
        const uniqueId = await getUniqueIdByCourseId(courseId)
        if (uniqueId) revalidateTag(`course:${uniqueId}`)
        break
      }

      case 'bundle_items': {
        const bundleId = (record?.bundle_course_id as string) ?? (oldRecord?.bundle_course_id as string) ?? null
        const childId = (record?.child_course_id as string) ?? (oldRecord?.child_course_id as string) ?? null

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
