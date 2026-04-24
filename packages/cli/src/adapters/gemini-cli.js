import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { BaseAdapter } from './base.js'

const CONFIG_PATH = join(homedir(), '.gemini', 'settings.json')

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Cannot read Gemini CLI config: ${err.message}`)
  }
}

async function writeConfig(data) {
  await mkdir(join(homedir(), '.gemini'), { recursive: true })
  const tmp = join(tmpdir(), `cgcone-gemini-${randomBytes(6).toString('hex')}.json`)
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8')
  await rename(tmp, CONFIG_PATH)
}

function hasBinary(name) {
  try {
    execSync(process.platform === 'win32' ? `where ${name}` : `which ${name}`, { stdio: 'ignore' })
    return true
  } catch { return false }
}

export class GeminiCLIAdapter extends BaseAdapter {
  get name() { return 'Gemini CLI' }
  get id()   { return 'gemini-cli' }

  async detect() { return hasBinary('gemini') }

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
      return { ok: false, message: `${slug} not found in Gemini CLI config` }
    }
    delete data.mcpServers[slug]
    await writeConfig(data)
    return { ok: true }
  }

  async listInstalled() {
    const data = await readConfig()
    return Object.keys(data.mcpServers ?? {})
  }

  async doctor() {
    const issues = []
    if (!hasBinary('gemini')) {
      issues.push({ level: 'warn', message: 'gemini binary not found in PATH' })
    } else {
      issues.push({ level: 'ok', message: 'gemini binary found' })
    }
    try {
      const raw = await readFile(CONFIG_PATH, 'utf8')
      JSON.parse(raw)
      issues.push({ level: 'ok', message: '~/.gemini/settings.json valid' })
    } catch (err) {
      issues.push(err.code === 'ENOENT'
        ? { level: 'warn', message: '~/.gemini/settings.json not found — created on first install' }
        : { level: 'error', message: `~/.gemini/settings.json invalid JSON: ${err.message}` })
    }
    return issues
  }
}
