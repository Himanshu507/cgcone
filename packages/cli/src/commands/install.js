import { execSync } from 'child_process'
import { getDetectedAdapters, ALL_ADAPTERS } from '../adapters/index.js'
import { fetchRegistry, findExtension, getInstallConfig } from '../registry.js'
import { markInstalled } from '../store.js'
import { spinner, success, error, warn, info, c } from '../ui.js'

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

  const entry = findExtension(name, registry)
  if (!entry) {
    spin.fail(`Extension ${c.primary(name)} not found in registry`)
    info(`Try ${c.bold('cgcone search ' + name)} to find similar extensions`)
    return
  }

  spin.succeed(`Found: ${c.bold(entry.displayName ?? entry.name)} — ${entry.description ?? ''}`)

  // Warn if we matched a different slug than what the user typed
  if (entry.slug !== name) {
    info(`Matched registry slug: ${c.bold(entry.slug)}`)
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
