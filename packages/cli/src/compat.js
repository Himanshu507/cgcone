const NPM_REGISTRY = 'https://registry.npmjs.org'
const FETCH_TIMEOUT_MS = 4000

/**
 * Check if a Node version string satisfies a semver range expression.
 * Handles common patterns: >=X, >X, <=X, <X, ^X, ~X (single constraint or space-joined).
 * Returns true for unrecognised ranges (safe default).
 */
function satisfiesNodeRange(nodeVer, range) {
  if (!range || range.trim() === '*') return true

  const parseVer = (s) => s.trim().split('.').map(n => parseInt(n, 10) || 0)
  const compare  = (a, b) => {
    for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0)
    return 0
  }

  const userVer = parseVer(nodeVer)
  // Split on whitespace before each operator to handle compound ranges like ">=14 <16"
  const parts   = range.trim().split(/\s+(?=[><=^~])/)

  for (const part of parts) {
    const m = part.trim().match(/^([><=^~]+)\s*(\d+(?:\.\d+)?(?:\.\d+)?)$/)
    if (!m) continue
    const [, op, verStr] = m
    const req = parseVer(verStr)

    if (op === '>='  && compare(userVer, req) < 0)  return false
    if (op === '>'   && compare(userVer, req) <= 0) return false
    if (op === '<='  && compare(userVer, req) > 0)  return false
    if (op === '<'   && compare(userVer, req) >= 0) return false
    if ((op === '^' || op === '~') && (userVer[0] !== req[0] || compare(userVer, req) < 0)) return false
  }

  return true
}

/**
 * Fetch the latest-version metadata for an npm package and return any
 * compatibility warnings. Never throws — returns empty warnings on any error.
 *
 * @param {string} pkgName  e.g. "@upstash/context7-mcp"
 * @returns {Promise<{ warnings: string[] }>}
 */
export async function checkNpmCompat(pkgName) {
  const warnings = []

  try {
    const encoded = pkgName.startsWith('@')
      ? '@' + encodeURIComponent(pkgName.slice(1))
      : encodeURIComponent(pkgName)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let data
    try {
      const res = await fetch(`${NPM_REGISTRY}/${encoded}/latest`, {
        headers: { 'User-Agent': 'cgcone-cli/1.0', Accept: 'application/json' },
        signal:  controller.signal,
      })
      if (!res.ok) return { warnings }
      data = await res.json()
    } finally {
      clearTimeout(timer)
    }

    // ── engines.node check ──────────────────────────────────────────────
    const nodeRange = data.engines?.node
    if (nodeRange) {
      const currentNode = process.versions.node
      if (!satisfiesNodeRange(currentNode, nodeRange)) {
        warnings.push(
          `Node ${currentNode} does not satisfy required ${c.bold(nodeRange)} — server may fail to start`
        )
      }
    }

    // ── @modelcontextprotocol/sdk version check ─────────────────────────
    const allDeps = { ...data.dependencies, ...data.peerDependencies }
    const sdkVer  = allDeps?.['@modelcontextprotocol/sdk']

    if (sdkVer === '*' || sdkVer === 'latest') {
      warnings.push(`@modelcontextprotocol/sdk unpinned (${c.bold(sdkVer)}) — may break on SDK updates`)
    } else if (sdkVer && /^[\^~]?0\./.test(sdkVer)) {
      warnings.push(`@modelcontextprotocol/sdk ${c.bold(sdkVer)} is pre-1.0 — server may be outdated`)
    }

  } catch {
    // timeout, parse error, network error — skip silently, don't block install
  }

  return { warnings }
}

// c is used inside checkNpmCompat for formatting — import lazily to avoid circular deps
import { c } from './ui.js'
