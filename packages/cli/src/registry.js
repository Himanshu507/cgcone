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

/**
 * Derive the CLI install config for an MCP server entry.
 * Returns { command, args, env } or null if not installable automatically.
 */
export function getInstallConfig(entry) {
  // Explicit packageName field takes priority (once we add it to registry schema)
  if (entry.packageName) {
    return { command: 'npx', args: ['-y', entry.packageName], env: {} }
  }

  // Official MCP servers from modelcontextprotocol/servers monorepo
  if (entry.githubUrl?.includes('github.com/modelcontextprotocol/servers')) {
    const pkg = `@modelcontextprotocol/server-${entry.slug.replace(/^mcp-/, '').replace(/-mcp$/, '')}`
    return { command: 'npx', args: ['-y', pkg], env: {} }
  }

  // npm-sourced entries — slug is typically the npm package name
  if (entry.sourceRegistry === 'npm' && entry.slug) {
    return { command: 'npx', args: ['-y', entry.slug], env: {} }
  }

  // GitHub-sourced: try @owner/repo if it looks like an npm package
  if (entry.githubUrl) {
    const m = entry.githubUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/)
    if (m) {
      return {
        command: 'npx',
        args: ['-y', `@${m[1]}/${m[2]}`],
        env: {},
        uncertain: true,  // might not be on npm — installer will warn
      }
    }
  }

  return null
}
