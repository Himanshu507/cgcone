import { execSync } from 'child_process'
import { homedir } from 'os'
import { select, text, password, confirm, isCancel } from '@clack/prompts'
import { getDetectedAdapters, ALL_ADAPTERS } from '../adapters/index.js'
import { fetchRegistry, findExtensions, getInstallConfig } from '../registry.js'
import { markInstalled } from '../store.js'
import { spinner, success, error, warn, info, c } from '../ui.js'
import { checkNpmCompat } from '../compat.js'

function isSensitiveKey(k) {
  return /key|token|secret|password|api/i.test(k)
}

function envDescriptions(entry) {
  const map = {}
  for (const pkg of entry.packages ?? []) {
    for (const ev of pkg.environmentVariables ?? []) {
      if (ev.name) map[ev.name] = ev.description ?? ''
    }
  }
  return map
}

async function promptEnvVars(missingEnv, entry) {
  const descs = envDescriptions(entry)
  const filled = {}
  console.log()
  for (const [key] of missingEnv) {
    const hint = descs[key] ? ` - ${descs[key]}` : ''
    const fn = isSensitiveKey(key) ? password : text
    const val = await fn({
      message: `${c.bold(key)}${c.dim(hint)}`,
      placeholder: isSensitiveKey(key) ? '' : 'enter value',
      validate: v => (v ?? '').trim() ? undefined : `${key} is required`,
    })
    if (isCancel(val)) { console.log(); process.exit(0) }
    filled[key] = val.trim()
  }
  return filled
}

async function promptFreeformEnvVars() {
  const env = {}
  info('Enter env vars one at a time. Leave name blank when done.')
  console.log()
  while (true) {
    const key = await text({
      message: 'Env var name:',
      placeholder: 'e.g. BRAVE_API_KEY  (blank to finish)',
    })
    if (isCancel(key) || !key?.trim()) break
    const k = key.trim()
    const fn = isSensitiveKey(k) ? password : text
    const val = await fn({
      message: `Value for ${c.bold(k)}:`,
      placeholder: isSensitiveKey(k) ? '' : 'enter value',
    })
    if (isCancel(val)) break
    env[k] = val.trim()
  }
  return env
}

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
  const result = await select({
    message: 'Multiple matches - select one to install:',
    options: entries.map(e => ({
      value: e,
      label: `${e.displayName ?? e.name ?? e.slug}  ${c.dim(e.slug)}  ${c.primary('[' + entryTypeLabel(e) + ']')}`,
      hint: e.description?.slice(0, 80) ?? '',
    })),
  })

  if (isCancel(result)) {
    console.log()
    info('Installation cancelled.')
    process.exit(0)
  }

  return result
}

function hasDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' })
    return true
  } catch { return false }
}

