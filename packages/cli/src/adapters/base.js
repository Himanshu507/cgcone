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
   * Get env vars currently stored for an installed MCP slug.
   * @returns {Promise<Record<string,string>>}
   */
  async getEnv(_slug) { return {} }

  /**
   * Overwrite env vars for an installed MCP slug.
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async setEnv(_slug, _env) { return { ok: false, message: 'not implemented' } }

  /**
   * Run health checks.
   * @returns {Promise<Array<{ level: 'error'|'warn'|'ok', message: string }>>}
   */
  async doctor() { return [] }

  /**
   * Preview what install() would write without touching the config file.
   * @param {string} slug
   * @param {{ command: string, args: string[], env?: Record<string,string> }} config
   * @returns {Promise<{ configPath: string, action: 'add'|'update', slug: string, entry: object, existing: object|null } | null>}
   */
  async preview(_slug, _config) { return null }
}
