import { select, text, password, isCancel } from '@clack/prompts'
import { getDetectedAdapters, ALL_ADAPTERS } from '../adapters/index.js'
import { fetchRegistry, findExtension, findInstalledMatches } from '../registry.js'
import { spinner, success, error, info, c } from '../ui.js'

function isSensitiveKey(k) {
  return /key|token|secret|password|api/i.test(k)
}

function envDescriptions(entry) {
  const map = {}
  for (const pkg of entry?.packages ?? []) {
    for (const ev of pkg.environmentVariables ?? []) {
      if (ev.name) map[ev.name] = ev.description ?? ''
    }
  }
  return map
}

async function pickSlug(matches) {
  if (matches.length === 1) return matches[0]
  console.log()
  const result = await select({
    message: 'Multiple installed matches - select one to configure:',
    options: matches.map(s => ({ value: s, label: s })),
  })
  if (isCancel(result)) { console.log(); info('Cancelled.'); process.exit(0) }
  return result
}

export async function configure(name, opts = {}) {
  const targets = opts.for
    ? ALL_ADAPTERS.filter(a => a.id === opts.for || a.name.toLowerCase() === opts.for.toLowerCase())
    : await getDetectedAdapters()

  if (!targets.length) {
    error(opts.for
      ? `CLI "${opts.for}" not recognised.`
      : 'No AI CLIs detected. Run cgcone scan to diagnose.')
    return
  }

  // Find the installed slug
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

  // Fetch registry for env var descriptions (best-effort)
  let entry = null
  try {
    const spin = spinner('Fetching env var info...').start()
    const registry = await fetchRegistry()
    entry = findExtension(slug, registry)
    spin.stop()
  } catch {}

  const descs = envDescriptions(entry)

  // Read current env from first adapter that has it
  let currentEnv = {}
  for (const adapter of targets) {
    const env = await adapter.getEnv(slug).catch(() => ({}))
    if (Object.keys(env).length) { currentEnv = env; break }
  }

  // Merge: if registry has env keys not yet in currentEnv, include them too
  if (entry?.packages) {
    for (const pkg of entry.packages) {
      for (const ev of pkg.environmentVariables ?? []) {
        if (ev.isRequired && ev.name && !(ev.name in currentEnv)) {
          currentEnv[ev.name] = ''
        }
      }
    }
  }

  if (!Object.keys(currentEnv).length) {
    info(`No configurable env vars found for ${c.bold(slug)}`)
    info('If this MCP requires env vars, edit the config file manually.')
    return
  }

  console.log()
  info(`Configuring ${c.bold(slug)} - press Enter to keep current value`)
  console.log()

  const newEnv = {}
  for (const [key, current] of Object.entries(currentEnv)) {
    const sensitive = isSensitiveKey(key)
    const hint = descs[key] ? ` - ${descs[key]}` : ''
    const currentDisplay = current
      ? (sensitive ? '••••••••' : current)
      : c.dim('(not set)')

    const fn = sensitive ? password : text
    const val = await fn({
      message: `${c.bold(key)}${c.dim(hint)}`,
      placeholder: sensitive ? '' : `current: ${currentDisplay}`,
      initialValue: sensitive ? '' : (current || ''),
    })

    if (isCancel(val)) { console.log(); info('Cancelled.'); process.exit(0) }
    // blank input for sensitive fields = keep current
    newEnv[key] = (sensitive && val.trim() === '') ? current : val.trim()
  }

  console.log()
  let anyUpdated = false
  for (const adapter of targets) {
    const s = spinner(`Updating ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.setEnv(slug, newEnv)
      if (result.ok) {
        s.succeed(`${c.bold(adapter.name)} ${c.dim('→')} updated`)
        anyUpdated = true
      } else {
        s.warn(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message}`)
      }
    } catch (err) {
      s.fail(`${c.bold(adapter.name)} ${c.dim('→')} ${err.message}`)
    }
  }

  console.log()
  if (anyUpdated) success(`${c.primary(slug)} env vars updated`)
}
