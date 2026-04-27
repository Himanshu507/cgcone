const fs   = require('fs').promises
const path = require('path')
const matter = require('gray-matter')

const { fetchOfficialMCPs }  = require('./fetch-mcp-official')
const { fetchAllGitHubMCPs } = require('./fetch-mcp-github')
const { fetchDockerMCPs }    = require('./fetch-mcp-docker')
const { fetchGitHubPlugins } = require('./fetch-plugins-github')
const { fetchGitHubSkills }  = require('./fetch-skills-github')

const OUTPUT  = path.join(__dirname, '..', 'public', 'registry.json')
const CONTENT = path.join(__dirname, '..', 'content')

const SKIP_GITHUB  = process.env.SKIP_GITHUB === '1'
const SKIP_SKILLS  = process.env.SKIP_SKILLS === '1'
const SKIP_PLUGINS = process.env.SKIP_PLUGINS === '1'
const SKIP_DOCKER  = process.env.SKIP_DOCKER === '1'

async function readMarkdownDir(dir) {
  try {
    const files = await fs.readdir(dir)
    const items = []
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const raw = await fs.readFile(path.join(dir, file), 'utf-8')
      const { data, content } = matter(raw)
      items.push({ ...data, slug: file.replace('.md', ''), content: content.trim() })
    }
    return items
  } catch {
    return []
  }
}

function dedup(arr, key) {
  const seen = new Set()
  return arr.filter(item => {
    if (seen.has(item[key])) return false
    seen.add(item[key])
    return true
  })
}

/**
 * Sort MCP servers: installable first (by stars), then docker fallbacks last.
 */
function sortMCPs(servers) {
  return servers.sort((a, b) => {
    const aInstallable = a.installConfig != null ? 1 : 0
    const bInstallable = b.installConfig != null ? 1 : 0
    if (aInstallable !== bInstallable) return bInstallable - aInstallable
    return (b.stars ?? 0) - (a.stars ?? 0)
  })
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.warn('⚠  GITHUB_TOKEN not set - GitHub API rate limit is 60 req/hr (5000/hr with token)')
    console.warn('   Set GITHUB_TOKEN for full results. Unauthenticated runs will be severely rate-limited.\n')
  }

  console.log('Generating registry.json...\n')

  // === MCP Servers ===
  console.log('[1/5] Fetching official MCP registry...')
  const officialMCPs = await fetchOfficialMCPs()
  console.log(`  Official MCPs: ${officialMCPs.length}`)

  let githubMCPs = []
  if (!SKIP_GITHUB) {
    console.log('\n[2/5] Discovering MCP servers on GitHub...')
    githubMCPs = await fetchAllGitHubMCPs()
  } else {
    console.log('\n[2/5] Skipping GitHub MCP discovery (SKIP_GITHUB=1)')
  }

  let dockerMCPs = []
  if (!SKIP_DOCKER) {
    console.log('\n[3/5] Fetching Docker Hub MCP servers...')
    dockerMCPs = await fetchDockerMCPs()
    console.log(`  Docker MCPs: ${dockerMCPs.length}`)
  } else {
    console.log('\n[3/5] Skipping Docker Hub (SKIP_DOCKER=1)')
  }

  // Merge: official > github > docker (docker as fallback)
  // Dedup by slug - first occurrence wins
  const allMCPs    = dedup([...officialMCPs, ...githubMCPs, ...dockerMCPs], 'slug')
  const mcpServers = sortMCPs(allMCPs)

  // === Plugins ===
  let plugins = []
  if (!SKIP_PLUGINS) {
    console.log('\n[4/5] Discovering Claude Code plugins on GitHub...')
    plugins = await fetchGitHubPlugins()
  } else {
    console.log('\n[4/5] Skipping GitHub plugin discovery (SKIP_PLUGINS=1)')
  }

  // === Skills ===
  let githubSkills = []
  if (!SKIP_SKILLS) {
    console.log('\n[5/5] Discovering skills on GitHub...')
    githubSkills = await fetchGitHubSkills()
  } else {
    console.log('\n[5/5] Skipping GitHub skills discovery (SKIP_SKILLS=1)')
  }

  // === Content markdown dirs (subagents, manual skills, commands, hooks) ===
  const [subagents, mdSkills, commands, hooks] = await Promise.all([
    readMarkdownDir(path.join(CONTENT, 'subagents')),
    readMarkdownDir(path.join(CONTENT, 'skills')),
    readMarkdownDir(path.join(CONTENT, 'commands')),
    readMarkdownDir(path.join(CONTENT, 'hooks')),
  ])

  // Merge markdown skills with GitHub-discovered skills (GitHub wins on slug conflict)
  const allSkills = dedup([...githubSkills, ...mdSkills.map(s => ({
    ...s,
    installCommand: s.installCommand ?? null,
    sourceRegistry: 'manual',
  }))], 'id')

  const registry = {
    version:     '2.0',
    generatedAt: new Date().toISOString(),
    mcpServers,
    plugins:     dedup(plugins, 'slug'),
    subagents,
    skills:      allSkills,
    commands,
    hooks,
    marketplaces: [],
    stats: {
      mcpServers: mcpServers.length,
      mcpInstallable: mcpServers.filter(s => s.installConfig).length,
      plugins:    plugins.length,
      skills:     allSkills.length,
      subagents:  subagents.length,
      commands:   commands.length,
      hooks:      hooks.length,
    },
  }

  await fs.writeFile(OUTPUT, JSON.stringify(registry, null, 2))

  console.log('\n\n✓ Done. Written to public/registry.json')
  console.log(`  MCPs:          ${registry.stats.mcpServers} total (${registry.stats.mcpInstallable} auto-installable)`)
  console.log(`  Plugins:       ${registry.stats.plugins}`)
  console.log(`  Skills:        ${registry.stats.skills}`)
  console.log(`  Subagents:     ${registry.stats.subagents}`)
  console.log(`  Commands:      ${registry.stats.commands}`)
  console.log(`  Hooks:         ${registry.stats.hooks}`)
}

main().catch(err => { console.error(err); process.exit(1) })
