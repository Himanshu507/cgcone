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
 * Gemini CLI adapter — detection only for now.
 * Full install/uninstall pending Gemini CLI extension config spec.
 * Community contributions welcome: see CONTRIBUTING.md
 */
export class GeminiCLIAdapter extends BaseAdapter {
  get name() { return 'Gemini CLI' }
  get id()   { return 'gemini-cli' }

  async detect() {
    return hasBinary('gemini')
  }

  async install(_slug, _config) {
    return { ok: false, message: 'Gemini CLI adapter not yet implemented. Contributions welcome at github.com/Himanshu507/cgcone' }
  }

  async uninstall(_slug) {
    return { ok: false, message: 'Gemini CLI adapter not yet implemented.' }
  }

  async listInstalled() { return [] }

  async doctor() {
    const detected = await this.detect()
    return [
      detected
        ? { level: 'ok',   message: 'gemini binary found in PATH' }
        : { level: 'warn', message: 'gemini binary not found in PATH' },
      { level: 'warn', message: 'Full Gemini CLI support coming soon — see CONTRIBUTING.md to help' },
    ]
  }
}
