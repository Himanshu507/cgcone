const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0.1/servers'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatName(name) {
  const parts = name.split('/')
  const base = parts[parts.length - 1] || name
  return base.replace(/-mcp$/, '').replace(/[-_]/g, ' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function categorize(name, description = '', tags = []) {
  const text = `${name} ${description} ${tags.join(' ')}`.toLowerCase()
  if (text.match(/database|db|sql|mongo|postgres|redis|sqlite/)) return 'database'
  if (text.match(/github|gitlab|git|ci|cd|jira|linear/)) return 'developer-tools'
  if (text.match(/browser|chrome|playwright|selenium|scrape|puppeteer/)) return 'browser-automation'
  if (text.match(/file|filesystem|fs|directory/)) return 'file-system'
  if (text.match(/search|brave|google|bing/)) return 'web-search'
  if (text.match(/aws|azure|gcp|cloud|kubernetes|docker/)) return 'cloud-infrastructure'
  if (text.match(/slack|notion|discord|calendar|email|gmail/)) return 'productivity'
  if (text.match(/api|rest|graphql|webhook/)) return 'api-integration'
  return 'general'
}

async function fetchOfficialMCPs() {
  try {
    const res = await fetch(MCP_REGISTRY)
    if (!res.ok) throw new Error(`MCP registry returned ${res.status}`)
    const data = await res.json()
    const entries = data.servers || []
    return entries.map(entry => {
      // API returns {server: {...}, _meta: {...}} or flat server object
      const server = entry.server || entry
      const name = server.name || entry.id || ''
      const tags = server.tags || server.keywords || []
      return {
        name,
        displayName: server.title || formatName(name),
        slug: slugify(name),
        description: server.description || '',
        category: categorize(name, server.description, tags),
        tags,
        serverType: server.server_type || 'streamable-http',
        vendor: server.vendor || null,
        sourceRegistry: 'official-mcp',
        sourceUrl: MCP_REGISTRY,
        githubUrl: server.source_code_url || server.repository || null,
        documentationUrl: server.documentation_url || null,
        packages: server.packages || [],
        verificationStatus: 'verified',
        lastIndexedAt: new Date().toISOString(),
      }
    })
  } catch (err) {
    console.warn('Official MCP fetch failed:', err.message)
    return []
  }
}

module.exports = { fetchOfficialMCPs }
