import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const REGISTRY_URL   = 'https://raw.githubusercontent.com/Himanshu507/cgcone/main/public/registry.json'
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

function allEntries(registry) {
  return [
    ...(registry.mcpServers  ?? []),
    ...(registry.plugins     ?? []),
    ...(registry.skills      ?? []),
    ...(registry.subagents   ?? []),
    ...(registry.commands    ?? []),
    ...(registry.hooks       ?? []),
  ]
}

export function searchExtensions(query, registry) {
  const q = query.toLowerCase()
  return allEntries(registry).filter(e =>
    e.slug?.toLowerCase().includes(q) ||
    e.displayName?.toLowerCase().includes(q) ||
    e.name?.toLowerCase().includes(q) ||
    e.description?.toLowerCase().includes(q) ||
    e.tags?.some(t => t.toLowerCase().includes(q))
  )
}

// Strip common prefixes/suffixes to get a comparable core name
export function normalizeSlug(s) {
  return s.toLowerCase()
    .replace(/^docker-/, '')
    .replace(/^mcp-/, '')
    .replace(/-mcp$/, '')
    .replace(/[^a-z0-9]/g, '')
}

function isDocker(e) {
  return e.sourceRegistry === 'docker' ||
    e.slug?.startsWith('docker-') ||
    e.installConfig?.type === 'docker'
}

// Score entry: lower = better. npm=0, uvx=1, no-config=2, docker=3
function installPriority(e) {
  if (e.installConfig?.type === 'npm')  return 0
  if (e.installConfig?.type === 'uvx')  return 1
  if (e.installConfig?.command)         return 1
  if (isDocker(e))                      return 3
  return 2
}

function bestMatch(candidates) {
  if (!candidates.length) return null
  return candidates.sort((a, b) => installPriority(a) - installPriority(b))[0]
}

export function findExtensions(slug, registry) {
  const all = allEntries(registry)
  const seen = new Set()

  // Collect from all match levels without early-return, then dedup + sort.
  // Early-return would miss entries that only appear in later (broader) levels
  // e.g. docker-context7 hits CI-exact on displayName="Context7" but upstash-context7
  // only hits substring-normalized — both must compete together.
  const lower = slug.toLowerCase()
  const norm  = normalizeSlug(slug)

  const gathered = all.filter(e => {
    const ns = normalizeSlug(e.slug ?? '')
    const nd = normalizeSlug(e.displayName ?? '')
    const nn = normalizeSlug(e.name ?? '')
    const matches =
      e.slug === slug || e.name === slug ||                          // exact
      e.slug?.toLowerCase() === lower ||                            // ci slug
      e.displayName?.toLowerCase() === lower ||                     // ci displayName
      e.name?.toLowerCase() === lower ||                            // ci name
      ns === norm || nd === norm || nn === norm ||                   // normalized exact
      ns.includes(norm) || nd.includes(norm) || nn.includes(norm)   // normalized substring
    if (!matches || seen.has(e.slug)) return false
    seen.add(e.slug)
    return true
  })

  return gathered.sort((a, b) => installPriority(a) - installPriority(b))
}

export function findExtension(slug, registry) {
  const all = allEntries(registry)

  // 1. Exact slug match — collect all, pick best install priority
  const exactMatches = all.filter(e => e.slug === slug || e.name === slug)
  if (exactMatches.length) return bestMatch(exactMatches)

  // 2. Case-insensitive name/displayName match
  const lower = slug.toLowerCase()
  const ciMatches = all.filter(e =>
    e.slug?.toLowerCase() === lower ||
    e.displayName?.toLowerCase() === lower ||
    e.name?.toLowerCase() === lower
  )
  if (ciMatches.length) return bestMatch(ciMatches)

  // 3. Normalized match — collect ALL candidates (exact + substring) then pick best install priority
  // Must not early-return on exact only: docker-context7 exact-matches "context7" after stripping
  // "docker-" prefix, but upstash-context7 only matches via substring — both must compete together.
  const norm = normalizeSlug(slug)
  const candidates = all.filter(e => {
    const ns = normalizeSlug(e.slug ?? '')
    const nd = normalizeSlug(e.displayName ?? '')
    const nn = normalizeSlug(e.name ?? '')
    return ns === norm || nd === norm || nn === norm ||
           ns.includes(norm) || nd.includes(norm) || nn.includes(norm)
  })
  return bestMatch(candidates)
}

export function findInstalledMatches(query, slugs) {
  if (slugs.includes(query)) return [query]

  const lower = query.toLowerCase()
  const ciMatches = slugs.filter(s => s.toLowerCase() === lower)
  if (ciMatches.length) return ciMatches

  const norm = normalizeSlug(query)
  return slugs.filter(s => {
    const ns = normalizeSlug(s)
    return ns === norm || ns.includes(norm) || norm.includes(ns)
  })
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

// Extract Docker image name from a Docker Hub URL
function imageFromDockerUrl(url) {
  const m = url.match(/hub\.docker\.com\/r\/([^/?#\s]+(?:\/[^/?#\s]+)?)/)
  return m ? m[1] : null
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
 * Priority: pre-computed installConfig → explicit packageName → npm/pypi packages → Docker/OCI → README → heuristics
 * Returns { command, args, env, type? } or null if not installable automatically.
 */
export function getInstallConfig(entry) {
  // 0. Pre-computed installConfig from registry generation (highest trust)
  if (entry.installConfig?.command) {
    return entry.installConfig
  }

  // 1. Explicit packageName field (highest trust)
  if (entry.packageName) {
    return { command: 'npx', args: ['-y', entry.packageName], env: {} }
  }

  // 2. Structured packages field — npm and pypi preferred over Docker
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
    }

    // Docker/OCI from packages field
    for (const pkg of entry.packages) {
      if (pkg.registryType === 'oci' && pkg.identifier) {
        const env = {}
        for (const ev of pkg.environmentVariables ?? []) {
          if (ev.isRequired && ev.name) env[ev.name] = ''
        }
        return {
          command: 'docker',
          args: ['run', '-i', '--rm', pkg.identifier],
          env,
          type: 'docker',
        }
      }
    }
  }

  // 3. dockerUrl field — Docker Hub entries from our indexer
  if (entry.dockerUrl) {
    const image = imageFromDockerUrl(entry.dockerUrl)
    if (image) {
      return {
        command: 'docker',
        args: ['run', '-i', '--rm', image],
        env: {},
        type: 'docker',
      }
    }
  }

  // 4. README-based extraction
  if (entry.readmeContent) {
    const config = extractFromReadme(entry.readmeContent)
    if (config) return config
  }

  // 5. Official MCP monorepo heuristic
  if (entry.githubUrl?.includes('github.com/modelcontextprotocol/servers')) {
    const pkg = `@modelcontextprotocol/server-${entry.slug.replace(/^mcp-/, '').replace(/-mcp$/, '')}`
    return { command: 'npx', args: ['-y', pkg], env: {} }
  }

  // 6. npm-sourced slug heuristic
  if (entry.sourceRegistry === 'npm' && entry.slug) {
    return { command: 'npx', args: ['-y', entry.slug], env: {} }
  }

  // 7. GitHub owner/repo guess — uncertain, installer will warn
  if (entry.githubUrl) {
    const m = entry.githubUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/)
    if (m) {
      return { command: 'npx', args: ['-y', `@${m[1]}/${m[2]}`], env: {}, uncertain: true }
    }
  }

  return null
}
