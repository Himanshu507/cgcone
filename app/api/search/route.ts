import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { MCPServer } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } }
)

const PAGE_SIZE = 24

function mapRow(row: Record<string, unknown>): MCPServer {
  return {
    slug:               row.slug as string,
    name:               (row.name ?? row.slug) as string,
    displayName:        (row.display_name ?? row.name ?? row.slug) as string,
    description:        (row.description ?? '') as string,
    category:           (row.category ?? 'general') as string,
    tags:               (Array.isArray(row.tags) ? row.tags : []) as string[],
    serverType:         (row.server_type ?? '') as string,
    sourceRegistry:     (row.source_registry ?? '') as string,
    githubUrl:          row.github_url as string | undefined,
    dockerUrl:          row.docker_url as string | undefined,
    npmUrl:             row.npm_url as string | undefined,
    stars:              row.stars as number | undefined,
    isArchived:         (row.is_archived ?? false) as boolean,
    lastCommit:         row.last_commit as string | undefined,
    verificationStatus: (row.verification_status ?? 'community') as MCPServer['verificationStatus'],
    packages:           (Array.isArray(row.packages) ? row.packages : []) as unknown[],
    lastIndexedAt:      (row.last_indexed_at ?? '') as string,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q        = searchParams.get('q')?.trim() ?? ''
  const category = searchParams.get('category') ?? 'all'
  const source   = searchParams.get('source') ?? 'all'
  const page     = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10)))

  const from = page * limit
  const to   = from + limit - 1

  let query = supabase
    .from('mcp_servers')
    .select(
      'slug,name,display_name,description,category,tags,server_type,source_registry,github_url,docker_url,npm_url,stars,is_archived,last_commit,verification_status,last_indexed_at',
      { count: 'exact' }
    )

  if (q) {
    query = query.or(`display_name.ilike.%${q}%,description.ilike.%${q}%,slug.ilike.%${q}%`)
  }

  if (category !== 'all') query = query.eq('category', category)
  if (source !== 'all')   query = query.eq('source_registry', source)

  query = query
    .order('is_archived', { ascending: true })
    .order('stars', { ascending: false, nullsFirst: false })
    .range(from, to)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    items:   (data ?? []).map(mapRow),
    total:   count ?? 0,
    page,
    hasMore: from + limit < (count ?? 0),
  })
}
