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

$ cgcone install brave-search
  ◆ BRAVE_API_KEY - Your Brave Search API key
  │ ••••••••••••••••••••••••

  ✓ Claude Code  → configured
  ✓ Gemini CLI   → configured
  ✓ OpenAI Codex → configured
  ✓ brave-search installed
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
cgcone install <name> --dry-run          # preview config changes without writing
cgcone uninstall <name>                  # remove from all CLIs
cgcone configure <name>                  # update API keys / env vars for an installed MCP
cgcone list                              # show installed extensions + which CLI
cgcone search <query>                    # search the registry
cgcone info <name>                       # details, version, install config
cgcone doctor                            # validate configs + test MCP server startup
cgcone update <name>                     # update an extension
cgcone update --all                      # update everything
```

## Usage examples

```bash
# Install a GitHub MCP server to all your AI CLIs at once
cgcone install github-mcp

# Install only to Claude Code
cgcone install filesystem-mcp --for claude-code

# Preview exactly what would be written before committing
cgcone install brave-search --dry-run

# Update an API key after install
cgcone configure brave-search

# Search the registry
cgcone search database

# Check what's installed and where
cgcone list

# Diagnose config problems and verify MCP servers actually start
cgcone doctor
```

## Registry

cgcone fetches from the [cgcone GitHub registry](https://github.com/Himanshu507/cgcone/blob/main/public/registry.json) — 2400+ extensions indexed from:

- Official [modelcontextprotocol.io](https://modelcontextprotocol.io) registry
- GitHub repositories tagged `mcp-server`, `model-context-protocol`
- Claude Code plugins and skills
- Community subagents, commands, and hooks

Registry is cached locally at `~/.cgcone/registry-cache.json` with a 1-hour TTL.

Browse the full registry at **[cgcone.com](https://cgcone.com)**.

## How install works

When you run `cgcone install <name>`:

1. Fetches the registry (or uses local 1-hour cache)
2. Finds the extension by slug — interactive picker if multiple matches
3. Checks npm compatibility: Node version and SDK pinning (npm packages only)
4. Prompts for required API keys / env vars (masked input for sensitive values)
5. Writes the config to each detected CLI's config file atomically (temp file + rename)
6. For Codex: preserves all existing comments and non-MCP sections in `config.toml`
7. Reports success per CLI

## How doctor works

`cgcone doctor` goes beyond config validation:

1. Verifies each CLI binary is in PATH and config file is valid
2. For every installed MCP server: spawns the process, sends an MCP `initialize` handshake, confirms it responds
3. Flags servers with empty / missing env vars with the exact `cgcone configure <slug>` fix command
4. Docker-based servers are noted but skipped (require additional setup)

## Contributing

See [CONTRIBUTING.md](https://github.com/Himanshu507/cgcone/blob/main/CONTRIBUTING.md) - submit extensions, add CLI adapters, or improve the CLI.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Himanshu507/cgcone&type=Date)](https://star-history.com/#Himanshu507/cgcone&Date)

---

## License

MIT - see [LICENSE](https://github.com/Himanshu507/cgcone/blob/main/LICENSE).
