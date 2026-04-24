import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const REGISTRY_URL   = 'https://cgcone.com/registry.json'
const CACHE_DIR      = join(homedir(), '.cgcone')
const CACHE_FILE     = join(CACHE_DIR, 'registry-cache.json')
const CACHE_TTL_MS   = 60 * 60 * 1000 // 1 hour

async function loadCache() {
  try {
    const raw   = await readFile(CACHE_FILE, 'utf8')
    const cache = JSON.parse(raw)
    if (Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data
  } catch {}
  return null
}

async function saveCache(data) {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify({ fetchedAt: Date.now(), data }, null, 2))
}

export async function fetchRegistry({ force = false } = {}) {
  if (!force) {
    const cached = await loadCache()
    if (cached) return cached
  }

  const res  = await fetch(REGISTRY_URL)
  if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`)
  const data = await res.json()
  await saveCache(data)
  return data
}

export function searchExtensions(query, registry) {
  const q = query.toLowerCase()
  const all = [
    ...(registry.mcpServers  ?? []),
    ...(registry.plugins     ?? []),
    ...(registry.skills      ?? []),
    ...(registry.subagents   ?? []),
    ...(registry.commands    ?? []),
    ...(registry.hooks       ?? []),
  ]
  return all.filter(e =>
    e.slug?.toLowerCase().includes(q) ||
    e.displayName?.toLowerCase().includes(q) ||
    e.name?.toLowerCase().includes(q) ||
    e.description?.toLowerCase().includes(q) ||
    e.tags?.some(t => t.toLowerCase().includes(q))
  )
}

export function findExtension(slug, registry) {
  const all = [
    ...(registry.mcpServers  ?? []),
    ...(registry.plugins     ?? []),
    ...(registry.skills      ?? []),
    ...(registry.subagents   ?? []),
    ...(registry.commands    ?? []),
    ...(registry.hooks       ?? []),
  ]
  return all.find(e => e.slug === slug || e.name === slug) ?? null
}

export function extensionType(entry, registry) {
  if (registry.mcpServers?.find(e => e.slug === entry.slug))  return 'mcp'
  if (registry.plugins?.find(e => e.slug === entry.slug))     return 'plugin'
  if (registry.skills?.find(e => e.slug === entry.slug))      return 'skill'
  if (registry.subagents?.find(e => e.slug === entry.slug))   return 'subagent'
  if (registry.commands?.find(e => e.slug === entry.slug))    return 'command'
  if (registry.hooks?.find(e => e.slug === entry.slug))       return 'hook'
  return 'unknown'
}

// Extract install config from README content — regex-based, best-effort
function extractFromReadme(content) {
  // JSON snippet: "args": ["-y", "@scope/pkg"] — most reliable pattern in README examples
  const jsonArgs = content.match(/"args"\s*:\s*\[\s*"-y"\s*,\s*"((?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*)"\s*\]/)
  if (jsonArgs) return { command: 'npx', args: ['-y', jsonArgs[1]], env: {}, source: 'readme' }

  // npx -y <pkg> — filter mcp-remote (relay, not a direct install)
  const npxY = content.match(/npx\s+-y\s+((?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*)/)
  if (npxY && npxY[1] !== 'mcp-remote') {
    return { command: 'npx', args: ['-y', npxY[1]], env: {}, source: 'readme' }
  }

  // uvx <pkg> — require hyphen/underscore to avoid matching English words like "uvx is..."
  const uvxM = content.match(/uvx\s+([a-z0-9][a-z0-9._-]*[-_][a-z0-9][a-z0-9._-]*)/)
  if (uvxM) return { command: 'uvx', args: [uvxM[1]], env: {}, source: 'readme' }

  return null
}

/**
 * Derive the CLI install config for an MCP server entry.
 * Priority: explicit packageName → structured packages field → README extraction → heuristics
 * Returns { command, args, env } or null if not installable automatically.
 */
export function getInstallConfig(entry) {
  // 1. Explicit packageName field (highest trust — set by registry maintainers)
  if (entry.packageName) {
    return { command: 'npx', args: ['-y', entry.packageName], env: {} }
  }

  // 2. Structured packages field from official MCP registry — authoritative
  if (entry.packages?.length) {
    for (const pkg of entry.packages) {
      if (pkg.registryType === 'npm' && pkg.identifier) {
        const env = {}
        for (const ev of pkg.environmentVariables ?? []) {
          if (ev.isRequired && ev.name) env[ev.name] = ''
        }
        return { command: 'npx', args: ['-y', pkg.identifier], env }
      }
      if (pkg.registryType === 'pypi' && pkg.identifier) {
        return { command: 'uvx', args: [pkg.identifier], env: {} }
      }
      // oci/docker skipped — config is too variable to auto-generate
    }
  }

  // 3. README-based extraction (already fetched during registry generation)
  if (entry.readmeContent) {
    const config = extractFromReadme(entry.readmeContent)
    if (config) return config
  }

  // 4. Official MCP monorepo heuristic
  if (entry.githubUrl?.includes('github.com/modelcontextprotocol/servers')) {
    const pkg = `@modelcontextprotocol/server-${entry.slug.replace(/^mcp-/, '').replace(/-mcp$/, '')}`
    return { command: 'npx', args: ['-y', pkg], env: {} }
  }

  // 5. npm-sourced slug heuristic
  if (entry.sourceRegistry === 'npm' && entry.slug) {
    return { command: 'npx', args: ['-y', entry.slug], env: {} }
  }

  // 6. GitHub owner/repo guess — uncertain, installer will warn
  if (entry.githubUrl) {
    const m = entry.githubUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/)
    if (m) {
      return { command: 'npx', args: ['-y', `@${m[1]}/${m[2]}`], env: {}, uncertain: true }
    }
  }

  return null
}
