/**
 * Phase 1D - Registry Sync / Dedup
 *
 * For every GitHub-sourced entry in public/registry.json:
 *   1. Checks if the repo still exists (removes deleted / gone-private repos)
 *   2. Detects renames (nameWithOwner differs from stored) and updates URLs
 *   3. Refreshes star counts
 *   4. Flags archived repos (isArchived)
 *   5. Records last push date (lastCommit) for future quality signals
 *   6. Validates npm package names - finds and fixes 404 packages by reading
 *      the real name from the GitHub repo's package.json
 *
 * Usage:
 *   node scripts/sync-registry.js            # live run
 *   DRY_RUN=1 node scripts/sync-registry.js  # preview changes, no write
 *   SKIP_NPM_VALIDATION=1 node scripts/sync-registry.js  # skip npm checks (fast)
 *
 * Requires GITHUB_TOKEN for 5000 req/hr GraphQL limit (60/hr unauthenticated).
 */

'use strict'

const fs                       = require('fs').promises
const path                     = require('path')
const { sleep, fetchFileContent } = require('./lib/github')

const REGISTRY_PATH       = path.join(__dirname, '..', 'public', 'registry.json')
const TMP_PATH            = REGISTRY_PATH + '.tmp'
const GITHUB_GRAPHQL      = 'https://api.github.com/graphql'
const BATCH_SIZE          = 40
const DRY_RUN             = process.env.DRY_RUN === '1'
const SKIP_NPM_VALIDATION = process.env.SKIP_NPM_VALIDATION === '1'
const SKIP_GITHUB_SYNC    = process.env.SKIP_GITHUB_SYNC === '1'  // skip repo validate phase (npm-only test)
const NPM_REGISTRY       = 'https://registry.npmjs.org'
const NPM_CONCURRENCY    = 20  // parallel HEAD requests per batch

// ── GitHub helpers ─────────────────────────────────────────────────────────────

