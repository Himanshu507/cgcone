# cgcone

**The package manager for AI CLI extensions.**  
One command installs any MCP server, plugin, or skill across every AI CLI on your machine.

```bash
npm install -g @cgcone/cli
cgcone install context7
```

[![npm version](https://img.shields.io/npm/v/@cgcone/cli?color=orange&label=npm)](https://www.npmjs.com/package/@cgcone/cli)
[![npm downloads](https://img.shields.io/npm/dm/@cgcone/cli?color=orange)](https://www.npmjs.com/package/@cgcone/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)

---

## What it does

You have Claude Code. Maybe Gemini CLI. Maybe OpenAI Codex. Each has its own config format, its own file location, its own way to add MCP servers. **cgcone abstracts that away.**

```
$ cgcone scan
  ✓ Claude Code    ~/.claude.json
  ✓ Gemini CLI     ~/.gemini/settings.json
  ✓ OpenAI Codex   ~/.codex/config.toml

$ cgcone install brave-search
  Multiple matches — select one to install:
  ● Brave Search  brave-brave-search-mcp-server  [npm]
  ○ docker-brave-search                          [docker]

  Does this MCP require API keys or env vars? ● Yes
  BRAVE_API_KEY — Your Brave Search API key:  ••••••••••

  ✓ Claude Code  → configured
  ✓ Gemini CLI   → configured
  ✓ OpenAI Codex → configured
  ✓ brave-brave-search-mcp-server installed
```

---

## Install

Requires **Node.js 18+**.

```bash
npm install -g @cgcone/cli
```

---

## Supported CLIs

| CLI | Config file | Status |
|-----|-------------|--------|
| [Claude Code](https://claude.ai/code) | `~/.claude.json` | ✅ |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `~/.gemini/settings.json` | ✅ |
| [OpenAI Codex](https://github.com/openai/codex) | `~/.codex/config.toml` | ✅ |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line) | `~/.copilot/mcp-config.json` | ✅ |

---

## Commands

```bash
# Discover
cgcone scan                          # detect AI CLIs installed on this machine
cgcone search <query>                # search 2400+ extensions in the registry
cgcone info <name>                   # show details, author, install config

# Install & manage
cgcone install <name>                # install to all detected CLIs (interactive picker if multiple matches)
cgcone install <name> --for claude-code   # install to one CLI only
cgcone uninstall <name>              # remove from all CLIs (fuzzy match + picker)
cgcone configure <name>              # update API keys / env vars for an installed MCP

# Maintenance
cgcone list                          # show installed extensions per CLI
cgcone update <name>                 # update a single extension
cgcone update --all                  # update all installed extensions
cgcone doctor                        # diagnose broken installs and config issues
```

### Interactive install picker

When a search query matches multiple extensions, cgcone shows an interactive selection prompt instead of auto-installing the wrong one:

```
◆ Multiple matches — select one to install:
│ ● Context7  upstash-context7  [npm]
│ ○ Context7  docker-context7   [docker]
└
```

Arrow keys to navigate, Enter to confirm. npm entries are listed first.

### API key configuration

MCPs that require API keys prompt you interactively during install. Sensitive keys are masked:

```
ℹ This MCP requires 1 env var:

◆ BRAVE_API_KEY — Your Brave Search API key
│ ••••••••••••••••••••••••••••••
└

✓ Env vars saved
```

Update them later without reinstalling:

```bash
cgcone configure brave-search
```

---

## Registry

cgcone pulls from **[cgcone.com/registry.json](https://cgcone.com/registry.json)** — 2400+ extensions indexed from:

- Official [modelcontextprotocol.io](https://registry.modelcontextprotocol.io) registry
- GitHub repositories tagged `mcp-server`, `model-context-protocol`
- Claude Code plugins (marketplace.json format)
- Claude Code skills (SKILL.md format)
- Community subagents, commands, and hooks

Browse at **[cgcone.com](https://cgcone.com)**.

---

## Website

![cgcone website](docs/images/mcp-servers.png)

**[cgcone.com](https://cgcone.com)** is a full marketplace UI with:
- **MCP Servers** — 1943 servers, searchable by name, category, source
- **Plugins** — Claude Code plugins with one-line install commands
- **Skills, Subagents, Commands, Hooks** — Claude Code extensions
- Per-entry detail pages with README, install command, tags, links
- Light/dark mode

---

## Repository structure

```
cgcone/
├── app/                  Next.js 15 website (cgcone.com)
│   ├── mcp-server/[slug] MCP detail pages
│   ├── mcp-servers/      MCP listing
│   ├── plugin/[slug]     Plugin detail pages
│   ├── plugins/          Plugin listing
│   ├── skills/           Skills listing
│   ├── subagents/        Subagents listing
│   └── ...
├── components/           Shared UI components
├── lib/                  Shared utilities (registry, types, utils)
├── scripts/              Registry generation pipeline
│   ├── generate-registry.js        orchestrator
│   ├── fetch-mcp-official.js       official MCP registry
│   ├── fetch-mcp-github.js         GitHub topic search
│   ├── fetch-mcp-docker.js         Docker Hub
│   ├── fetch-plugins-github.js     GitHub plugin search
│   ├── fetch-skills-github.js      GitHub skills search
│   └── fetch-readme.js             README batch fetcher
├── public/
│   └── registry.json               generated registry (2400+ entries)
├── packages/
│   └── cli/                        @cgcone/cli npm package
│       └── src/
│           ├── index.js            CLI entry point
│           ├── registry.js         registry fetch + search + fuzzy match
│           ├── store.js            local install tracking (~/.cgcone/)
│           ├── ui.js               chalk/ora helpers
│           ├── adapters/           per-CLI config adapters
│           │   ├── claude-code.js
│           │   ├── gemini-cli.js
│           │   ├── codex-cli.js
│           │   └── copilot-cli.js
│           └── commands/           CLI commands
│               ├── install.js      interactive install + env var prompts
│               ├── uninstall.js    fuzzy uninstall + picker
│               ├── configure.js    post-install env var management
│               ├── search.js
│               ├── list.js
│               ├── info.js
│               ├── scan.js
│               ├── doctor.js
│               └── update.js
├── content/              Community extensions (Markdown)
│   ├── subagents/
│   ├── skills/
│   ├── commands/
│   └── hooks/
├── CONTRIBUTING.md
└── LICENSE
```

---

## Regenerating the registry

Requires a GitHub token for full results (5000 req/hr vs 60 unauthenticated):

```bash
export GITHUB_TOKEN=ghp_...
npm run generate
```

Skip slow steps during development:

```bash
SKIP_GITHUB=1 SKIP_DOCKER=1 npm run generate   # official registry only (fast)
SKIP_SKILLS=1 SKIP_PLUGINS=1 npm run generate  # skip skill/plugin discovery
```

---

## Releasing the CLI

Releases are triggered by a git tag. The GitHub Actions workflow publishes to npm with [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) (Verified badge on npmjs.com).

```bash
# 1. Bump version in packages/cli/package.json
# 2. Commit and push to main
# 3. Tag the release:
git tag cli-v0.2.1 && git push origin cli-v0.2.1
```

The `cli-v*` tag triggers `.github/workflows/publish.yml` → `npm publish --provenance`.

**Required secret:** `NPM_TOKEN` must be set in GitHub → Settings → Secrets → Actions.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

| Contribution | How |
|---|---|
| Submit a skill, subagent, command, or hook | Open a PR adding a file to `content/` |
| Submit an MCP server | [Open an issue](../../issues/new?template=extension_submission.yml) |
| Bug report | [GitHub Issues](../../issues) |
| Feature request | [GitHub Issues](../../issues) |

---

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Himanshu507/cgcone&type=date&legend=top-left)](https://www.star-history.com/?repos=Himanshu507%2Fcgcone&type=date&legend=top-left)

---

## License

MIT — see [LICENSE](LICENSE).
