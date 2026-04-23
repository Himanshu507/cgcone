const GITHUB_API = 'https://api.github.com'
const README_MAX_CHARS = 15000

function githubHeaders() {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'cgcone-sync',
  }
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

function parseGitHubOwnerRepo(url) {
  if (!url || !url.includes('github.com')) return null
  const m = url.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
  if (!m) return null
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') }
}

async function fetchReadme(githubUrl, retries = 3) {
  const parsed = parseGitHubOwnerRepo(githubUrl)
  if (!parsed) return null
  const { owner, repo } = parsed

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
        headers: githubHeaders(),
      })

      if (res.status === 404) return null

      if (res.status === 403 || res.status === 429) {
        const reset = res.headers.get('X-RateLimit-Reset')
        const remaining = res.headers.get('X-RateLimit-Remaining')
        if (remaining === '0' && reset) {
          const wait = Math.max(1000, parseInt(reset) * 1000 - Date.now() + 1000)
          console.warn(`  Rate limited — waiting ${Math.ceil(wait / 1000)}s for reset...`)
          await new Promise(r => setTimeout(r, Math.min(wait, 65000)))
        } else {
          await new Promise(r => setTimeout(r, (attempt + 1) * 3000))
        }
        continue
      }

      if (!res.ok) return null

      const data = await res.json()
      if (data.encoding !== 'base64' || !data.content) return null

      const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
      const truncated = content.length > README_MAX_CHARS
      return {
        content: truncated ? content.slice(0, README_MAX_CHARS) : content,
        truncated,
      }
    } catch {
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}

/**
 * Fetches READMEs for a batch of items with concurrency limiting.
 * @param {Array} items - Array of objects to enrich
 * @param {Function} getUrl - (item) => githubUrl string | undefined
 * @param {object} opts
 * @param {number} opts.concurrency - Parallel request limit (default 5)
 * @param {number} opts.delayMs - Delay between requests per worker (default 300ms)
 * @param {Function} opts.onProgress - (done, total) => void
 * @returns {Array} Same items array, each with readmeContent/readmeTruncated added
 */
async function fetchReadmesBatch(items, getUrl, { concurrency = 5, delayMs = 300, onProgress } = {}) {
  const eligible = items.filter(item => {
    const url = getUrl(item)
    return url && url.includes('github.com')
  })

  let done = 0
  const total = eligible.length

  let index = 0
  async function worker() {
    while (index < eligible.length) {
      const item = eligible[index++]
      const url = getUrl(item)
      try {
        const result = await fetchReadme(url)
        if (result) {
          item.readmeContent = result.content
          item.readmeTruncated = result.truncated
        }
      } catch {
        // skip failed items
      }
      done++
      if (onProgress) onProgress(done, total)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, eligible.length) }, () => worker()))
  return items
}

module.exports = { fetchReadme, fetchReadmesBatch, parseGitHubOwnerRepo }
