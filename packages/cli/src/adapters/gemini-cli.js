import { readFile, writeFile, mkdir, rename, readdir, lstat, access } from 'fs/promises'
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

async function findBrokenSkillSymlinks(extensionsDir) {
  const broken = []
  let extDirs
  try { extDirs = await readdir(extensionsDir) } catch { return broken }
  for (const ext of extDirs) {
    const skillsDir = join(extensionsDir, ext, 'skills')
    let skillDirs
    try { skillDirs = await readdir(skillsDir) } catch { continue }
    for (const skill of skillDirs) {
      const skillPath = join(skillsDir, skill)
      let entries
      try { entries = await readdir(skillPath) } catch { continue }
      for (const entry of entries) {
        const full = join(skillPath, entry)
        try {
          const stat = await lstat(full)
          if (stat.isSymbolicLink()) {
            // lstat succeeds on symlinks; access checks if the target exists
            try { await access(full) } catch { broken.push(full) }
          }
        } catch { /* skip unreadable */ }
      }
    }
  }
  return broken
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
    if (!data.mcpServers?.[slug]) return { ok: false, message: `${slug} not found in Gemini CLI config` }
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
        ? { level: 'warn', message: '~/.gemini/settings.json not found - created on first install' }
        : { level: 'error', message: `~/.gemini/settings.json invalid JSON: ${err.message}` })
    }

    // Check for broken symlinks in extension skill dirs — Gemini creates temp-dir symlinks
    // that break after system reboot or tmpdir cleanup.
    const brokenLinks = await findBrokenSkillSymlinks(join(homedir(), '.gemini', 'extensions'))
    for (const link of brokenLinks) {
      const display = link.replace(homedir(), '~')
      issues.push({ level: 'error', message: `Broken skill symlink: ${display}` })
    }
    if (brokenLinks.length > 0) {
      issues.push({ level: 'warn', message: `Run: cgcone doctor --fix-gemini-skills  (or re-install the extension)` })
    }

    return issues
  }
}
