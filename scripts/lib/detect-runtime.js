const { fetchFileContent } = require('./github')

/**
 * Parse package name from pyproject.toml content.
 * Handles both [project] name = "foo" and [tool.poetry] name = "foo"
 */
function parsePyprojectName(content) {
  const m = content.match(/^\[(?:project|tool\.poetry)\][^\[]*?^name\s*=\s*["']([^"']+)["']/ms)
  return m ? m[1] : null
}

/**
 * Detect install runtime for a GitHub repo.
 * Checks for package.json (npm), pyproject.toml (uvx), Dockerfile (docker).
 *
 * Returns:
 * { type: 'npm'|'uvx'|'docker'|'unknown', command, args, packageName, env }
 */
async function detectRuntime(owner, repo, branch = null) {
  // Try package.json first
  const pkgJson = await fetchFileContent(owner, repo, 'package.json', branch)
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson)
      const name = pkg.name
      if (name && !name.startsWith('_') && !name.includes(' ')) {
        const envVars = {}
        // Scan for common env var patterns in scripts/readme hints
        // (full README parsing done separately; here just trust package.json name)
        return {
          type:        'npm',
          command:     'npx',
          args:        ['-y', name],
          packageName: name,
          env:         envVars,
        }
      }
    } catch {}
  }

  // Try pyproject.toml
  const pyproject = await fetchFileContent(owner, repo, 'pyproject.toml', branch)
  if (pyproject) {
    const name = parsePyprojectName(pyproject)
    if (name) {
      return {
        type:        'uvx',
        command:     'uvx',
        args:        [name],
        packageName: name,
        env:         {},
      }
    }
    // pyproject exists but couldn't parse name — still a Python project
    return {
      type:        'uvx',
      command:     'uvx',
      args:        [`${owner}/${repo}`],
      packageName: null,
      env:         {},
      uncertain:   true,
    }
  }

  // Try Dockerfile
  const dockerfile = await fetchFileContent(owner, repo, 'Dockerfile', branch)
  if (dockerfile) {
    return { type: 'docker', command: null, args: null, packageName: null, env: {} }
  }

  return { type: 'unknown', command: null, args: null, packageName: null, env: {} }
}

/**
 * Build the registry installConfig from a detected runtime.
 * Returns null if runtime is docker or unknown (can't auto-install).
 */
function runtimeToInstallConfig(runtime) {
  if (!runtime || !runtime.command) return null
  return {
    command: runtime.command,
    args:    runtime.args,
    env:     runtime.env ?? {},
    type:    runtime.type,
    ...(runtime.uncertain ? { uncertain: true } : {}),
  }
}

module.exports = { detectRuntime, runtimeToInstallConfig, parsePyprojectName }
