import { NextRequest, NextResponse } from 'next/server'
import { renderMarkdown, extractToc } from '@/lib/markdown'

const README_MAX_CHARS = 12000
const CACHE_SECONDS    = 86400 // 24h

function parseOwnerRepo(githubUrl: string): [string, string] | null {
  const m = githubUrl.match(/github\.com\/([^/]+)\/([^/?#\s]+)/)
  return m ? [m[1], m[2]] : null
}

// Authenticated GitHub API — 5000 req/hr with token, 60/hr without
async function fetchViaApi(owner: string, repo: string, token?: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: {
        Accept: 'application/vnd.github.raw+json',
        'User-Agent': 'cgcone-registry/1.0',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: CACHE_SECONDS },
    }
  )
  return res.ok ? res.text() : null
}

// raw.githubusercontent.com — no auth required for public repos, very high limits
async function fetchViaRaw(owner: string, repo: string): Promise<string | null> {
  const branches  = ['main', 'master', 'develop']
  const filenames = ['README.md', 'readme.md', 'Readme.md']
  for (const branch of branches) {
    for (const filename of filenames) {
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`,
        { next: { revalidate: CACHE_SECONDS } }
      )
      if (res.ok) return res.text()
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })

  const parsed = parseOwnerRepo(url)
  if (!parsed) return NextResponse.json({ error: 'invalid github url' }, { status: 400 })

  const [owner, repo] = parsed
  const token = process.env.GITHUB_TOKEN

  try {
    // Try API first (auto-detects branch + README filename), fall back to raw
    const raw = (await fetchViaApi(owner, repo, token)) ?? (await fetchViaRaw(owner, repo))

    if (!raw) return NextResponse.json({ error: 'readme not found' }, { status: 404 })

    const truncated = raw.length > README_MAX_CHARS
    const content   = truncated ? raw.slice(0, README_MAX_CHARS) : raw
    const html      = renderMarkdown(content, url)
    const toc       = extractToc(content)

    return NextResponse.json(
      { html, toc, truncated },
      { headers: { 'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=3600` } }
    )
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
