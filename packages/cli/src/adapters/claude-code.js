import { readFile, writeFile, mkdir, access, rename } from 'fs/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { BaseAdapter } from './base.js'

const CONFIG_PATH = join(homedir(), '.claude.json')
const CLAUDE_DIR  = join(homedir(), '.claude')

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Cannot read Claude Code config: ${err.message}`)
  }
}

async function writeConfig(data) {
  await mkdir(homedir(), { recursive: true })
  const tmp = join(tmpdir(), `cgcone-claude-${randomBytes(6).toString('hex')}.json`)
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  await rename(tmp, CONFIG_PATH)
}

function hasBinary(name) {
  try {
    execSync(process.platform === 'win32' ? `where ${name}` : `which ${name}`, { stdio: 'ignore' })
    return true
  } catch { return false }
}

export class ClaudeCodeAdapter extends BaseAdapter {
  get name() { return 'Claude Code' }
  get id()   { return 'claude-code' }

  async detect() {
    if (hasBinary('claude')) return true
    try { await access(CLAUDE_DIR); return true } catch { return false }
  }

  async install(slug, config) {
    const data = await readConfig()
    if (!data.mcpServers) data.mcpServers = {}
    data.mcpServers[slug] = {
      command: config.command,
      args:    config.args ?? [],
      ...(config.env && Object.keys(config.env).length ? { env: config.env } : {}),
    }
    await writeConfig(data)
    return { ok: true }
  }

  async uninstall(slug) {
    const data = await readConfig()
    if (!data.mcpServers?.[slug]) {
      return { ok: false, message: `${slug} not found in Claude Code config` }
    }
    delete data.mcpServers[slug]
    await writeConfig(data)
    return { ok: true }
  }

  async listInstalled() {
    const data = await readConfig()
    return Object.keys(data.mcpServers ?? {})
  }

  async listInstalledWithConfig() {
    const data = await readConfig()
    return Object.entries(data.mcpServers ?? {}).map(([slug, cfg]) => ({
      slug,
      command: cfg.command ?? '',
      args:    cfg.args ?? [],
      env:     cfg.env ?? {},
    }))
  }

  async getEnv(slug) {
    const data = await readConfig()
    return data.mcpServers?.[slug]?.env ?? {}
  }

  async setEnv(slug, env) {
    const data = await readConfig()
    if (!data.mcpServers?.[slug]) return { ok: false, message: `${slug} not found in Claude Code config` }
    data.mcpServers[slug].env = env
    await writeConfig(data)
    return { ok: true }
  }

  async preview(slug, config) {
    const data = await readConfig()
    const existing = data.mcpServers?.[slug] ?? null
    const entry = {
      command: config.command,
      args:    config.args ?? [],
      ...(config.env && Object.keys(config.env).length ? { env: config.env } : {}),
    }
    return { configPath: CONFIG_PATH, action: existing ? 'update' : 'add', slug, entry, existing }
  }

  async doctor() {
    const issues = []

    if (!hasBinary('claude')) {
      issues.push({ level: 'warn', message: 'claude binary not found in PATH' })
    }

    try {
      const raw = await readFile(CONFIG_PATH, 'utf8')
      JSON.parse(raw)
      issues.push({ level: 'ok', message: `~/.claude.json valid` })
    } catch (err) {
      issues.push(err.code === 'ENOENT'
        ? { level: 'warn', message: '~/.claude.json not found - created on first install' }
        : { level: 'error', message: `~/.claude.json invalid JSON: ${err.message}` })
    }

    if (!hasBinary('npx')) {
      issues.push({ level: 'error', message: 'npx not found - required to run most MCP servers' })
    } else {
      issues.push({ level: 'ok', message: 'npx available' })
    }

    return issues
  }
}
