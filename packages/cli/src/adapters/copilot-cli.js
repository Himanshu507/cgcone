import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { BaseAdapter } from './base.js'

const CONFIG_PATH = join(homedir(), '.copilot', 'mcp-config.json')

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Cannot read Copilot CLI config: ${err.message}`)
  }
}

async function writeConfig(data) {
  await mkdir(join(homedir(), '.copilot'), { recursive: true })
  const tmp = join(tmpdir(), `cgcone-copilot-${randomBytes(6).toString('hex')}.json`)
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  await rename(tmp, CONFIG_PATH)
}

function hasBinary(name) {
  try {
    execSync(process.platform === 'win32' ? `where ${name}` : `which ${name}`, { stdio: 'ignore' })
    return true
  } catch { return false }
}

export class CopilotCLIAdapter extends BaseAdapter {
  get name() { return 'GitHub Copilot CLI' }
  get id()   { return 'copilot-cli' }

  async detect() { return hasBinary('copilot') }

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
      return { ok: false, message: `${slug} not found in Copilot CLI config` }
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
    if (!data.mcpServers?.[slug]) return { ok: false, message: `${slug} not found in Copilot CLI config` }
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
    if (!hasBinary('copilot')) {
      issues.push({ level: 'warn', message: 'copilot binary not found in PATH' })
    } else {
      issues.push({ level: 'ok', message: 'copilot binary found' })
    }
    try {
      const raw = await readFile(CONFIG_PATH, 'utf8')
      JSON.parse(raw)
      issues.push({ level: 'ok', message: '~/.copilot/mcp-config.json valid' })
    } catch (err) {
      issues.push(err.code === 'ENOENT'
        ? { level: 'warn', message: '~/.copilot/mcp-config.json not found - created on first install' }
        : { level: 'error', message: `~/.copilot/mcp-config.json invalid JSON: ${err.message}` })
    }
    return issues
  }
}
