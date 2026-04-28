import { spawn } from 'child_process'
import { ALL_ADAPTERS } from '../adapters/index.js'
import { section, spinner, success, error, warn, info, c } from '../ui.js'

// ── MCP startup check ────────────────────────────────────────────────────────

const MCP_INIT = JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities:    {},
    clientInfo:      { name: 'cgcone-doctor', version: '1.0' },
  },
}) + '\n'

const STARTUP_TIMEOUT_MS = 8000

/**
 * Try to start an MCP server and verify it responds to the initialize handshake.
 * Returns { ok: boolean, error?: string }.
 */
function checkMcpStartup(command, args, env) {
  return new Promise((resolve) => {
    let proc
    try {
      proc = spawn(command, args, {
        env:      { ...process.env, ...env },
        stdio:    ['pipe', 'pipe', 'pipe'],
        detached: false,
      })
    } catch (err) {
      return resolve({ ok: false, error: `spawn failed: ${err.message}` })
    }

    let stdout  = ''
    let stderr  = ''
    let settled = false

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { proc.kill('SIGTERM') } catch {}
      resolve(result)
    }

    const timer = setTimeout(() => {
      finish({ ok: false, error: `no response within ${STARTUP_TIMEOUT_MS / 1000}s (slow first run or hung)` })
    }, STARTUP_TIMEOUT_MS)

    proc.on('error', (err) => {
      finish({
        ok:    false,
        error: err.code === 'ENOENT' ? `command not found: ${command}` : err.message,
      })
    })

    proc.on('exit', (code) => {
      if (!settled) {
        const hint = stderr.trim().split('\n')[0]?.slice(0, 120) ?? ''
        finish({ ok: false, error: `exited (code ${code})${hint ? ': ' + hint : ''}` })
      }
    })

    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.stdout.on('data', (d) => {
      stdout += d.toString()
      // Each MCP message is a JSON-RPC line; look for our initialize response
      for (const line of stdout.split('\n')) {
        const t = line.trim()
        if (!t) continue
        try {
          const msg = JSON.parse(t)
          if (msg.jsonrpc === '2.0' && 'id' in msg) {
            finish('error' in msg
              ? { ok: false, error: `MCP error: ${JSON.stringify(msg.error)}` }
              : { ok: true })
            return
          }
        } catch { /* incomplete line, keep buffering */ }
      }
    })

    try { proc.stdin.write(MCP_INIT) } catch { /* process already exited */ }
  })
}

// ── main command ─────────────────────────────────────────────────────────────

export async function doctor() {
  section('Running diagnostics...')
  console.log()

  let totalErrors = 0
  let totalWarns  = 0

  // ── per-adapter config checks ───────────────────────────────────────────
  for (const adapter of ALL_ADAPTERS) {
    const detected = await adapter.detect()
    const prefix   = detected ? c.green('●') : c.dim('○')
    console.log(`${prefix}  ${c.bold(adapter.name)} ${detected ? '' : c.dim('(not detected)')}`)

    if (!detected) { console.log(); continue }

    const issues = await adapter.doctor()
    for (const issue of issues) {
      if (issue.level === 'ok') {
        console.log(`   ${c.green('✓')} ${c.dim(issue.message)}`)
      } else if (issue.level === 'warn') {
        console.log(`   ${c.yellow('⚠')} ${issue.message}`)
        totalWarns++
      } else if (issue.level === 'error') {
        console.log(`   ${c.red('✗')} ${issue.message}`)
        totalErrors++
      }
    }
    console.log()
  }

  // ── MCP startup checks ──────────────────────────────────────────────────
  // Collect all installed MCPs across adapters (deduplicated by slug)
  const seen    = new Map() // slug → { command, args, env }
  for (const adapter of ALL_ADAPTERS) {
    if (!await adapter.detect()) continue
    for (const cfg of await adapter.listInstalledWithConfig()) {
      if (!seen.has(cfg.slug)) seen.set(cfg.slug, cfg)
    }
  }

  if (seen.size === 0) return // nothing installed

  section('MCP Server Health')
  console.log()

  const mcps = [...seen.values()]

  // Partition: skip docker/remote, flag missing env, queue for startup check
  const toCheck   = []
  const skipped   = []
  const missingEnv = []

  for (const { slug, command, args, env } of mcps) {
    if (command === 'docker') {
      skipped.push({ slug, reason: 'docker – skipped' })
      continue
    }
    if (!command) {
      skipped.push({ slug, reason: 'no command – skipped' })
      continue
    }
    const emptyKeys = Object.entries(env).filter(([, v]) => !v).map(([k]) => k)
    if (emptyKeys.length) {
      missingEnv.push({ slug, keys: emptyKeys })
      continue
    }
    toCheck.push({ slug, command, args, env })
  }

  // Show skipped entries quietly
  for (const { slug, reason } of skipped) {
    console.log(`   ${c.dim('○')} ${c.bold(slug.padEnd(34))} ${c.dim(reason)}`)
  }

  // Show missing-env warnings (no spawn attempt)
  for (const { slug, keys } of missingEnv) {
    console.log(`   ${c.yellow('⚠')} ${c.bold(slug.padEnd(34))} missing env: ${c.yellow(keys.join(', '))}`)
    console.log(`      ${c.dim('→')} ${c.dim(`cgcone configure ${slug}`)}`)
    totalWarns++
  }

  // Run startup checks in parallel
  if (toCheck.length > 0) {
    const spin = spinner(`Starting ${toCheck.length} MCP server${toCheck.length > 1 ? 's' : ''}...`).start()
    const results = await Promise.allSettled(
      toCheck.map(({ command, args, env }) => checkMcpStartup(command, args, env))
    )
    spin.stop()

    for (let i = 0; i < toCheck.length; i++) {
      const { slug }  = toCheck[i]
      const settled   = results[i]
      const result    = settled.status === 'fulfilled' ? settled.value : { ok: false, error: settled.reason?.message }

      if (result.ok) {
        console.log(`   ${c.green('✓')} ${c.bold(slug.padEnd(34))} ${c.dim('started')}`)
      } else {
        console.log(`   ${c.red('✗')} ${c.bold(slug.padEnd(34))} ${result.error}`)
        totalErrors++
      }
    }
  }

  console.log()

  // ── summary ─────────────────────────────────────────────────────────────
  if (totalErrors === 0 && totalWarns === 0) {
    success('All checks passed')
  } else {
    if (totalErrors) error(`${totalErrors} error${totalErrors > 1 ? 's' : ''} found`)
    if (totalWarns)  warn(`${totalWarns} warning${totalWarns > 1 ? 's' : ''} found`)
  }
}
