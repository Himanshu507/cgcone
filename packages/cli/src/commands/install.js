import { execSync } from 'child_process'
import { createInterface } from 'readline'
import { getDetectedAdapters, ALL_ADAPTERS } from '../adapters/index.js'
import { fetchRegistry, findExtensions, getInstallConfig } from '../registry.js'
import { markInstalled } from '../store.js'
import { spinner, success, error, warn, info, c } from '../ui.js'

function entryTypeLabel(e) {
  if (e.installCommand?.startsWith('claude skill')) return 'skill'
  if (e.installCommand?.startsWith('/plugin')) return 'plugin'
  if (e.sourceRegistry === 'docker' || e.slug?.startsWith('docker-') || e.installConfig?.type === 'docker') return 'docker'
  if (e.sourceRegistry === 'npm' || e.installConfig?.type === 'npm') return 'npm'
  if (e.sourceRegistry === 'pypi' || e.installConfig?.type === 'uvx') return 'uvx'
  return 'mcp'
}

async function pickEntry(entries) {
  if (entries.length === 1) return entries[0]

  console.log()
  info('Multiple matches found — pick one to install:')
  console.log()
  entries.forEach((e, i) => {
    const label = e.displayName ?? e.name ?? e.slug
    const type  = entryTypeLabel(e)
    const desc  = e.description ? '  ' + c.dim(e.description.slice(0, 72)) : ''
    console.log(`  ${c.bold(String(i + 1).padStart(2))}. ${label} ${c.dim('(' + e.slug + ')')} ${c.primary('[' + type + ']')}`)
    if (desc) console.log(`      ${desc}`)
  })
  console.log()

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(c.bold(`Select [1-${entries.length}] (default 1): `), answer => {
      rl.close()
      const n = parseInt(answer.trim(), 10)
      resolve((n >= 1 && n <= entries.length) ? entries[n - 1] : entries[0])
    })
  })
}

function hasDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' })
    return true
  } catch { return false }
}

export async function install(name, opts = {}) {
  const spin = spinner(`Looking up ${c.primary(name)}...`).start()

  let registry
  try {
    registry = await fetchRegistry()
  } catch (err) {
    spin.fail(`Could not reach registry: ${err.message}`)
    return
  }

  const matches = findExtensions(name, registry)
  if (!matches.length) {
    spin.fail(`Extension ${c.primary(name)} not found in registry`)
    info(`Try ${c.bold('cgcone search ' + name)} to find similar extensions`)
    return
  }

  if (matches.length === 1) {
    spin.succeed(`Found: ${c.bold(matches[0].displayName ?? matches[0].name)} — ${matches[0].description ?? ''}`)
  } else {
    spin.stop()
  }

  const entry = await pickEntry(matches)

  if (matches.length > 1) {
    console.log()
    info(`Installing: ${c.bold(entry.displayName ?? entry.name)} ${c.dim('(' + entry.slug + ')')}`)
  }

  // Warn if we matched a different slug than what the user typed
  if (entry.slug !== name && matches.length === 1) {
    info(`Matched registry slug: ${c.bold(entry.slug)}`)
  }

  // Skills have a direct installCommand (claude skill add ...) — not MCP config
  if (entry.installCommand && (entry.sourceRegistry === 'github' || entry.installCommand.startsWith('claude skill'))) {
    console.log()
    info(`Skill install command:`)
    console.log(`  ${c.bold(entry.installCommand)}`)
    console.log()
    success(`Run the command above to install ${c.primary(entry.name ?? entry.id)}`)
    return
  }

  // Plugins have /plugin install ... command
  if (entry.installCommand?.startsWith('/plugin install')) {
    console.log()
    info(`Plugin install command (run inside Claude Code):`)
    console.log(`  ${c.bold(entry.installCommand)}`)
    console.log()
    success(`Run the command above inside Claude Code to install ${c.primary(entry.name)}`)
    return
  }

  const installConfig = getInstallConfig(entry)
  if (!installConfig) {
    const isRemote = entry.serverType === 'streamable-http' || entry.serverType === 'sse'
    if (isRemote) {
      error(`${c.bold(entry.displayName ?? entry.name)} is a remote MCP server (${entry.serverType}).`)
      info(`Connect via: ${c.bold(`claude mcp add --transport ${entry.serverType} ${entry.slug} <server-url>`)}`)
      info(`Get the server URL from the provider's documentation.`)
    } else {
      error(`No automatic install config for ${name}. Check ${entry.githubUrl ?? entry.dockerUrl ?? 'the repository'} for manual instructions.`)
    }
    return
  }

  // Docker-specific checks and warnings
  if (installConfig.type === 'docker') {
    if (!hasDocker()) {
      error('Docker is required to run this MCP server but was not found.\nInstall Docker Desktop: https://docs.docker.com/get-docker/')
      return
    }
    warn(`This MCP server runs via Docker: ${c.bold(installConfig.args.slice(-1)[0])}`)
    warn('Additional args (e.g. volume mounts, paths) may be needed — edit config after install if required.')
    console.log()
  } else if (installConfig.uncertain) {
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
