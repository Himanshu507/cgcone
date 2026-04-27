import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { parse, stringify } from 'smol-toml'
import { BaseAdapter } from './base.js'

// Codex uses TOML config with mcp_servers (snake_case) table
const CONFIG_PATH = join(homedir(), '.codex', 'config.toml')

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    return parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Cannot read Codex config: ${err.message}`)
  }
}

async function writeConfig(doc) {
  await mkdir(join(homedir(), '.codex'), { recursive: true })
  const tmp = join(tmpdir(), `cgcone-codex-${randomBytes(6).toString('hex')}.toml`)
  await writeFile(tmp, stringify(doc), 'utf8')
  await rename(tmp, CONFIG_PATH)
}

function hasBinary(name) {
  try {
    execSync(process.platform === 'win32' ? `where ${name}` : `which ${name}`, { stdio: 'ignore' })
    return true
  } catch { return false }
}

export class CodexCLIAdapter extends BaseAdapter {
  get name() { return 'Codex CLI' }
  get id()   { return 'codex-cli' }

  async detect() { return hasBinary('codex') }

  async install(slug, config) {
    const doc = await readConfig()
    if (!doc.mcp_servers) doc.mcp_servers = {}
    const entry = { enabled: true }
    if (config.command) entry.command = config.command
    if (config.args?.length) entry.args = config.args
    if (config.env && Object.keys(config.env).length) entry.env = config.env
    doc.mcp_servers[slug] = entry
    await writeConfig(doc)
    return { ok: true }
  }

  async uninstall(slug) {
    const doc = await readConfig()
    if (!doc.mcp_servers?.[slug]) {
      return { ok: false, message: `${slug} not found in Codex config` }
    }
    const { [slug]: _, ...rest } = doc.mcp_servers
    doc.mcp_servers = rest
    await writeConfig(doc)
    return { ok: true }
  }

  async listInstalled() {
    const doc = await readConfig()
    return Object.keys(doc.mcp_servers ?? {})
  }

  async getEnv(slug) {
    const doc = await readConfig()
    return doc.mcp_servers?.[slug]?.env ?? {}
  }

  async setEnv(slug, env) {
    const doc = await readConfig()
    if (!doc.mcp_servers?.[slug]) return { ok: false, message: `${slug} not found in Codex config` }
    doc.mcp_servers[slug].env = env
    await writeConfig(doc)
    return { ok: true }
  }

  async doctor() {
    const issues = []
    if (!hasBinary('codex')) {
      issues.push({ level: 'warn', message: 'codex binary not found in PATH' })
    } else {
      issues.push({ level: 'ok', message: 'codex binary found' })
    }
    try {
      const raw = await readFile(CONFIG_PATH, 'utf8')
      parse(raw)
      issues.push({ level: 'ok', message: '~/.codex/config.toml valid' })
    } catch (err) {
      issues.push(err.code === 'ENOENT'
        ? { level: 'warn', message: '~/.codex/config.toml not found - created on first install' }
        : { level: 'error', message: `~/.codex/config.toml invalid TOML: ${err.message}` })
    }
    return issues
  }
}
