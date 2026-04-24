import { getDetectedAdapters } from '../adapters/index.js'
import { ALL_ADAPTERS } from '../adapters/index.js'
import { fetchRegistry, findExtension, getInstallConfig } from '../registry.js'
import { markInstalled } from '../store.js'
import { spinner, success, error, warn, info, c } from '../ui.js'

export async function install(name, opts = {}) {
  const spin = spinner(`Looking up ${c.primary(name)}...`).start()

  let registry
  try {
    registry = await fetchRegistry()
  } catch (err) {
    spin.fail(`Could not reach registry: ${err.message}`)
    return
  }

  const entry = findExtension(name, registry)
  if (!entry) {
    spin.fail(`Extension ${c.primary(name)} not found in registry`)
    info(`Try ${c.bold('cgcone search ' + name)} to find similar extensions`)
    return
  }

  spin.succeed(`Found: ${c.bold(entry.displayName ?? entry.name)} — ${entry.description ?? ''}`)

  const installConfig = getInstallConfig(entry)
  if (!installConfig) {
    error(`No automatic install config for ${name}. Check ${entry.githubUrl ?? 'the repository'} for manual instructions.`)
    return
  }

  if (installConfig.uncertain) {
    warn(`Install command inferred (not verified): ${installConfig.command} ${installConfig.args.join(' ')}`)
  }

  const missingEnv = Object.entries(installConfig.env ?? {}).filter(([, v]) => v === '')
  if (missingEnv.length) {
    warn(`Required env vars (edit config after install):`)
    for (const [key] of missingEnv) console.log(`  ${c.dim('$')}${c.bold(key)}`)
    console.log()
  }

  // Determine which adapters to target
  const targets = opts.for
    ? ALL_ADAPTERS.filter(a => a.id === opts.for || a.name.toLowerCase() === opts.for.toLowerCase())
    : await getDetectedAdapters()

  if (!targets.length) {
    if (opts.for) {
      error(`CLI "${opts.for}" not recognised. Valid IDs: claude-code, gemini-cli, codex-cli`)
    } else {
      error('No AI CLIs detected on this machine. Run cgcone scan to diagnose.')
    }
    return
  }

  console.log()
  for (const adapter of targets) {
    const s = spinner(`Installing to ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.install(entry.slug, installConfig)
      if (result.ok) {
        await markInstalled(adapter.id, entry.slug, {
          displayName: entry.displayName ?? entry.name,
          description: entry.description,
          version: entry.version,
        })
        s.succeed(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message ?? 'done'}`)
      } else {
        s.warn(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message}`)
      }
    } catch (err) {
      s.fail(`${c.bold(adapter.name)} ${c.dim('→')} ${err.message}`)
    }
  }

  console.log()
  success(`${c.primary(entry.slug)} installed`)
}
