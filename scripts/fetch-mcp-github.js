const { searchRepos, fetchFileContent, sleep } = require('./lib/github')
const { batchDetectAllRuntimes } = require('./lib/detect-runtime')

const MIN_STARS  = 50

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
  if (/slack|notion|discord|calendar|email|gmail/.test(text))           return 'productivity'
  if (/\bapi|rest\b|graphql|webhook/.test(text))                        return 'api-integration'
  return 'general'
}

async function fetchMonorepoMCPs() {
  const OWNER = 'modelcontextprotocol'
  const REPO  = 'servers'
  const servers = []

  try {
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
      const name    = dir.name
      const pkgName = `@modelcontextprotocol/server-${name}`
      const slug    = `modelcontextprotocol-server-${name}`

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
        stars:            null,
        verificationStatus: 'verified',
        lastIndexedAt:    new Date().toISOString(),
        installConfig: { command: 'npx', args: ['-y', pkgName], env: {}, type: 'npm' },
      })
      await sleep(200)
    }
  } catch (err) {
    console.warn('  Monorepo fetch failed:', err.message)
  }

  console.log(`  Monorepo: ${servers.length} official MCP servers found`)
  return servers
}

async function fetchGitHubMCPs() {
  console.log('  Searching GitHub for MCP server repos...')

  const queries = [
    `topic:mcp-server stars:>=${MIN_STARS}`,
    `topic:model-context-protocol stars:>=${MIN_STARS}`,
    `mcp-server in:name stars:>=${MIN_STARS}`,
  ]

  const seen     = new Set()
  const rawRepos = []

  for (const q of queries) {
    const repos = await searchRepos(q, { maxPages: 10, minStars: MIN_STARS })
    for (const r of repos) {
      if (!seen.has(r.full_name)) {
        seen.add(r.full_name)
        rawRepos.push(r)
      }
    }
    await sleep(2000)
  }

  console.log(`  Found ${rawRepos.length} unique repos, batch-detecting runtimes...`)

  // Build input for batch detector
  const repoInputs = rawRepos.map(r => ({
    owner:    r.full_name.split('/')[0],
    name:     r.full_name.split('/')[1],
    language: r.language ?? '',
  }))

  let done = 0
  const runtimeMap = await batchDetectAllRuntimes(repoInputs, {
    batchSize:  40,
    delayMs:    800,
    onProgress: (d, t) => {
      done = d
      process.stdout.write(`\r  Runtime detection: ${d}/${t}`)
    },
  })

  const servers = rawRepos.map(repo => {
    const key           = repo.full_name
    const [owner, name] = key.split('/')
    const installConfig = runtimeMap.get(key) ?? null

    return {
      name:             key,
      displayName:      name.replace(/-mcp$|^mcp-/, '').replace(/[-_]/g, ' ')
                          .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      slug:             slugify(owner, name),
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
      installConfig,
    }
  })

  console.log(`\n  GitHub MCPs: ${servers.length} entries (${servers.filter(s => s.installConfig).length} auto-installable)`)
  return servers
}

async function fetchAllGitHubMCPs() {
  const [monorepo, searched] = await Promise.all([
    fetchMonorepoMCPs(),
    fetchGitHubMCPs(),
  ])

  const seen   = new Set(monorepo.map(s => s.slug))
  const unique = searched.filter(s => !seen.has(s.slug))
  return [...monorepo, ...unique]
}

module.exports = { fetchAllGitHubMCPs }
