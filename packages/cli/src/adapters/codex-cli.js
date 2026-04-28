import { readFile, writeFile, mkdir, rename } from 'fs/promises'
import { execSync } from 'child_process'
import { join } from 'path'
import { homedir, tmpdir } from 'os'
import { randomBytes } from 'crypto'
import { parse } from 'smol-toml'
import { BaseAdapter } from './base.js'

// Codex uses TOML config with mcp_servers (snake_case) table
const CONFIG_PATH = join(homedir(), '.codex', 'config.toml')

// ── TOML string surgery helpers ──────────────────────────────────────────────
// We write back raw TOML strings instead of parse→stringify so that user
// comments outside the managed mcp_servers sections are preserved.

function tomlLiteral(s) {
  // JSON double-quoted strings are valid TOML basic strings (same escape rules)
  return JSON.stringify(String(s))
}

function tomlArray(arr) {
  return '[ ' + arr.map(tomlLiteral).join(', ') + ' ]'
}

/** Render a [mcp_servers.slug] section (+ optional .env subsection) as lines. */
function formatSection(slug, config) {
  const lines = []
  lines.push(`[mcp_servers.${slug}]`)
  lines.push(`enabled = true`)
  if (config.command) lines.push(`command = ${tomlLiteral(config.command)}`)
  if (config.args?.length) lines.push(`args = ${tomlArray(config.args)}`)

  const envEntries = Object.entries(config.env ?? {}).filter(([, v]) => v !== undefined && v !== null)
  if (envEntries.length) {
    lines.push(``)
    lines.push(`[mcp_servers.${slug}.env]`)
    for (const [k, v] of envEntries) lines.push(`${k} = ${tomlLiteral(v)}`)
  }
  return lines
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Add or replace the [mcp_servers.slug] section (incl. subsections like .env)
 * in a line array, preserving everything else verbatim.
 */
function spliceMcpSection(lines, slug, newSectionLines) {
  const slugEsc   = escapeRe(slug)
  const headerPat = new RegExp(`^\\[mcp_servers\\.${slugEsc}\\]\\s*$`)
  const subPat    = new RegExp(`^\\[mcp_servers\\.${slugEsc}\\.`)

  const startIdx = lines.findIndex(l => headerPat.test(l))

  if (startIdx === -1) {
    // Append at end — ensure one blank separator line
    const result = [...lines]
    if (result.length > 0 && result[result.length - 1].trim() !== '') result.push('')
    result.push(...newSectionLines)
    return result
  }

  // Find end: next [header] that isn't a subsection of slug
  let endIdx = startIdx + 1
  while (endIdx < lines.length) {
    if (lines[endIdx].startsWith('[') && !subPat.test(lines[endIdx])) break
    endIdx++
  }

  // Trim trailing blank lines before the end marker
  while (endIdx > startIdx + 1 && lines[endIdx - 1].trim() === '') endIdx--

  return [
    ...lines.slice(0, startIdx),
    ...newSectionLines,
    '',                    // blank separator after section
    ...lines.slice(endIdx),
  ]
}

/** Remove the [mcp_servers.slug] section (incl. subsections) from a line array. */
function removeMcpSection(lines, slug) {
  const slugEsc   = escapeRe(slug)
  const headerPat = new RegExp(`^\\[mcp_servers\\.${slugEsc}\\]\\s*$`)
  const subPat    = new RegExp(`^\\[mcp_servers\\.${slugEsc}\\.`)

  const startIdx = lines.findIndex(l => headerPat.test(l))
  if (startIdx === -1) return lines

  let endIdx = startIdx + 1
  while (endIdx < lines.length) {
    if (lines[endIdx].startsWith('[') && !subPat.test(lines[endIdx])) break
    endIdx++
  }

  // Also swallow one preceding blank line (section separator)
  const removeFrom = startIdx > 0 && lines[startIdx - 1].trim() === ''
    ? startIdx - 1
    : startIdx

  return [...lines.slice(0, removeFrom), ...lines.slice(endIdx)]
}

// ── raw file I/O ─────────────────────────────────────────────────────────────

async function readRaw() {
  try { return await readFile(CONFIG_PATH, 'utf8') }
  catch (err) { if (err.code === 'ENOENT') return ''; throw err }
}

async function writeRaw(content) {
  await mkdir(join(homedir(), '.codex'), { recursive: true })
  const tmp = join(tmpdir(), `cgcone-codex-${randomBytes(6).toString('hex')}.toml`)
  await writeFile(tmp, content, 'utf8')
  await rename(tmp, CONFIG_PATH)
}

/** Parse the TOML doc (for reads). Throws on invalid TOML. */
async function readConfig() {
  try {
    const raw = await readRaw()
    if (!raw.trim()) return {}
    return parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Cannot read Codex config: ${err.message}`)
  }
}

/** Convert raw string to normalized line array (no trailing empty from final \n). */
function toLines(raw) {
  const lines = raw.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

// ── adapter ──────────────────────────────────────────────────────────────────

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
    const raw   = await readRaw()
    const lines = toLines(raw)
    const modified = spliceMcpSection(lines, slug, formatSection(slug, config))
    await writeRaw(modified.join('\n') + '\n')
    return { ok: true }
  }

  async uninstall(slug) {
    const raw   = await readRaw()
    const lines = toLines(raw)
    const headerPat = new RegExp(`^\\[mcp_servers\\.${escapeRe(slug)}\\]\\s*$`)
    if (!lines.some(l => headerPat.test(l))) {
      return { ok: false, message: `${slug} not found in Codex config` }
    }
    const modified = removeMcpSection(lines, slug)
    await writeRaw(modified.join('\n') + '\n')
    return { ok: true }
  }

  async listInstalled() {
    const doc = await readConfig()
    return Object.keys(doc.mcp_servers ?? {})
  }

  async listInstalledWithConfig() {
    const doc = await readConfig()
    return Object.entries(doc.mcp_servers ?? {}).map(([slug, cfg]) => ({
      slug,
      command: cfg.command ?? '',
      args:    cfg.args ?? [],
      env:     cfg.env ?? {},
    }))
  }

  async getEnv(slug) {
    const doc = await readConfig()
    return doc.mcp_servers?.[slug]?.env ?? {}
  }

  async setEnv(slug, env) {
    const doc = await readConfig()
    if (!doc.mcp_servers?.[slug]) return { ok: false, message: `${slug} not found in Codex config` }
    // Rebuild section with current command/args + new env
    const existing = doc.mcp_servers[slug]
    const merged = {
      command: existing.command,
      args:    existing.args ?? [],
      env,
    }
    const raw   = await readRaw()
    const lines = toLines(raw)
    const modified = spliceMcpSection(lines, slug, formatSection(slug, merged))
    await writeRaw(modified.join('\n') + '\n')
    return { ok: true }
  }

  async preview(slug, config) {
    const doc = await readConfig()
    const existing = doc.mcp_servers?.[slug] ?? null
    const entry = { enabled: true }
    if (config.command) entry.command = config.command
    if (config.args?.length) entry.args = config.args
    if (config.env && Object.keys(config.env).length) entry.env = config.env
    return { configPath: CONFIG_PATH, action: existing ? 'update' : 'add', slug, entry, existing }
  }

  async doctor() {
    const issues = []
    if (!hasBinary('codex')) {
      issues.push({ level: 'warn', message: 'codex binary not found in PATH' })
    } else {
      issues.push({ level: 'ok', message: 'codex binary found' })
    }
    try {
      const raw = await readRaw()
      if (raw.trim()) parse(raw)
      issues.push({ level: 'ok', message: '~/.codex/config.toml valid' })
    } catch (err) {
      issues.push(err.code === 'ENOENT'
        ? { level: 'warn', message: '~/.codex/config.toml not found - created on first install' }
        : { level: 'error', message: `~/.codex/config.toml invalid TOML: ${err.message}` })
    }
    return issues
  }
}
