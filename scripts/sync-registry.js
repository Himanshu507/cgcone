/**
 * Phase 1D - Registry Sync / Dedup
 *
 * For every GitHub-sourced entry in public/registry.json:
 *   1. Checks if the repo still exists (removes deleted / gone-private repos)
 *   2. Detects renames (nameWithOwner differs from stored) and updates URLs
 *   3. Refreshes star counts
 *   4. Flags archived repos (isArchived)
 *   5. Records last push date (lastCommit) for future quality signals
 *
 * Usage:
 *   node scripts/sync-registry.js            # live run
 *   DRY_RUN=1 node scripts/sync-registry.js  # preview changes, no write
 *
 * Requires GITHUB_TOKEN for 5000 req/hr GraphQL limit (60/hr unauthenticated).
 */

'use strict'

const fs            = require('fs').promises
const path          = require('path')
const { sleep }     = require('./lib/github')

const REGISTRY_PATH  = path.join(__dirname, '..', 'public', 'registry.json')
const TMP_PATH       = REGISTRY_PATH + '.tmp'
const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const BATCH_SIZE     = 40
const DRY_RUN        = process.env.DRY_RUN === '1'

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

  // Collect all unique repos to check
  const repoRefs = collectRepoRefs(registry)
  const allRepos = [...repoRefs.keys()].filter(Boolean)
  console.log(`Repos to validate: ${allRepos.length}\n`)

  // Batch-fetch metadata from GitHub
  console.log('Fetching repo metadata from GitHub GraphQL...')
  const totalBatches = Math.ceil(allRepos.length / BATCH_SIZE)
  let batchDone = 0
  const metaMap = new Map()

  // Process in chunks to show progress
  for (let i = 0; i < allRepos.length; i += BATCH_SIZE) {
    const chunk      = allRepos.slice(i, i + BATCH_SIZE)
    const chunkMeta  = await batchFetchRepoMeta(chunk)
    chunkMeta.forEach((v, k) => metaMap.set(k, v))
    batchDone++
    process.stdout.write(`\r  Batch ${batchDone}/${totalBatches} complete (${Math.min(i + BATCH_SIZE, allRepos.length)}/${allRepos.length} repos)`)
    if (i + BATCH_SIZE < allRepos.length) await sleep(500)
  }
  console.log('\n')

  // Counters
  const stats = { removed: 0, renamed: 0, starsUpdated: 0, archived: 0, errors: 0 }
  const removedSlugs = []
  const renames      = []

  // Apply updates to registry entries
  for (const [ownerRepo, refs] of repoRefs) {
    if (!ownerRepo) continue
    const meta = metaMap.get(ownerRepo)

    if (meta === 'ERROR') {
      // Network failure for this repo - leave entry as-is, retry next run
      stats.errors++
      continue
    }

    if (meta === null) {
      // Repo deleted or went private - remove all referencing entries
      for (const { collection, index } of refs) {
        const entry = registry[collection][index]
        if (entry) {
          removedSlugs.push({ collection, slug: entry.slug || entry.id, reason: 'repo_gone', repo: ownerRepo })
          registry[collection][index] = null // mark for removal
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
      const storedOwnerRepo = ownerRepo
      const currentOwnerRepo = meta.nameWithOwner
      if (currentOwnerRepo.toLowerCase() !== storedOwnerRepo.toLowerCase()) {
        renames.push({ from: storedOwnerRepo, to: currentOwnerRepo, collection, slug: entry.slug || entry.id })
        // Update URL fields - keep slug unchanged (users may have installed it)
        if (collection === 'mcpServers') {
          entry.githubUrl = toGithubUrl(meta.nameWithOwner)
          if (entry.name === storedOwnerRepo) entry.name = meta.nameWithOwner
        } else if (collection === 'plugins') {
          entry.repository = toGithubUrl(meta.nameWithOwner)
        } else if (collection === 'skills') {
          entry.githubUrl = toGithubUrl(meta.nameWithOwner)
          if (entry.repo === storedOwnerRepo) entry.repo = meta.nameWithOwner
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
        // Unarchived (rare but possible)
        delete entry.isArchived
      }

      // Store last commit date (Phase 4E quality signal)
      if (meta.lastCommit) {
        entry.lastCommit = meta.lastCommit
      }

      entry.lastIndexedAt = new Date().toISOString()
    }
  }

  // Remove nulled entries (deleted repos) from all collections
  registry.mcpServers = registry.mcpServers.filter(Boolean)
  registry.plugins    = registry.plugins.filter(Boolean)
  registry.skills     = registry.skills.filter(Boolean)

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

  // ── Report ─────────────────────────────────────────────────────────────────
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

  console.log(`Registry totals: ${registry.stats.mcpServers} MCPs (${registry.stats.mcpInstallable} installable), ${registry.stats.plugins} plugins, ${registry.stats.skills} skills`)

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
