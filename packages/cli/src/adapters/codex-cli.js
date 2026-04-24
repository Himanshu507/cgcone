import { execSync } from 'child_process'
import { BaseAdapter } from './base.js'

function hasBinary(name) {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`
    execSync(cmd, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * OpenAI Codex CLI adapter — detection only for now.
 * Community contributions welcome: see CONTRIBUTING.md
 */
export class CodexCLIAdapter extends BaseAdapter {
  get name() { return 'Codex CLI' }
  get id()   { return 'codex-cli' }

  async detect() {
    return hasBinary('codex')
  }

  async install(_slug, _config) {
    return { ok: false, message: 'Codex CLI adapter not yet implemented. Contributions welcome at github.com/Himanshu507/cgcone' }
  }

  async uninstall(_slug) {
    return { ok: false, message: 'Codex CLI adapter not yet implemented.' }
  }

  async listInstalled() { return [] }

  async doctor() {
    const detected = await this.detect()
    return [
      detected
        ? { level: 'ok',   message: 'codex binary found in PATH' }
        : { level: 'warn', message: 'codex binary not found in PATH' },
      { level: 'warn', message: 'Full Codex CLI support coming soon — see CONTRIBUTING.md to help' },
    ]
  }
}
