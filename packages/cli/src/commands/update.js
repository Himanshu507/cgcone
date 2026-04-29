import { getDetectedAdapters } from '../adapters/index.js'
import { fetchRegistry, findExtension, getInstallConfig } from '../registry.js'
import { markInstalled, getInstalled } from '../store.js'
import { spinner, success, error, info, warn, c } from '../ui.js'

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

async function updateOne(name, adapters, registry, opts = {}) {
  const entry = findExtension(name, registry)
  if (!entry) {
    error(`"${name}" not found in registry`)
    return false
  }

  const config = getInstallConfig(entry)
  if (!config) {
    error(`No automatic install config for ${name}`)
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
    const from = storedVer ? c.dim('v' + storedVer)  : c.dim('unknown')
    const to   = latestVer ? c.green('v' + latestVer) : c.dim('latest')
    console.log(`  ${from} ${c.dim('→')} ${to}`)
  }

  // ── install into each adapter ────────────────────────────────────────────
  let ok = false
  for (const adapter of adapters) {
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
    const slugSets = await Promise.all(adapters.map(a => a.listInstalled()))
    const allSlugs = [...new Set(slugSets.flat())]

    if (!allSlugs.length) {
      info('Nothing installed yet.')
      return
    }

    console.log()
    let updatedCount = 0
    let skippedCount = 0
    for (const slug of allSlugs) {
      const ok = await updateOne(slug, adapters, registry, opts)
      if (ok) updatedCount++
      else skippedCount++
      console.log()
    }

    if (updatedCount) success(`${updatedCount} extension${updatedCount > 1 ? 's' : ''} updated`)
    if (skippedCount) info(`${skippedCount} already at latest`)
  } else {
    console.log()
    const ok = await updateOne(name, adapters, registry, opts)
    console.log()
    if (ok) success(`${c.primary(name)} updated`)
  }
}