function printDryRunPreview(adapter, preview) {
  const home = homedir()
  const displayPath = preview.configPath.startsWith(home)
    ? '~' + preview.configPath.slice(home.length)
    : preview.configPath

  const actionLabel = preview.action === 'add'
    ? c.green('+ add')
    : c.yellow('~ update')

  console.log(`  ${c.bold(adapter.name)}  ${c.dim(displayPath)}`)
  console.log(`    ${actionLabel}  ${c.primary(preview.slug)}`)
  console.log()

  const { entry } = preview
  const indent = '      '
  if (entry.command) {
    console.log(`${indent}command  ${entry.command}`)
  }
  if (entry.args?.length) {
    const argsStr = '[' + entry.args.map(a => `"${a}"`).join(', ') + ']'
    console.log(`${indent}args     ${argsStr}`)
  }
  if (entry.env && Object.keys(entry.env).length) {
    for (const [k, v] of Object.entries(entry.env)) {
      const display = isSensitiveKey(k) ? '•'.repeat(Math.min(String(v).length, 24)) : v
      console.log(`${indent}env      ${c.bold(k)} = ${display}`)
    }
  }
  if ('enabled' in entry) {
    console.log(`${indent}enabled  ${entry.enabled}`)
  }
  console.log()
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
    spin.succeed(`Found: ${c.bold(matches[0].displayName ?? matches[0].name)} - ${matches[0].description ?? ''}`)
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

  // Skills have a direct installCommand (claude skill add ...) - not MCP config
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

  // 5I: npm compatibility warnings (Node version, SDK pinning)
  if (installConfig.type === 'npm') {
    const pkgName = installConfig.args?.[1]
    if (pkgName) {
      const { warnings } = await checkNpmCompat(pkgName)
      for (const w of warnings) warn(w)
    }
  }

  // Docker-specific checks and warnings
  if (installConfig.type === 'docker') {
    if (!hasDocker()) {
      error('Docker is required to run this MCP server but was not found.\nInstall Docker Desktop: https://docs.docker.com/get-docker/')
      return
    }
    warn(`This MCP server runs via Docker: ${c.bold(installConfig.args.slice(-1)[0])}`)
    warn('Additional args (e.g. volume mounts, paths) may be needed - edit config after install if required.')
    console.log()
  } else if (installConfig.uncertain) {
    warn(`Install command inferred (not verified): ${installConfig.command} ${installConfig.args.join(' ')}`)
  }

  const missingEnv = Object.entries(installConfig.env ?? {}).filter(([, v]) => v === '')
  let finalConfig = installConfig
  if (missingEnv.length) {
    info(`This MCP requires ${missingEnv.length} env var${missingEnv.length > 1 ? 's' : ''}:`)
    const filled = await promptEnvVars(missingEnv, entry)
    finalConfig = { ...installConfig, env: { ...installConfig.env, ...filled } }
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

  // ── Dry run: show what would be written, then exit ─────────────────────────
  if (opts.dryRun) {
    // If registry didn't define required env vars, ask now (same as live install does post-install)
    // so the preview can show the full config including any API keys.
    if (missingEnv.length === 0) {
      console.log()
      const addEnv = await confirm({
        message: 'Does this MCP require API keys or env vars?',
        initialValue: false,
      })
      if (!isCancel(addEnv) && addEnv) {
        console.log()
        const extraEnv = await promptFreeformEnvVars()
        if (Object.keys(extraEnv).length) {
          finalConfig = { ...finalConfig, env: { ...finalConfig.env, ...extraEnv } }
        }
      }
    }

    console.log()
    warn('Dry run - no config files will be changed.\n')

    for (const adapter of targets) {
      let preview
      try {
        preview = await adapter.preview(entry.slug, finalConfig)
      } catch (err) {
        console.log(`  ${c.bold(adapter.name)}  ${c.dim('preview error: ' + err.message)}\n`)
        continue
      }
      if (!preview) {
        console.log(`  ${c.bold(adapter.name)}  ${c.dim('dry-run not supported')}\n`)
        continue
      }
      printDryRunPreview(adapter, preview)
    }

    info('Run without --dry-run to apply these changes.')
    return
  }

  console.log()
  let anyInstalled = false
  for (const adapter of targets) {
    const s = spinner(`Installing to ${c.bold(adapter.name)}...`).start()
    try {
      const result = await adapter.install(entry.slug, finalConfig)
      if (result.ok) {
        await markInstalled(adapter.id, entry.slug, {
          displayName: entry.displayName ?? entry.name,
          description: entry.description,
          version: entry.version,
        })
        s.succeed(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message ?? 'done'}`)
        anyInstalled = true
      } else {
        s.warn(`${c.bold(adapter.name)} ${c.dim('→')} ${result.message}`)
      }
    } catch (err) {
      s.fail(`${c.bold(adapter.name)} ${c.dim('→')} ${err.message}`)
    }
  }

  console.log()
  success(`${c.primary(entry.slug)} installed`)

  // If registry had no env metadata (missingEnv was empty), offer free-form env entry
  if (anyInstalled && missingEnv.length === 0) {
    console.log()
    const addEnv = await confirm({
      message: 'Does this MCP require API keys or env vars?',
      initialValue: false,
    })
    if (!isCancel(addEnv) && addEnv) {
      console.log()
      const extraEnv = await promptFreeformEnvVars()
      if (Object.keys(extraEnv).length) {
        for (const adapter of targets) {
          const existing = await adapter.getEnv(entry.slug).catch(() => ({}))
          await adapter.setEnv(entry.slug, { ...existing, ...extraEnv }).catch(() => {})
        }
        console.log()
        success(`Env vars saved for ${c.primary(entry.slug)}`)
      }
    }
  }
}
