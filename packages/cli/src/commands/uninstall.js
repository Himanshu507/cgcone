import { select, isCancel } from '@clack/prompts'
import { getDetectedAdapters, ALL_ADAPTERS } from '../adapters/index.js'
import { findInstalledMatches } from '../registry.js'
import { markUninstalled } from '../store.js'
import { spinner, success, error, warn, info, c } from '../ui.js'

async function pickSlug(matches) {
  if (matches.length === 1) return matches[0]

  console.log()
  const result = await select({
    message: 'Multiple installed matches — select one to uninstall:',
    options: matches.map(s => ({ value: s, label: s })),
  })

  if (isCancel(result)) {
    console.log()
    info('Uninstall cancelled.')
    process.exit(0)
  }

  return result
}

export async function uninstall(name, opts = {}) {
  const targets = opts.for
    ? ALL_ADAPTERS.filter(a => a.id === opts.for || a.name.toLowerCase() === opts.for.toLowerCase())
    : await getDetectedAdapters()

  if (!targets.length) {
    error(opts.for
      ? `CLI "${opts.for}" not recognised.`
      : 'No AI CLIs detected. Run cgcone scan to diagnose.')
    return
  }

  // Collect all installed slugs across target adapters (deduplicated)
  const installedSets = await Promise.all(targets.map(a => a.listInstalled().catch(() => [])))
  const allInstalled = [...new Set(installedSets.flat())]

  if (!allInstalled.length) {
    error('No extensions installed on detected CLIs.')
    return
  }

  const matches = findInstalledMatches(name, allInstalled)

  if (!matches.length) {
    error(`${c.primary(name)} not found in installed extensions`)
    info(`Run ${c.bold('cgcone list')} to see what is installed`)
    return
  }

  const slug = await pickSlug(matches)

  console.log()
  let anyRemoved = false

  for (const adapter of targets) {
    const s = spinner(`Removing from ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.uninstall(slug)
      if (result.ok) {
        await markUninstalled(adapter.id, slug)
        s.succeed(`${c.bold(adapter.name)} ${c.dim('→')} removed`)
        anyRemoved = true
      } else {
        s.warn(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message}`)
      }
    } catch (err) {
      s.fail(`${c.bold(adapter.name)} ${c.dim('→')} ${err.message}`)
    }
  }

  console.log()
  if (anyRemoved) success(`${c.primary(slug)} uninstalled`)
  else error(`${slug} was not found in any detected CLI config`)
}
