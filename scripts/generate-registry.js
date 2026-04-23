const fs = require('fs').promises
const path = require('path')
const matter = require('gray-matter')

const { fetchOfficialMCPs } = require('./fetch-mcp-official')
const { fetchDockerMCPs } = require('./fetch-mcp-docker')
const { fetchGitHubPlugins } = require('./fetch-plugins-github')

const OUTPUT = path.join(__dirname, '..', 'public', 'registry.json')
const CONTENT = path.join(__dirname, '..', 'content')

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

async function main() {
  console.log('Generating registry.json...')
  const [officialMCPs, dockerMCPs, plugins] = await Promise.all([
    fetchOfficialMCPs(),
    fetchDockerMCPs(),
    fetchGitHubPlugins(),
  ])
  const [subagents, skills, commands, hooks] = await Promise.all([
    readMarkdownDir(path.join(CONTENT, 'subagents')),
    readMarkdownDir(path.join(CONTENT, 'skills')),
    readMarkdownDir(path.join(CONTENT, 'commands')),
    readMarkdownDir(path.join(CONTENT, 'hooks')),
  ])
  const registry = {
    generatedAt: new Date().toISOString(),
    mcpServers: dedup([...officialMCPs, ...dockerMCPs], 'slug'),
    plugins: dedup(plugins, 'slug'),
    subagents,
    skills,
    commands,
    hooks,
    marketplaces: [],
  }
  await fs.writeFile(OUTPUT, JSON.stringify(registry, null, 2))
  console.log(`Done. Written to public/registry.json`)
  console.log(`  MCPs: ${registry.mcpServers.length}`)
  console.log(`  Plugins: ${registry.plugins.length}`)
  console.log(`  Subagents: ${registry.subagents.length}`)
  console.log(`  Skills: ${registry.skills.length}`)
  console.log(`  Commands: ${registry.commands.length}`)
  console.log(`  Hooks: ${registry.hooks.length}`)
}

main().catch(err => { console.error(err); process.exit(1) })
