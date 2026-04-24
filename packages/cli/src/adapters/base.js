/**
 * Base adapter interface. Every CLI adapter extends this.
 * Only `name`, `detect`, `install`, `uninstall`, `listInstalled`, `doctor` are required.
 */
export class BaseAdapter {
  /** Human-readable CLI name, e.g. "Claude Code" */
  get name() { throw new Error('not implemented') }

  /** CLI identifier used in store keys, e.g. "claude-code" */
  get id() { throw new Error('not implemented') }

  /** Returns true if this CLI is installed on the current machine */
  async detect() { return false }

  /**
   * Install an extension.
   * @param {string} slug
   * @param {{ command: string, args: string[], env?: Record<string,string> }} config
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async install(_slug, _config) { return { ok: false, message: 'not implemented' } }

  /**
   * Uninstall an extension by slug.
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async uninstall(_slug) { return { ok: false, message: 'not implemented' } }

  /**
   * List slugs of all extensions installed in this CLI.
   * @returns {Promise<string[]>}
   */
  async listInstalled() { return [] }

  /**
   * Run health checks.
   * @returns {Promise<Array<{ level: 'error'|'warn'|'ok', message: string }>>}
   */
  async doctor() { return [] }
}
