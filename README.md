# cgcone

**npm for AI CLIs.** One command installs any MCP server, plugin, or skill to every AI CLI on your machine.

```bash
npm install -g cgcone
cgcone install filesystem-mcp
```

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/cgcone)](https://www.npmjs.com/package/cgcone)

---

## What it does

You have Claude Code. Maybe Gemini CLI. Maybe OpenAI Codex. Each has its own config format, its own location, its own way to add MCP servers. cgcone abstracts that away.

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
| Claude Code | `~/.claude.json` | ✅ Supported |
| Gemini CLI | `~/.gemini/settings.json` | ✅ Supported |
| OpenAI Codex | `~/.codex/config.toml` | ✅ Supported |
| GitHub Copilot CLI | `~/.copilot/mcp-config.json` | ✅ Supported |

## Commands

```bash
cgcone scan                       # detect AI CLIs on this machine
cgcone install <name>             # install to all detected CLIs
cgcone install <name> --for claude-code  # install to one CLI only
cgcone uninstall <name>           # remove from all CLIs
cgcone list                       # show installed extensions
cgcone search <query>             # search the registry
cgcone info <name>                # show details, version, security status
cgcone doctor                     # diagnose broken installs and configs
cgcone update <name>              # update an extension
cgcone update --all               # update everything
```

## Install

Requires Node.js 18+.

```bash
npm install -g cgcone
```

## Registry

cgcone pulls from [cgcone.com/registry.json](https://cgcone.com/registry.json) — 380+ extensions indexed from:

- [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) — official MCP registry
- Docker Hub `mcp/` organization
- Community submissions (open a PR or issue)

Browse at **[cgcone.com](https://cgcone.com)**.

## Repository structure

```
cgcone/
├── app/              Next.js website (cgcone.com)
├── components/
├── lib/
├── scripts/          registry crawlers (fetch-mcp-official, fetch-readme, etc.)
├── public/
│   └── registry.json
├── packages/
│   └── cli/          cgcone npm CLI package
│       └── src/
│           ├── index.js
│           ├── adapters/   per-CLI config adapters
│           └── commands/   scan, install, uninstall, list, search, info, doctor, update
├── content/          community skills, subagents, commands, hooks (Markdown)
├── CONTRIBUTING.md
└── LICENSE
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

- Submit a skill, subagent, command, or hook: open a PR adding a file to `content/`
- Submit an MCP server: [open an issue](../../issues/new?template=extension_submission.yml)
- Bug reports and feature requests: [GitHub Issues](../../issues)

## License

MIT — see [LICENSE](LICENSE).
