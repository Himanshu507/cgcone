import { getDetectedAdapters } from '../adapters/index.js'
import { ALL_ADAPTERS } from '../adapters/index.js'
import { markUninstalled } from '../store.js'
import { spinner, success, error, c } from '../ui.js'

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

  console.log()
  let anyRemoved = false

  for (const adapter of targets) {
    const s = spinner(`Removing from ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.uninstall(name)
      if (result.ok) {
        await markUninstalled(adapter.id, name)
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
  if (anyRemoved) success(`${c.primary(name)} uninstalled`)
  else error(`${name} was not found in any detected CLI`)
}
