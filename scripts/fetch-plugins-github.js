const { searchCode, batchFetchStars, sleep } = require('./lib/github')

const MIN_STARS = 5

/**
 * Validate and extract plugins from a marketplace.json file content.
 */
function extractPlugins(content, repoFullName, stars) {
  let marketplace
  try {
    marketplace = JSON.parse(content)
  } catch {
    return []
  }

  const plugins = marketplace.plugins ?? (Array.isArray(marketplace) ? marketplace : [marketplace])
  if (!Array.isArray(plugins) || !plugins.length) return []

  const marketplaceSlug = repoFullName.replace('/', '-').toLowerCase().replace(/[^a-z0-9-]+/g, '-')

  return plugins
    .filter(p => p.name && (p.description || p.name))
    .map(p => {
      const slug = `${p.name}-${marketplaceSlug}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      return {
        id:             slug,
        name:           p.name,
        displayName:    p.displayName ?? p.name,
        slug,
        description:    p.description ?? '',
        version:        p.version ?? '1.0.0',
        author:         typeof p.author === 'string' ? { name: p.author } : (p.author ?? { name: repoFullName.split('/')[0] }),
        repository:     `https://github.com/${repoFullName}`,
        homepage:       p.homepage ?? `https://github.com/${repoFullName}`,
        license:        p.license ?? null,
        keywords:       p.keywords ?? [],
        category:       p.category ?? 'community',
        commands:       p.commands ?? [],
        agents:         p.agents ?? [],
        hooks:          p.hooks ?? [],
        mcpServers:     p.mcpServers ?? [],
        marketplace:    marketplaceSlug,
        stars,
        installCommand: `/plugin install ${p.name}@${marketplaceSlug}`,
        sourceRegistry: 'github',
        verificationStatus: 'community',
        lastIndexedAt:  new Date().toISOString(),
      }
    })
}

/**
 * Fetch Claude Code plugins via GitHub Code Search for marketplace.json files.
 */
async function fetchGitHubPlugins() {
  console.log('  Searching GitHub for marketplace.json files (.claude-plugin)...')

  const codeResults = await searchCode('filename:marketplace.json path:.claude-plugin', { maxPages: 10 })
  console.log(`  Found ${codeResults.length} marketplace.json files`)

  // Deduplicate by repo (one marketplace per repo)
  const byRepo = new Map()
  for (const r of codeResults) {
    if (!byRepo.has(r.repo)) byRepo.set(r.repo, r)
  }
  const uniqueRepos = [...byRepo.values()]

  // Batch fetch star counts
  const starMap = await batchFetchStars(uniqueRepos.map(r => r.repo))

  const allPlugins = []
  let done = 0

  for (const result of uniqueRepos) {
    done++
    process.stdout.write(`\r  Processing marketplaces: ${done}/${uniqueRepos.length}`)

    const stars = starMap.get(result.repo) ?? 0
    if (stars < MIN_STARS) continue

    // Fetch marketplace.json content
    const [owner, repo] = result.repo.split('/')
    try {
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${result.repo}/${result.repoObj.default_branch ?? 'main'}/${result.path}`
      )
      if (!rawRes.ok) continue
      const content  = await rawRes.text()
      const plugins  = extractPlugins(content, result.repo, stars)
      allPlugins.push(...plugins)
    } catch {}

    await sleep(200)
  }

  console.log(`\n  Plugins: ${allPlugins.length} entries from ${uniqueRepos.length} marketplaces`)
  return allPlugins
}

module.exports = { fetchGitHubPlugins }
