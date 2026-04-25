const { searchRepos, fetchFileContent, sleep } = require('./lib/github')
const { detectRuntime, runtimeToInstallConfig } = require('./lib/detect-runtime')

const MIN_STARS      = 50
const CONCURRENCY    = 4
const RUNTIME_DELAY  = 400

function slugify(owner, repo) {
  return `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function categorize(name, description = '') {
  const text = `${name} ${description}`.toLowerCase()
  if (/database|db|sql|mongo|postgres|redis|sqlite|mysql/.test(text)) return 'database'
  if (/github|gitlab|git\b|jira|linear|bitbucket/.test(text))          return 'developer-tools'
  if (/browser|chrome|playwright|selenium|scrape|puppeteer/.test(text)) return 'browser-automation'
  if (/\bfile|filesystem|fs\b|directory/.test(text))                    return 'file-system'
  if (/search|brave|google|bing|duckduck/.test(text))                   return 'web-search'
  if (/aws|azure|gcp|cloud|kubernetes|docker|terraform/.test(text))     return 'cloud-infrastructure'
  if (/slack|notion|discord|calendar|email|gmail|jira/.test(text))      return 'productivity'
  if (/\bapi|rest\b|graphql|webhook/.test(text))                        return 'api-integration'
  return 'general'
}

/**
 * Fetch all MCP servers from the official modelcontextprotocol/servers monorepo.
 * Each server dir under src/ becomes its own entry with verified npm install config.
 */
async function fetchMonorepoMCPs() {
  const OWNER = 'modelcontextprotocol'
  const REPO  = 'servers'
  const servers = []

  try {
    // Fetch src/ directory listing
    const content = await fetchFileContent(OWNER, REPO, 'src')
    // This won't work for directory — use REST API directly
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/src`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'cgcone-registry-sync/2.0',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    })
    if (!res.ok) return []
    const dirs = await res.json()

    for (const dir of dirs) {
      if (dir.type !== 'dir') continue
      const name = dir.name
      const pkgName = `@modelcontextprotocol/server-${name}`
      const slug    = `modelcontextprotocol-server-${name}`

      // Try to get description from that server's package.json
      let description = `MCP server for ${name}`
      try {
        const pkgJson = await fetchFileContent(OWNER, REPO, `src/${name}/package.json`)
        if (pkgJson) {
          const pkg = JSON.parse(pkgJson)
          if (pkg.description) description = pkg.description
        }
      } catch {}

      servers.push({
        name:             pkgName,
        displayName:      name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        slug,
        description,
        category:         categorize(name, description),
        tags:             ['official', 'mcp', name],
        serverType:       'stdio',
        vendor:           'Anthropic',
        sourceRegistry:   'github',
        githubUrl:        `https://github.com/${OWNER}/${REPO}/tree/main/src/${name}`,
        stars:            null, // monorepo stars added separately
        verificationStatus: 'verified',
        lastIndexedAt:    new Date().toISOString(),
        installConfig: {
          command: 'npx',
          args:    ['-y', pkgName],
          env:     {},
          type:    'npm',
        },
      })
      await sleep(200)
    }
  } catch (err) {
    console.warn('  Monorepo fetch failed:', err.message)
  }

  console.log(`  Monorepo: ${servers.length} official MCP servers found`)
  return servers
}

/**
 * Search GitHub for MCP server repos and detect install runtime for each.
 */
async function fetchGitHubMCPs() {
  console.log('  Searching GitHub for MCP server repos...')

  // Multiple search queries to maximise coverage
  const queries = [
    `topic:mcp-server stars:>=${MIN_STARS}`,
    `topic:model-context-protocol stars:>=${MIN_STARS}`,
    `mcp-server in:name stars:>=${MIN_STARS}`,
  ]

  const seen    = new Set()
  const rawRepos = []

  for (const q of queries) {
    const repos = await searchRepos(q, { maxPages: 10, minStars: MIN_STARS })
    for (const r of repos) {
      if (!seen.has(r.full_name)) {
        seen.add(r.full_name)
        rawRepos.push(r)
      }
    }
    await sleep(2000) // space search queries
  }

  console.log(`  Found ${rawRepos.length} unique repos, detecting runtimes...`)

  const servers = []
  let done = 0

  // Process with concurrency limit
  async function processRepo(repo) {
    const [owner, name] = repo.full_name.split('/')
    const runtime = await detectRuntime(owner, name, repo.default_branch)
    const installConfig = runtimeToInstallConfig(runtime)

    done++
    process.stdout.write(`\r  Runtime detection: ${done}/${rawRepos.length}`)

    const slug = slugify(owner, name)

    servers.push({
      name:             repo.full_name,
      displayName:      name.replace(/-mcp$|^mcp-/, '').replace(/[-_]/g, ' ')
                          .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      slug,
      description:      repo.description || '',
      category:         categorize(name, repo.description || ''),
      tags:             repo.topics || [],
      serverType:       'stdio',
      vendor:           null,
      sourceRegistry:   'github',
      githubUrl:        repo.html_url,
      stars:            repo.stargazers_count,
      language:         repo.language,
      verificationStatus: 'community',
      lastIndexedAt:    new Date().toISOString(),
      installConfig:    installConfig ?? null,
    })

    await sleep(RUNTIME_DELAY)
  }

  // Chunk into batches of CONCURRENCY
  for (let i = 0; i < rawRepos.length; i += CONCURRENCY) {
    const batch = rawRepos.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(processRepo))
  }

  console.log(`\n  GitHub MCPs: ${servers.length} entries (${servers.filter(s => s.installConfig).length} auto-installable)`)
  return servers
}

async function fetchAllGitHubMCPs() {
  const [monorepo, searched] = await Promise.all([
    fetchMonorepoMCPs(),
    fetchGitHubMCPs(),
  ])

  // Deduplicate: monorepo entries win over search results
  const seen    = new Set(monorepo.map(s => s.slug))
  const unique  = searched.filter(s => !seen.has(s.slug))
  return [...monorepo, ...unique]
}

module.exports = { fetchAllGitHubMCPs }
