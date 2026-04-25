const { batchFetchStars } = require('./lib/github')
const { detectRuntime, runtimeToInstallConfig } = require('./lib/detect-runtime')

const MCP_REGISTRY = 'https://registry.modelcontextprotocol.io/v0.1/servers'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatName(name) {
  const parts = name.split('/')
  const base  = parts[parts.length - 1] || name
  return base.replace(/-mcp$/, '').replace(/[-_]/g, ' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function resolveUrl(val) {
  if (!val) return null
  if (typeof val === 'string') return val || null
  if (typeof val === 'object') {
    const url = val.url || val.href || val.link
    return typeof url === 'string' && url ? url : null
  }
  return null
}

function parseGitHubOwnerRepo(url) {
  if (!url) return null
  const m = url.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null
}

/**
 * Build installConfig from the packages[] field of an official MCP entry.
 * Returns null if no auto-installable package found.
 */
function installConfigFromPackages(packages = []) {
  for (const pkg of packages) {
    if (pkg.registryType === 'npm' && pkg.identifier) {
      const env = {}
      for (const ev of pkg.environmentVariables ?? []) {
        if (ev.isRequired && ev.name) env[ev.name] = ''
      }
      return { command: 'npx', args: ['-y', pkg.identifier], env, type: 'npm' }
    }
    if (pkg.registryType === 'pypi' && pkg.identifier) {
      const env = {}
      for (const ev of pkg.environmentVariables ?? []) {
        if (ev.isRequired && ev.name) env[ev.name] = ''
      }
      return { command: 'uvx', args: [pkg.identifier], env, type: 'uvx' }
    }
  }
  return null
}

async function fetchOfficialMCPs() {
  let entries = []
  try {
    const res = await fetch(MCP_REGISTRY)
    if (!res.ok) throw new Error(`MCP registry returned ${res.status}`)
    const data = await res.json()
    entries = data.servers || []
  } catch (err) {
    console.warn('Official MCP fetch failed:', err.message)
    return []
  }

  const servers = entries.map(entry => {
    const server = entry.server || entry
    const name   = server.name || entry.id || ''
    const tags   = server.tags || server.keywords || []
    const githubUrl = resolveUrl(server.source_code_url) || resolveUrl(server.repository) || null

    return {
      name,
      displayName:      server.title || formatName(name),
      slug:             slugify(name),
      description:      server.description || '',
      category:         'general',
      tags,
      serverType:       server.server_type || 'streamable-http',
      vendor:           server.vendor || null,
      sourceRegistry:   'official-mcp',
      sourceUrl:        MCP_REGISTRY,
      githubUrl,
      documentationUrl: resolveUrl(server.documentation_url) || null,
      packages:         server.packages || [],
      verificationStatus: 'verified',
      lastIndexedAt:    new Date().toISOString(),
      installConfig:    installConfigFromPackages(server.packages || []),
    }
  })

  // Enrich with GitHub star counts
  const withGitHub = servers.filter(s => s.githubUrl)
  if (withGitHub.length) {
    console.log(`  Enriching ${withGitHub.length} official MCPs with GitHub stars...`)
    const fullNames = withGitHub.map(s => {
      const parsed = parseGitHubOwnerRepo(s.githubUrl)
      return parsed ? `${parsed.owner}/${parsed.repo}` : null
    }).filter(Boolean)

    const starMap = await batchFetchStars(fullNames)
    for (const server of withGitHub) {
      const parsed = parseGitHubOwnerRepo(server.githubUrl)
      if (parsed) {
        const stars = starMap.get(`${parsed.owner}/${parsed.repo}`)
        if (stars != null) server.stars = stars
      }
    }
  }

  // For entries with no installConfig from packages[], try GitHub runtime detection
  const needsRuntime = servers.filter(s => !s.installConfig && s.githubUrl && s.serverType !== 'streamable-http' && s.serverType !== 'sse')
  if (needsRuntime.length) {
    console.log(`  Detecting runtime for ${needsRuntime.length} official MCP entries...`)
    for (const server of needsRuntime) {
      const parsed = parseGitHubOwnerRepo(server.githubUrl)
      if (!parsed) continue
      const runtime = await detectRuntime(parsed.owner, parsed.repo)
      const config  = runtimeToInstallConfig(runtime)
      if (config) server.installConfig = config
    }
  }

  return servers
}

module.exports = { fetchOfficialMCPs }
