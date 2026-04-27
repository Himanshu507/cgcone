# Contributing to cgcone

cgcone is the package manager for AI CLI extensions - MCP servers, plugins, skills, subagents, commands, and hooks. Contributions are welcome.

## Ways to contribute

- **Submit an extension** - add a skill, subagent, command, or hook to the registry
- **Report a bug** - open an issue with reproduction steps
- **Improve the CLI** - `packages/cli/` is the `cgcone` npm package
- **Improve the website** - `app/` is the Next.js registry browser at cgcone.com

---

## Submit an extension

### Skills, Subagents, Commands, Hooks

These live in `content/` as Markdown files with YAML frontmatter.

1. Fork the repo and clone locally
2. Create a `.md` file in the right directory:

| Type | Directory | Required fields |
|------|-----------|----------------|
| Skill | `content/skills/` | `name`, `category`, `description`, `allowedTools` |
| Subagent | `content/subagents/` | `name`, `category`, `description`, `tools` |
| Command | `content/commands/` | `name`, `category`, `description`, `prefix` |
| Hook | `content/hooks/` | `name`, `category`, `description`, `event`, `matcher`, `language` |

3. Open a pull request. The registry regenerates automatically on merge.

**Example** (`content/skills/my-skill.md`):
```
---
name: my-skill
category: developer-tools
description: One sentence about what it does.
allowedTools: [Read, Write, Bash]
tags: [productivity]
---

You are a specialized assistant that...
```

### MCP Servers

MCP servers are indexed from [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io). To get your MCP server listed:

1. Submit it to the official MCP registry first
2. Or open a **[New MCP Submission issue](../../issues/new?template=extension_submission.yml)** - we'll add it to our index

---

## Contribute code

### Setup

```bash
git clone https://github.com/Himanshu507/cgcone
cd cgcone
npm install
npm run dev        # website at localhost:3000
```

### CLI development

```bash
cd packages/cli
node src/index.js scan    # run commands directly
```

### Branches

- `main` - production, deploys to cgcone.com
- Feature branches: `feat/`, `fix/`, `chore/` prefixes

Open a pull request against `main`. Keep PRs focused - one thing per PR.

### Releasing the CLI to npm

Releases are tagged manually. The GitHub Actions workflow at `.github/workflows/publish.yml` handles the rest, including [npm provenance attestation](https://docs.npmjs.com/generating-provenance-statements) (the Verified badge on npmjs.com).

```bash
# 1. Bump version in packages/cli/package.json
# 2. Commit and push to main as normal
# 3. Tag the release - this triggers the publish workflow:
git tag cli-v0.2.1 && git push origin cli-v0.2.1
```

Tag format is `cli-v<semver>`. The workflow runs `npm publish --provenance --access public` with the `NPM_TOKEN` secret.

> **Maintainers only.** Requires `NPM_TOKEN` secret with publish access to `@cgcone/cli`.

### Code style

- ES modules throughout (`"type": "module"`)
- No TypeScript in CLI (`packages/cli/`) - plain JS with JSDoc where useful
- Website: TypeScript + Tailwind v4

### Registry generation

```bash
npm run generate           # regenerate public/registry.json
SKIP_README=1 npm run generate   # skip README fetching (faster)
GITHUB_TOKEN=ghp_... npm run generate  # avoid rate limits
```

---

## Issue templates

- [Bug report](../../issues/new?template=bug_report.yml)
- [Feature request](../../issues/new?template=feature_request.yml)
- [Submit extension / MCP server](../../issues/new?template=extension_submission.yml)

---

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
