import { getDetectedAdapters } from '../adapters/index.js'
import { fetchRegistry, findExtension, findExtensions, findInstalledMatches, getInstallConfig } from '../registry.js'
import { markInstalled, getInstalled } from '../store.js'
import { spinner, success, error, info, warn, c } from '../ui.js'
import { select, confirm, isCancel } from '@clack/prompts'
import { install } from './install.js'

async function fetchNpmVersion(pkgName) {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.version ?? null
  } catch { return null }
}

async function getLatestVersion(entry) {
  if (entry.version) return entry.version
  const config = getInstallConfig(entry)
  if (config?.command === 'npx') {
    const pkg = config.args?.[1]
    if (pkg) return fetchNpmVersion(pkg)
  }
  return null
}

async function getStoredVersion(adapters, slug) {
  for (const adapter of adapters) {
    const installed = await getInstalled(adapter.id)
    if (installed[slug]?.version) return installed[slug].version
  }
  return null
}

// Collect all installed slugs across all detected adapters
async function getAllInstalledSlugs(adapters) {
  const sets = await Promise.all(adapters.map(a => a.listInstalled()))
  return [...new Set(sets.flat())]
}

// Find which installed slugs match the user's query
function findInstalledByQuery(query, allSlugs) {
  return findInstalledMatches(query, allSlugs)
}

async function offerInstall(name, registry, adapters) {
  console.log()
  info(`${c.bold(name)} is not installed on this machine.`)
  console.log()

  const matches = findExtensions(name, registry)
  if (!matches.length) {
    error(`No extensions matching "${name}" found in registry.`)
    info(`Try: ${c.bold('cgcone search ' + name)}`)
    return
  }

  // Show matches and ask if user wants to install
  let entry
  if (matches.length === 1) {
    entry = matches[0]
    const displayName = entry.displayName ?? entry.name ?? entry.slug
    const confirmed = await confirm({
      message: `Found ${c.bold(displayName)} ${c.dim('(' + entry.slug + ')')} — install it?`,
    })
    if (isCancel(confirmed) || !confirmed) {
      console.log()
      info('Cancelled.')
      return
    }
  } else {
    const result = await select({
      message: `Found ${matches.length} matches — select one to install:`,
      options: matches.map(e => ({
        value: e,
        label: `${e.displayName ?? e.name ?? e.slug}  ${c.dim(e.slug)}`,
        hint: e.description?.slice(0, 80) ?? '',
      })),
    })
    if (isCancel(result)) {
      console.log()
      info('Cancelled.')
      return
    }
    entry = result
  }

  console.log()
  await install(entry.slug, {})
}

async function updateOne(slug, adapters, registry) {
  const entry = findExtension(slug, registry)
  if (!entry) {
    error(`"${slug}" not found in registry — skipping`)
    return false
  }

  const config = getInstallConfig(entry)
  if (!config) {
    error(`No automatic install config for ${slug}`)
    return false
  }

  // ── version diff ────────────────────────────────────────────────────────
  const [latestVer, storedVer] = await Promise.all([
    getLatestVersion(entry),
    getStoredVersion(adapters, entry.slug),
  ])

  if (latestVer && storedVer && latestVer === storedVer) {
    info(`${c.bold(entry.slug)} ${c.dim('already latest')} ${c.dim('v' + latestVer)}`)
    return false
  }

  if (latestVer || storedVer) {
    const from = storedVer ? c.dim('v' + storedVer)   : c.dim('unknown')
    const to   = latestVer ? c.green('v' + latestVer)  : c.dim('latest')
    console.log(`  ${from} ${c.dim('→')} ${to}`)
  }

  // ── install into each adapter where this slug is present ────────────────
  let ok = false
  // Only update adapters that actually have this slug installed
  const targetAdapters = []
  for (const adapter of adapters) {
    const installedSlugs = await adapter.listInstalled()
    if (installedSlugs.includes(entry.slug)) targetAdapters.push(adapter)
  }
  // Fallback: if store has it but adapter config doesn't (edge case), update all
  if (!targetAdapters.length) targetAdapters.push(...adapters)

  for (const adapter of targetAdapters) {
    const s = spinner(`Updating ${c.bold(entry.slug)} in ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.install(entry.slug, config)
      if (result.ok) {
        await markInstalled(adapter.id, entry.slug, {
          displayName: entry.displayName ?? entry.name,
          version: latestVer ?? entry.version,
        })
        s.succeed(`${c.bold(adapter.name)} ${c.dim('→')} updated`)
        ok = true
      } else {
        s.warn(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message}`)
      }
    } catch (err) {
      s.fail(`${c.bold(adapter.name)} ${c.dim('→')} ${err.message}`)
    }
  }
  return ok
}

export async function update(name, opts = {}) {
  const adapters = await getDetectedAdapters()
  if (!adapters.length) {
    error('No AI CLIs detected. Run cgcone scan to diagnose.')
    return
  }

  const spin = spinner('Fetching registry...').start()
  let registry
  try {
    registry = await fetchRegistry({ force: true })
    spin.stop()
  } catch (err) {
    spin.fail(`Registry unavailable: ${err.message}`)
    return
  }

  if (opts.all) {
    const allSlugs = await getAllInstalledSlugs(adapters)

    if (!allSlugs.length) {
      info('Nothing installed yet.')
      return
    }

    console.log()
    let updatedCount = 0
    let skippedCount = 0
    for (const slug of allSlugs) {
      const ok = await updateOne(slug, adapters, registry)
      if (ok) updatedCount++
      else skippedCount++
      console.log()
    }

    if (updatedCount) success(`${updatedCount} extension${updatedCount > 1 ? 's' : ''} updated`)
    if (skippedCount) info(`${skippedCount} already at latest`)
    return
  }

  // ── single update ────────────────────────────────────────────────────────
  // Check if the queried name is actually installed before doing anything
  const allSlugs = await getAllInstalledSlugs(adapters)
  const matchedSlugs = findInstalledByQuery(name, allSlugs)

  if (!matchedSlugs.length) {
    // Not installed — offer to install instead
    await offerInstall(name, registry, adapters)
    return
  }

  console.log()
  let anyUpdated = false
  for (const slug of matchedSlugs) {
    const ok = await updateOne(slug, adapters, registry)
    if (ok) anyUpdated = true
    console.log()
  }
  if (anyUpdated) success(`${c.primary(name)} updated`)
}
