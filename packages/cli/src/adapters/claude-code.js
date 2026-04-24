import { readFile, writeFile, mkdir, access } from 'fs/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'
import { BaseAdapter } from './base.js'

const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json')
const CLAUDE_DIR    = join(homedir(), '.claude')

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Cannot read Claude Code settings: ${err.message}`)
  }
}

async function writeSettings(data) {
  await mkdir(CLAUDE_DIR, { recursive: true })
  // Atomic: write to temp file then rename isn't available in Node easily,
  // so write directly — settings.json is small and low-risk.
  await writeFile(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function hasBinary(name) {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`
    execSync(cmd, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export class ClaudeCodeAdapter extends BaseAdapter {
  get name() { return 'Claude Code' }
  get id()   { return 'claude-code' }

  async detect() {
    // Check binary in PATH first
    if (hasBinary('claude')) return true
    // Fall back: check if ~/.claude/ directory exists
    try {
      await access(CLAUDE_DIR)
      return true
    } catch {
      return false
    }
  }

  async install(slug, config) {
    const settings = await readSettings()
    if (!settings.mcpServers) settings.mcpServers = {}

    if (settings.mcpServers[slug]) {
      return { ok: true, message: 'already installed — updated config' }
    }

    settings.mcpServers[slug] = {
      command: config.command,
      args:    config.args,
      ...(config.env && Object.keys(config.env).length ? { env: config.env } : {}),
      type:    'stdio',
    }

    await writeSettings(settings)
    return { ok: true }
  }

  async uninstall(slug) {
    const settings = await readSettings()
    if (!settings.mcpServers?.[slug]) {
      return { ok: false, message: `${slug} not found in Claude Code config` }
    }

    delete settings.mcpServers[slug]
    await writeSettings(settings)
    return { ok: true }
  }

  async listInstalled() {
    const settings = await readSettings()
    return Object.keys(settings.mcpServers ?? {})
  }

  async doctor() {
    const issues = []

    // Check binary
    if (!hasBinary('claude')) {
      issues.push({ level: 'warn', message: 'claude binary not found in PATH (Claude Code may still work if installed differently)' })
    }

    // Check settings.json readable + valid JSON
    try {
      const raw = await readFile(SETTINGS_PATH, 'utf8')
      JSON.parse(raw)
      issues.push({ level: 'ok', message: `settings.json valid at ${SETTINGS_PATH}` })
    } catch (err) {
      if (err.code === 'ENOENT') {
        issues.push({ level: 'warn', message: `settings.json not found at ${SETTINGS_PATH} — will be created on first install` })
      } else {
        issues.push({ level: 'error', message: `settings.json is invalid JSON: ${err.message}` })
      }
    }

    // Check npx available (needed for most MCP installs)
    if (!hasBinary('npx')) {
      issues.push({ level: 'error', message: 'npx not found — required to run most MCP servers' })
    } else {
      issues.push({ level: 'ok', message: 'npx available' })
    }

    return issues
  }
}
