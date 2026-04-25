const GITHUB_REST    = 'https://api.github.com'
const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

function headers() {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'cgcone-registry-sync/2.0',
  }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function rateLimitedFetch(url, opts = {}, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt++) {
    let res
    try {
      res = await fetch(url, { ...opts, headers: { ...headers(), ...opts.headers } })
    } catch (err) {
      // Network error (socket closed, ECONNRESET, etc.) — retry with backoff
      if (attempt < retries - 1) {
        await sleep((attempt + 1) * 2000)
        continue
      }
      return null // exhaust retries → caller treats null as skip
    }

    if (res.status === 200 || res.status === 201) return res
    if (res.status === 404 || res.status === 451) return res // caller handles

    if (res.status === 403 || res.status === 429) {
      const reset     = res.headers.get('X-RateLimit-Reset')
      const remaining = res.headers.get('X-RateLimit-Remaining')
      if (remaining === '0' && reset) {
        const wait = Math.max(2000, parseInt(reset) * 1000 - Date.now() + 2000)
        console.warn(`  Rate limited. Waiting ${Math.ceil(wait / 1000)}s...`)
        await sleep(Math.min(wait, 120_000))
        continue
      }
      await sleep((attempt + 1) * 5000)
      continue
    }

    if (res.status >= 500) {
      await sleep((attempt + 1) * 3000)
      continue
    }

    return res
  }
  throw new Error(`GitHub request failed after ${retries} attempts: ${url}`)
}

/**
 * Search GitHub repositories.
 * @param {string} query - GitHub search query string
 * @param {number} maxPages - Max pages to fetch (100 results each)
 * @param {number} minStars - Minimum stars to include
 */
async function searchRepos(query, { maxPages = 5, minStars = 0, sort = 'stars' } = {}) {
  const repos = []
  for (let page = 1; page <= maxPages; page++) {
    const url = `${GITHUB_REST}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=100&page=${page}`
    const res = await rateLimitedFetch(url)
    if (!res.ok) break
    const data = await res.json()
    const items = data.items || []
    if (!items.length) break

    for (const item of items) {
      if (item.stargazers_count < minStars) continue // results are sorted desc, so we can break
      repos.push(item)
    }

    if (items.length < 100) break // last page
    await sleep(1200) // stay under 30 search req/min
  }
  return repos
}

/**
 * GitHub Code Search — find files across repos.
 * Returns array of { repo, path, sha, url, htmlUrl }
 */
async function searchCode(query, { maxPages = 5 } = {}) {
  const results = []
  for (let page = 1; page <= maxPages; page++) {
    const url = `${GITHUB_REST}/search/code?q=${encodeURIComponent(query)}&per_page=100&page=${page}`
    const res = await rateLimitedFetch(url)
    if (!res.ok) break
    const data = await res.json()
    const items = data.items || []
    if (!items.length) break

    for (const item of items) {
      results.push({
        repo:    item.repository.full_name,
        repoObj: item.repository,
        path:    item.path,
        sha:     item.sha,
        url:     item.url,
        htmlUrl: item.html_url,
      })
    }
    if (items.length < 100) break
    await sleep(1200)
  }
  return results
}

/**
 * Fetch file content from a GitHub repo. Returns decoded string or null.
 */
async function fetchFileContent(owner, repo, filePath, branch = null) {
  const ref = branch ? `?ref=${branch}` : ''
  const url = `${GITHUB_REST}/repos/${owner}/${repo}/contents/${filePath}${ref}`
  const res = await rateLimitedFetch(url)
  if (!res || !res.ok) return null
  try {
    const data = await res.json()
    if (!data.content || data.encoding !== 'base64') return null
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  } catch { return null }
}

/**
 * Batch-fetch star counts via GraphQL (40 repos per request).
 * @param {string[]} fullNames - Array of "owner/repo" strings
 * @returns {Map<string, number>} fullName → starCount
 */
async function batchFetchStars(fullNames) {
  const starMap = new Map()
  const chunks  = []
  for (let i = 0; i < fullNames.length; i += 40) chunks.push(fullNames.slice(i, i + 40))

  for (const chunk of chunks) {
    const aliases = chunk.map((name, i) => {
      const [owner, repo] = name.split('/')
      return `r${i}: repository(owner: "${owner}", name: "${repo}") { stargazerCount }`
    })

    const query = `{ ${aliases.join('\n')} }`
    try {
      const res = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) { await sleep(3000); continue }
      const json = await res.json()
      chunk.forEach((name, i) => {
        const stars = json.data?.[`r${i}`]?.stargazerCount
        if (stars != null) starMap.set(name, stars)
      })
    } catch { /* skip chunk */ }
    await sleep(500)
  }
  return starMap
}

/**
 * Get a single repo's metadata.
 */
async function getRepo(owner, repo) {
  const res = await rateLimitedFetch(`${GITHUB_REST}/repos/${owner}/${repo}`)
  if (!res.ok) return null
  return res.json()
}

module.exports = { searchRepos, searchCode, fetchFileContent, batchFetchStars, getRepo, rateLimitedFetch, headers, sleep }
