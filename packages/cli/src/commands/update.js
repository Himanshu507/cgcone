import { getDetectedAdapters } from '../adapters/index.js'
import { fetchRegistry, findExtension, getInstallConfig } from '../registry.js'
import { markInstalled } from '../store.js'
import { spinner, success, error, info, c } from '../ui.js'

async function updateOne(name, adapters, registry) {
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

  let ok = false
  for (const adapter of adapters) {
    const s = spinner(`Updating ${c.bold(name)} in ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.install(entry.slug, config)
      if (result.ok) {
        await markInstalled(adapter.id, entry.slug, {
          displayName: entry.displayName ?? entry.name,
          version: entry.version,
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
    // Update everything that's installed across detected adapters
    const slugSets = await Promise.all(adapters.map(a => a.listInstalled()))
    const allSlugs = [...new Set(slugSets.flat())]

    if (!allSlugs.length) {
      info('Nothing installed yet.')
      return
    }

    console.log()
    for (const slug of allSlugs) {
      await updateOne(slug, adapters, registry)
    }
    console.log()
    success('All extensions updated')
  } else {
    console.log()
    const ok = await updateOne(name, adapters, registry)
    console.log()
    if (ok) success(`${c.primary(name)} updated`)
  }
}
