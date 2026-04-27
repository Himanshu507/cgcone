const fs   = require('fs')
const path = require('path')

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const CACHE_FILE     = path.join(__dirname, '..', '.runtime-cache.json')

function headers() {
  const h = { 'Content-Type': 'application/json', 'User-Agent': 'cgcone-registry-sync/2.0' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Disk cache ────────────────────────────────────────────────────────────────

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) } catch { return {} }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ── GraphQL batch detector ────────────────────────────────────────────────────

/**
 * Detect runtimes for up to 40 repos in a single GraphQL request.
 * Returns Map<"owner/repo", installConfig | null>
 */
async function batchDetectRuntimes(repos) {
  // repos: array of { owner, name, language }
  const aliases = repos.map((r, i) => `
    r${i}: repository(owner: "${r.owner}", name: "${r.name}") {
      primaryLanguage { name }
      pkgJson:   object(expression: "HEAD:package.json")   { ... on Blob { text } }
      pyproject: object(expression: "HEAD:pyproject.toml") { ... on Blob { text } }
    }`)

  const query = `{ ${aliases.join('\n')} }`

  for (let attempt = 0; attempt < 4; attempt++) {
    let res
    try {
      res = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ query }),
      })
    } catch {
      await sleep((attempt + 1) * 3000)
      continue
    }

    if (res.status === 403 || res.status === 429) {
      const reset     = res.headers.get('X-RateLimit-Reset')
      const remaining = res.headers.get('X-RateLimit-Remaining')
      if (remaining === '0' && reset) {
        const wait = Math.max(2000, parseInt(reset) * 1000 - Date.now() + 2000)
        console.warn(`\n  GraphQL rate limited. Waiting ${Math.ceil(wait / 1000)}s...`)
        await sleep(Math.min(wait, 120_000))
        continue
      }
      await sleep((attempt + 1) * 5000)
      continue
    }

    if (!res.ok) { await sleep(3000); continue }

    let json
    try { json = await res.json() } catch { await sleep(2000); continue }

    const results = new Map()
    repos.forEach((r, i) => {
      const key  = `${r.owner}/${r.name}`
      const data = json.data?.[`r${i}`]
      if (!data) { results.set(key, null); return }

      const lang   = data.primaryLanguage?.name ?? r.language ?? ''
      const config = extractInstallConfig(data.pkgJson?.text, data.pyproject?.text, lang)
      results.set(key, config)
    })
    return results
  }

  // All attempts failed - return nulls
  const results = new Map()
  repos.forEach(r => results.set(`${r.owner}/${r.name}`, null))
  return results
}

/**
 * Derive installConfig from fetched file contents + language.
 */
function extractInstallConfig(pkgJsonText, pyprojectText, language) {
  // npm / Node.js
  if (pkgJsonText) {
    try {
      const pkg = JSON.parse(pkgJsonText)
      const name = pkg.name
      if (name && !name.startsWith('_') && !name.includes(' ')) {
        return { command: 'npx', args: ['-y', name], env: {}, type: 'npm' }
      }
    } catch {}
    // package.json exists but couldn't parse name - still Node project, uncertain
    return null
  }

  // Python / uvx
  if (pyprojectText) {
    const m = pyprojectText.match(/^\[(?:project|tool\.poetry)\][^\[]*?^name\s*=\s*["']([^"']+)["']/ms)
    if (m) return { command: 'uvx', args: [m[1]], env: {}, type: 'uvx' }
    return null
  }

  // Language fallback - no file found but language gives a hint
  if (/typescript|javascript/i.test(language)) return null // need package.json name
  if (/python/i.test(language))               return null // need pyproject name

  return null
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Batch-detect runtimes for an array of repos with disk caching + resume.
 * @param {Array<{owner, name, language}>} repos
 * @param {object} opts
 * @param {number} opts.batchSize   - repos per GraphQL request (default 40)
 * @param {number} opts.delayMs     - ms between batches (default 1000)
 * @param {Function} opts.onProgress - (done, total) => void
 * @returns {Map<"owner/repo", installConfig | null>}
 */
async function batchDetectAllRuntimes(repos, { batchSize = 40, delayMs = 1000, onProgress } = {}) {
  const cache    = loadCache()
  const results  = new Map()
  const pending  = []

  // Split into cached vs needs-fetch
  for (const r of repos) {
    const key = `${r.owner}/${r.name}`
    if (Object.prototype.hasOwnProperty.call(cache, key)) {
      results.set(key, cache[key])
    } else {
      pending.push(r)
    }
  }

  if (pending.length === 0) {
    if (onProgress) onProgress(repos.length, repos.length)
    return results
  }

  let done = repos.length - pending.length

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch    = pending.slice(i, i + batchSize)
    const batchMap = await batchDetectRuntimes(batch)

    batchMap.forEach((config, key) => {
      results.set(key, config)
      cache[key] = config
    })

    done += batch.length
    if (onProgress) onProgress(done, repos.length)

    // Save cache after each batch so progress survives interruption
    saveCache(cache)

    if (i + batchSize < pending.length) await sleep(delayMs)
  }

  return results
}

module.exports = { batchDetectAllRuntimes, extractInstallConfig }
