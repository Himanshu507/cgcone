# @cgcone/cli

**npm for AI CLIs.** One command installs any MCP server, plugin, or skill to every AI CLI on your machine.

```bash
npm install -g @cgcone/cli
cgcone install filesystem-mcp
```

[![npm](https://img.shields.io/npm/v/@cgcone/cli)](https://www.npmjs.com/package/@cgcone/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Himanshu507/cgcone/blob/main/LICENSE)

![cgcone demo](https://raw.githubusercontent.com/Himanshu507/cgcone/main/docs/images/demo.gif)

---

## What it does

You have Claude Code. Maybe Gemini CLI. Maybe OpenAI Codex. Each has its own config format, its own location, its own way to add MCP servers. cgcone abstracts all of that away.

```
$ cgcone scan
  ✓ Claude Code    ~/.claude.json
  ✓ Gemini CLI     ~/.gemini/settings.json
  ✓ OpenAI Codex   ~/.codex/config.toml

$ cgcone install github-mcp
  ✓ Claude Code  → configured
  ✓ Gemini CLI   → configured
  ✓ OpenAI Codex → configured
  ✓ github-mcp installed in 1.2s
```

## Supported CLIs

| CLI | Config location | Status |
|-----|----------------|--------|
| Claude Code | `~/.claude.json` | ✅ |
| Gemini CLI | `~/.gemini/settings.json` | ✅ |
| OpenAI Codex | `~/.codex/config.toml` | ✅ |
| GitHub Copilot CLI | `~/.copilot/mcp-config.json` | ✅ |

## Install

Requires Node.js 18+.

```bash
npm install -g @cgcone/cli
```

> If the install hangs for more than a minute, npm's post-install audit step is likely stalling on your network. Use:
> ```bash
> npm install -g @cgcone/cli --no-audit
> ```

## Commands

```bash
cgcone scan                              # detect AI CLIs on this machine
cgcone install <name>                    # install to all detected CLIs
cgcone install <name> --for claude-code  # install to one CLI only
cgcone uninstall <name>                  # remove from all CLIs
cgcone list                              # show installed extensions + which CLI
cgcone search <query>                    # search the registry
cgcone info <name>                       # details, version, security status
cgcone doctor                            # diagnose broken installs and configs
cgcone update <name>                     # update an extension
cgcone update --all                      # update everything
```

## Usage examples

```bash
# Install a GitHub MCP server to all your AI CLIs at once
cgcone install github-mcp

# Install only to Claude Code
cgcone install filesystem-mcp --for claude-code

# Search the registry
cgcone search database

# Check what's installed and where
cgcone list

# Diagnose config problems
cgcone doctor
```

## Registry

cgcone fetches from [cgcone.com/registry.json](https://cgcone.com/registry.json) — 380+ extensions indexed from the official MCP registry, Docker Hub, and community submissions. Registry is cached locally at `~/.cgcone/registry-cache.json` with a 1-hour TTL.

Browse the full registry at **[cgcone.com](https://cgcone.com)**.

## How install works

When you run `cgcone install <name>`:

1. Fetches the registry (or uses local cache)
2. Finds the extension by slug
3. Resolves the install config — npm package, pypi package, or Docker image
4. Writes the config to each detected CLI's config file atomically (temp file + rename)
5. Reports success per CLI

## Contributing

See [CONTRIBUTING.md](https://github.com/Himanshu507/cgcone/blob/main/CONTRIBUTING.md) — submit extensions, add CLI adapters, or improve the CLI.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Himanshu507/cgcone&type=Date)](https://star-history.com/#Himanshu507/cgcone&Date)

---

## License

MIT — see [LICENSE](https://github.com/Himanshu507/cgcone/blob/main/LICENSE).