function ghHeaders() {
  const h = { 'Content-Type': 'application/json', 'User-Agent': 'cgcone-registry-sync/2.0' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

/**
 * Batch-query GitHub GraphQL for repo metadata.
 * Returns Map<"owner/repo", { nameWithOwner, stars, isArchived, lastCommit } | null>
 * null means the repo doesn't exist (deleted or private).
 */
async function batchFetchRepoMeta(fullNames) {
  const result = new Map()
  const chunks = []
  for (let i = 0; i < fullNames.length; i += BATCH_SIZE) {
    chunks.push(fullNames.slice(i, i + BATCH_SIZE))
  }

  for (const chunk of chunks) {
    const aliases = chunk.map((name, i) => {
      const [owner, repo] = name.split('/')
      // Escape quotes in owner/repo names (edge case: names with special chars)
      const safeOwner = owner.replace(/"/g, '\\"')
      const safeRepo  = repo.replace(/"/g, '\\"')
      return `r${i}: repository(owner: "${safeOwner}", name: "${safeRepo}") {
        nameWithOwner
        stargazerCount
        isArchived
        pushedAt
      }`
    })

    const query = `{ ${aliases.join('\n')} }`

    let json = null
    for (let attempt = 0; attempt < 4; attempt++) {
      let res
      try {
        res = await fetch(GITHUB_GRAPHQL, {
          method: 'POST',
          headers: ghHeaders(),
          body: JSON.stringify({ query }),
        })
      } catch (err) {
        console.warn(`  Network error (attempt ${attempt + 1}): ${err.message}`)
        await sleep((attempt + 1) * 3000)
        continue
      }

      if (res.status === 403 || res.status === 429) {
        const reset     = res.headers.get('X-RateLimit-Reset')
        const remaining = res.headers.get('X-RateLimit-Remaining')
        if (remaining === '0' && reset) {
          const wait = Math.max(2000, parseInt(reset) * 1000 - Date.now() + 2000)
          console.warn(`\n  GraphQL rate limited. Waiting ${Math.ceil(wait / 1000)}s...`)
          await sleep(Math.min(wait, 120_000))
          continue
        }
        await sleep((attempt + 1) * 5000)
        continue
      }

      if (!res.ok) { await sleep(3000); continue }

      try { json = await res.json() } catch { await sleep(2000); continue }
      break
    }

    if (!json) {
      // All retries failed for this chunk - preserve existing data (don't mark as deleted)
      console.warn(`  Batch failed for chunk starting at ${chunk[0]} - skipping (will retry next run)`)
      chunk.forEach(name => result.set(name, 'ERROR'))
      await sleep(2000)
      continue
    }

    chunk.forEach((name, i) => {
      const data = json.data?.[`r${i}`]
      if (!data) {
        result.set(name, null) // repo gone
      } else {
        result.set(name, {
          nameWithOwner: data.nameWithOwner,
          stars:         data.stargazerCount ?? 0,
          isArchived:    data.isArchived ?? false,
          lastCommit:    data.pushedAt ?? null,
        })
      }
    })

    await sleep(400)
  }

  return result
}

// ── URL / repo extraction helpers ──────────────────────────────────────────────

/**
 * Extract "owner/repo" from a github.com URL.
 * Returns null for monorepo subdirs (urls containing /tree/ or /blob/).
 */
function extractOwnerRepo(url) {
  if (!url || !url.includes('github.com/')) return null
  // Skip monorepo subdir URLs like https://github.com/org/repo/tree/main/src/X
  if (/\/tree\/|\/blob\//.test(url)) return null
  const m = url.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:[/?#]|$)/)
  return m ? m[1] : null
}

/**
 * Rebuild a canonical github URL from a nameWithOwner string.
 */
function toGithubUrl(nameWithOwner) {
  return `https://github.com/${nameWithOwner}`
}

// ── Entry collectors ───────────────────────────────────────────────────────────

/**
 * Collect all unique owner/repo strings that need checking,
 * mapped back to which entries reference them.
 * Returns Map<"owner/repo", Array<{ collection, index }>>
 */
function collectRepoRefs(registry) {
  const refs = new Map() // owner/repo -> [{ collection, index }]

  function add(ownerRepo, collection, index) {
    if (!ownerRepo) return
    if (!refs.has(ownerRepo)) refs.set(ownerRepo, [])
    refs.get(ownerRepo).push({ collection, index })
  }

  registry.mcpServers.forEach((entry, i) => {
    const ownerRepo = extractOwnerRepo(entry.githubUrl)
    if (entry.sourceRegistry === 'github' || entry.sourceRegistry === 'official-mcp') {
      add(ownerRepo, 'mcpServers', i)
    }
  })

  registry.plugins.forEach((entry, i) => {
    const ownerRepo = extractOwnerRepo(entry.repository)
    add(ownerRepo, 'plugins', i)
  })

  registry.skills.forEach((entry, i) => {
    const ownerRepo = extractOwnerRepo(entry.githubUrl)
    add(ownerRepo, 'skills', i)
  })

  return refs
}

// ── npm package validation ─────────────────────────────────────────────────────

/**
 * Check whether an npm package name exists on the registry.
 * Returns 'ok' | 'missing' | 'error'
 */
async function checkNpmPackage(pkgName) {
  const encoded = pkgName.startsWith('@')
    ? '@' + encodeURIComponent(pkgName.slice(1))
    : encodeURIComponent(pkgName)
  try {
    const res = await fetch(`${NPM_REGISTRY}/${encoded}`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'cgcone-registry-sync/2.0' },
    })
    if (res.ok) return 'ok'
    if (res.status === 404) return 'missing'
    return 'error'
  } catch {
    return 'error'
  }
}

/**
 * Extract all npx-invoked package names from a text blob (README etc).
 * Returns deduplicated array of candidate package names.
 */
function extractNpxPackages(text) {
  const seen = new Set()
  const packages = []
  // Matches: npx [-y] [-p] @scope/pkg  OR  npx [-y] pkg
  // Also handles: npx -y -p @scope/pkg cmd
  const re = /npx\s+(?:-y\s+)?(?:-p\s+)?(@[\w.-]+\/[\w.-]+(?:@[^\s"'`]+)?|[\w][\w.-]*(?:@[^\s"'`]+)?)/g
  let m
  while ((m = re.exec(text)) !== null) {
    // Strip version suffix (pkg@1.2.3 -> pkg)
    const pkg = m[1].replace(/@[^/].*$/, '')
    if (!pkg || pkg.length < 2) continue
    if (pkg.startsWith('.') || pkg.startsWith('/')) continue
    if (!seen.has(pkg)) { seen.add(pkg); packages.push(pkg) }
  }
  return packages
}

/**
 * Generate candidate npm package name variants for a missing package.
 * Common pattern: @scope/name is wrong, but @scope/name-mcp or name-mcp exists.
 */
function generateMcpVariants(pkgName) {
  if (pkgName.startsWith('@')) {
    const slash = pkgName.indexOf('/')
    const scope = pkgName.slice(0, slash)       // e.g. "@upstash"
    const name  = pkgName.slice(slash + 1)      // e.g. "context7"
    return [
      `${scope}/${name}-mcp`,
      `${scope}/${name}-mcp-server`,
      `${scope}/mcp-${name}`,
    ]
  }
  return [
    `${pkgName}-mcp`,
    `${pkgName}-mcp-server`,
    `mcp-${pkgName}`,
  ]
}

/**
 * Find a verified npm package name for a GitHub repo where the stored name is missing.
 * Strategy 1: common MCP name variants (no GitHub API - pure npm HEAD checks)
 * Strategy 2: root package.json name (requires GitHub API)
 * Strategy 3: README npx scanning (requires GitHub API)
 *
 * Strategies 2+3 are skipped when GITHUB_TOKEN is not set to avoid rate limits.
 * Returns a verified (npm-exists) package name, or null if none found.
 */
async function findVerifiedNpmName(ownerRepo, badPkgName) {
  const [owner, repo] = ownerRepo.split('/')

  // Strategy 1: name variant guessing (fast - only npm HEAD checks, no GitHub API)
  for (const variant of generateMcpVariants(badPkgName)) {
    if (await checkNpmPackage(variant) === 'ok') return variant
  }

  // Strategies 2+3 require GitHub API — skip when no token to avoid rate limits
  if (!process.env.GITHUB_TOKEN) return null

  // Strategy 2: root package.json
  const pkgContent = await fetchFileContent(owner, repo, 'package.json')
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent)
      if (typeof pkg.name === 'string' && pkg.name && pkg.name !== badPkgName) {
        if (await checkNpmPackage(pkg.name) === 'ok') return pkg.name
      }
    } catch { /* bad JSON, fall through */ }
  }

  // Strategy 3: README npx scanning
  const readme = await fetchFileContent(owner, repo, 'README.md')
            || await fetchFileContent(owner, repo, 'readme.md')
  if (!readme) return null

  const candidates = extractNpxPackages(readme).filter(c => c !== badPkgName)
  if (candidates.length === 0) return null

  // Sort: prefer same scope (@scope/*), then names with "mcp", then scoped, then unscoped
  const scope = badPkgName.startsWith('@') ? badPkgName.split('/')[0] : null
  candidates.sort((a, b) => {
    const score = c => {
      if (scope && c.startsWith(scope + '/')) return 0
      if (/mcp/i.test(c)) return 1
      if (c.startsWith('@')) return 2
      return 3
    }
    return score(a) - score(b)
  })

  for (const candidate of candidates) {
    if (await checkNpmPackage(candidate) === 'ok') return candidate
  }

  return null
}

/**
 * For all MCP entries with installConfig.type === 'npm':
 *   1. HEAD-check the stored package name against npm registry
 *   2. For 404s: fetch real name from GitHub repo's package.json
 *   3. Verify the real name also exists on npm
 *   4. Update installConfig.args[1] if a working replacement is found
 *
 * Returns stats object.
 */
async function validateAndFixNpmPackages(registry) {
  // Collect all npm-type entries with their package name
  const npmEntries = []
  for (const entry of registry.mcpServers) {
    if (!entry?.installConfig) continue
    const ic = entry.installConfig
    if (ic.type !== 'npm') continue
    // All npm entries use ["-y", pkgName] - args[1] is always the package name
    const pkgName = ic.args?.[1]
    if (!pkgName) continue
    npmEntries.push({ entry, pkgName })
  }

  if (npmEntries.length === 0) return { checked: 0, ok: 0, fixed: 0, unfixable: 0, errors: 0 }

  // De-duplicate package names for the check phase
  const uniquePkgs = [...new Set(npmEntries.map(e => e.pkgName))]
  console.log(`  Checking ${uniquePkgs.length} unique npm package names (${npmEntries.length} entries)...`)

  // Phase 1: npm registry existence checks (batched parallel HEADs)
  const npmStatus = new Map() // pkgName -> 'ok' | 'missing' | 'error'
  let batchNum = 0
  const totalBatches = Math.ceil(uniquePkgs.length / NPM_CONCURRENCY)

  for (let i = 0; i < uniquePkgs.length; i += NPM_CONCURRENCY) {
    const batch = uniquePkgs.slice(i, i + NPM_CONCURRENCY)
    const results = await Promise.all(batch.map(async pkg => [pkg, await checkNpmPackage(pkg)]))
    results.forEach(([pkg, status]) => npmStatus.set(pkg, status))
    batchNum++
    process.stdout.write(`\r    npm batch ${batchNum}/${totalBatches} (${Math.min(i + NPM_CONCURRENCY, uniquePkgs.length)}/${uniquePkgs.length})`)
    if (i + NPM_CONCURRENCY < uniquePkgs.length) await sleep(300)
  }
  console.log()

  const missing = [...npmStatus.entries()].filter(([, s]) => s === 'missing').map(([p]) => p)
  const errors  = [...npmStatus.entries()].filter(([, s]) => s === 'error').length
  const okCount = [...npmStatus.entries()].filter(([, s]) => s === 'ok').length
  console.log(`  npm status: ${okCount} ok, ${missing.length} missing (404), ${errors} network errors`)

  if (missing.length === 0) {
    return { checked: uniquePkgs.length, ok: okCount, fixed: 0, unfixable: 0, errors }
  }

  // Phase 2: for each 404 package, try to get real name from GitHub package.json
  // Build a map from pkgName -> ownerRepo (use first entry with a githubUrl)
  const pkgToRepo = new Map()
  for (const { entry, pkgName } of npmEntries) {
    if (npmStatus.get(pkgName) !== 'missing') continue
    if (pkgToRepo.has(pkgName)) continue
    const ownerRepo = extractOwnerRepo(entry.githubUrl)
    if (ownerRepo) pkgToRepo.set(pkgName, ownerRepo)
  }

  console.log(`\n  Fetching real package names from GitHub for ${missing.length} missing packages...`)
  const fixMap = new Map() // badPkgName -> realPkgName (verified on npm)
  let fixAttempt = 0

  for (const badPkg of missing) {
    fixAttempt++
    process.stdout.write(`\r    Resolving ${fixAttempt}/${missing.length}: ${badPkg.slice(0, 40).padEnd(40)}`)

    const ownerRepo = pkgToRepo.get(badPkg)
    if (!ownerRepo) continue

    const realName = await findVerifiedNpmName(ownerRepo, badPkg)
    if (!realName) continue

    fixMap.set(badPkg, realName)
    await sleep(200) // gentle on GitHub API rate limit
  }
  console.log()

  // Phase 3: apply fixes to all matching entries
  const stats = { checked: uniquePkgs.length, ok: okCount, fixed: 0, unfixable: 0, errors }
  const fixLog = []

  for (const { entry, pkgName } of npmEntries) {
    const status = npmStatus.get(pkgName)
    if (status === 'ok') continue
    if (status === 'error') { stats.errors++; continue }

    // status === 'missing'
    const realPkg = fixMap.get(pkgName)
    if (!realPkg) {
      stats.unfixable++
      continue
    }

    // Update args[1] in installConfig
    entry.installConfig.args[1] = realPkg
    // Clear uncertain flag if it was set - we now have a verified name
    delete entry.installConfig.uncertain
    stats.fixed++
    fixLog.push({ slug: entry.slug, from: pkgName, to: realPkg })
  }

  if (fixLog.length > 0) {
    console.log('\n  npm fixes applied:')
    fixLog.forEach(f => console.log(`    [fixed] ${f.slug}: ${f.from} -> ${f.to}`))
  }

  const stillBroken = missing.length - fixMap.size
  if (stillBroken > 0) {
    const broken = npmEntries
      .filter(({ pkgName }) => npmStatus.get(pkgName) === 'missing' && !fixMap.has(pkgName))
      .map(({ entry, pkgName }) => `${entry.slug} (${pkgName})`)
    console.log(`\n  Unfixable npm packages (no real name found): ${stillBroken}`)
    broken.slice(0, 10).forEach(s => console.log(`    ${s}`))
    if (broken.length > 10) console.log(`    ... and ${broken.length - 10} more`)
  }

  return stats
}

// ── Main sync logic ────────────────────────────────────────────────────────────

async function main() {
  console.log(`\ncgcone registry sync ${DRY_RUN ? '[DRY RUN - no writes]' : ''}\n`)

  if (!process.env.GITHUB_TOKEN) {
    console.warn('WARNING: GITHUB_TOKEN not set. Rate limit is 60 req/hr (unauthenticated).')
    console.warn('         Set GITHUB_TOKEN for 5000 req/hr.\n')
  }

  // Load registry
  const raw      = await fs.readFile(REGISTRY_PATH, 'utf-8')
  const registry = JSON.parse(raw)

  console.log(`Loaded registry: ${registry.mcpServers.length} MCPs, ${registry.plugins.length} plugins, ${registry.skills.length} skills`)

  // ── GitHub repo sync phase ─────────────────────────────────────────────────
  const stats = { removed: 0, renamed: 0, starsUpdated: 0, archived: 0, errors: 0 }
  const removedSlugs = []
  const renames      = []

  if (SKIP_GITHUB_SYNC) {
    console.log('GitHub repo sync skipped (SKIP_GITHUB_SYNC=1)\n')
  } else {
    // Collect all unique repos to check
    const repoRefs = collectRepoRefs(registry)
    const allRepos = [...repoRefs.keys()].filter(Boolean)
    console.log(`Repos to validate: ${allRepos.length}\n`)

    // Batch-fetch metadata from GitHub
    console.log('Fetching repo metadata from GitHub GraphQL...')
    const totalBatches = Math.ceil(allRepos.length / BATCH_SIZE)
    let batchDone = 0
    const metaMap = new Map()

    for (let i = 0; i < allRepos.length; i += BATCH_SIZE) {
      const chunk      = allRepos.slice(i, i + BATCH_SIZE)
      const chunkMeta  = await batchFetchRepoMeta(chunk)
      chunkMeta.forEach((v, k) => metaMap.set(k, v))
      batchDone++
      process.stdout.write(`\r  Batch ${batchDone}/${totalBatches} complete (${Math.min(i + BATCH_SIZE, allRepos.length)}/${allRepos.length} repos)`)
      if (i + BATCH_SIZE < allRepos.length) await sleep(500)
    }
    console.log('\n')

    // Apply updates to registry entries
    for (const [ownerRepo, refs] of repoRefs) {
      if (!ownerRepo) continue
      const meta = metaMap.get(ownerRepo)

      if (meta === 'ERROR') {
        stats.errors++
        continue
      }

      if (meta === null) {
        // Repo deleted or went private - remove all referencing entries
        for (const { collection, index } of refs) {
          const entry = registry[collection][index]
          if (entry) {
            removedSlugs.push({ collection, slug: entry.slug || entry.id, reason: 'repo_gone', repo: ownerRepo })
            registry[collection][index] = null
            stats.removed++
          }
        }
        continue
      }

      // Repo exists - apply updates
      for (const { collection, index } of refs) {
        const entry = registry[collection][index]
        if (!entry) continue

        // Detect rename
        const currentOwnerRepo = meta.nameWithOwner
        if (currentOwnerRepo.toLowerCase() !== ownerRepo.toLowerCase()) {
          renames.push({ from: ownerRepo, to: currentOwnerRepo, collection, slug: entry.slug || entry.id })
          if (collection === 'mcpServers') {
            entry.githubUrl = toGithubUrl(meta.nameWithOwner)
            if (entry.name === ownerRepo) entry.name = meta.nameWithOwner
          } else if (collection === 'plugins') {
            entry.repository = toGithubUrl(meta.nameWithOwner)
          } else if (collection === 'skills') {
            entry.githubUrl = toGithubUrl(meta.nameWithOwner)
            if (entry.repo === ownerRepo) entry.repo = meta.nameWithOwner
          }
          stats.renamed++
        }

        // Refresh stars
        if (typeof meta.stars === 'number' && entry.stars !== meta.stars) {
          entry.stars = meta.stars
          stats.starsUpdated++
        }

        // Flag archived repos
        if (meta.isArchived && !entry.isArchived) {
          entry.isArchived = true
          stats.archived++
        } else if (!meta.isArchived && entry.isArchived) {
          delete entry.isArchived
        }

        // Store last commit date (Phase 4E quality signal)
        if (meta.lastCommit) entry.lastCommit = meta.lastCommit

        entry.lastIndexedAt = new Date().toISOString()
      }
    }

    // Remove nulled entries (deleted repos) from all collections
    registry.mcpServers = registry.mcpServers.filter(Boolean)
    registry.plugins    = registry.plugins.filter(Boolean)
    registry.skills     = registry.skills.filter(Boolean)

    // ── Report ───────────────────────────────────────────────────────────────
    console.log('=== Sync Results ===\n')
    console.log(`  Repos checked:    ${allRepos.length}`)
    console.log(`  Stars updated:    ${stats.starsUpdated}`)
    console.log(`  Repos renamed:    ${stats.renamed}`)
    console.log(`  Repos removed:    ${stats.removed}`)
    console.log(`  Archived flagged: ${stats.archived}`)
    console.log(`  Batch errors:     ${stats.errors} (skipped, retry next run)`)
    console.log()

    if (renames.length > 0) {
      console.log('Renames:')
      renames.forEach(r => console.log(`  [${r.collection}] ${r.slug}: ${r.from} -> ${r.to}`))
      console.log()
    }

    if (removedSlugs.length > 0) {
      console.log('Removed (repo gone/private):')
      removedSlugs.forEach(r => console.log(`  [${r.collection}] ${r.slug} (${r.repo})`))
      console.log()
    }
  } // end !SKIP_GITHUB_SYNC

  // Update registry metadata
  registry.syncedAt = new Date().toISOString()
  registry.stats = {
    mcpServers:      registry.mcpServers.length,
    mcpInstallable:  registry.mcpServers.filter(s => s.installConfig).length,
    plugins:         registry.plugins.length,
    skills:          registry.skills.length,
    subagents:       registry.subagents?.length ?? 0,
    commands:        registry.commands?.length ?? 0,
    hooks:           registry.hooks?.length ?? 0,
  }

  console.log(`Registry totals: ${registry.stats.mcpServers} MCPs (${registry.stats.mcpInstallable} installable), ${registry.stats.plugins} plugins, ${registry.stats.skills} skills`)

  // ── npm package name validation ────────────────────────────────────────────
  let npmStats = null
  if (SKIP_NPM_VALIDATION) {
    console.log('\nnpm validation skipped (SKIP_NPM_VALIDATION=1)')
  } else {
    console.log('\n=== npm Package Validation ===\n')
    npmStats = await validateAndFixNpmPackages(registry)
    console.log(`\n  Summary: ${npmStats.checked} checked, ${npmStats.ok} ok, ${npmStats.fixed} fixed, ${npmStats.unfixable} unfixable, ${npmStats.errors} errors`)
  }

  // Re-compute installable count after npm fixes
  if (npmStats?.fixed > 0) {
    registry.stats.mcpInstallable = registry.mcpServers.filter(s => s.installConfig).length
  }

  // ── Write ──────────────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log('\nDRY RUN - registry.json not written.')
    return
  }

  // Atomic write: temp file + rename (same pattern as CLI adapters)
  await fs.writeFile(TMP_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8')
  await fs.rename(TMP_PATH, REGISTRY_PATH)
  console.log('\nWritten to public/registry.json')
}

main().catch(err => {
  console.error('\nSync failed:', err.message)
  process.exit(1)
})
