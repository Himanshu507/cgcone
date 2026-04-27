# cgcone Registry Overhaul Roadmap

**Problem**: Current registry (383 entries, 244 Docker-only, ~2 npm-installable) is nearly unusable.
**Goal**: Replace with GitHub-sourced, install-verified data like claudemarketplaces.com (770+ MCPs, 3800+ skills, 1400+ plugins).

---

## What claudemarketplaces.com does that we don't

| Capability | Them | Us (now) |
|---|---|---|
| MCP entries | 770 (GitHub-sourced) | 1943 (GitHub-sourced) |
| Skills | 3,809 (skills.sh + GitHub) | 262 |
| Plugins | 1,461 (GitHub marketplace.json) | 251 |
| Install config | Structural heuristic (uvx) | Pre-computed per entry |
| LLM summaries | ✅ Claude Sonnet per entry | ❌ |
| Star counts | ✅ GitHub GraphQL | ✅ |
| Weekly install counts | ✅ skills.sh scrape | ❌ |
| Category classification | ✅ keyword mapping | Basic tags |
| Auto-discovery scripts | ✅ GitHub Code Search | ✅ |
| Storage | Supabase + JSON files | JSON file only |

---

## Phase 1 - New Data Pipeline (Registry Rebuild)

**Goal**: Replace cgcone.com/registry.json with GitHub-sourced data.

### 1A - MCP Servers (GitHub GraphQL enrichment)
- [x] Get seed list from official MCP registry
- [x] Batch-query GitHub GraphQL for `stargazerCount`, `description`, `defaultBranchRef`
- [x] Filter: 50+ stars minimum
- [x] Fetch `package.json` per repo to extract `name`, `bin`
- [x] Detect runtime: `pyproject.toml` -> uvx, `Dockerfile` -> docker, `package.json` -> npx
- [x] Build install command from detected runtime + package name
- [x] **Replaced current Docker Hub indexer**

### 1B - Skills Discovery
- [x] GitHub Code Search: `filename:SKILL.md path:.claude/skills`
- [x] Parse YAML frontmatter: `name`, `description`, `license`
- [x] Install command: `claude skill add {owner}/{repo}:{skill-name}`
- [x] Minimum: 5 stars gate

### 1C - Plugins Discovery
- [x] GitHub Code Search: `filename:marketplace.json path:.claude-plugin`
- [x] Validate against Claude marketplace.json schema
- [x] Extract: `commands`, `agents`, `hooks`, `mcpServers` arrays
- [x] Install command: `/plugin install {name}@{marketplace-slug}`

### 1D - Dedup + Sync Script
- [x] Detect renamed GitHub repos (follow redirects)
- [x] Remove deleted repos (404 responses)
- [x] Refresh star counts
- [x] Run on schedule (weekly via nightly-sync.yml)

---

## Phase 2 - Install Config Accuracy

**Goal**: `cgcone install <slug>` works for >80% of entries.

### 2A - Runtime Detection (per repo)
- [x] `packages` field has npm -> `npx -y {identifier}`
- [x] `packages` field has pypi -> `uvx {identifier}`
- [x] `package.json` exists in repo root -> `npx -y {npm-name}`
- [x] `pyproject.toml` exists -> `uvx {pypi-name}`
- [x] Official MCP monorepo slug -> `uvx mcp-server-{slug}`
- [x] `Dockerfile` or dockerUrl exists -> `docker run -i --rm {image}`
- [x] Fallback -> warn + link to manual instructions

### 2B - Monorepo Heuristic (claudemarketplaces approach)
- [x] Package name = `mcp-server-{last-segment}` for `modelcontextprotocol/servers/*` slugs
- [x] Covers: fetch, filesystem, brave-search, memory, etc.

### 2C - Environment Variable Detection
- [x] Parse README for `API_KEY`, `TOKEN`, `SECRET` patterns
- [x] Mark as required env vars - shown as warning on install
- [ ] Improve coverage (partially implemented)

### 2D - Update CLI `getInstallConfig()` to use new data
- [x] CLI uses pre-computed `installConfig` field from registry
- [x] `installConfig` field added to each registry entry

---

## Phase 3 - Registry Infrastructure

**Goal**: Fresh data without manual runs, searchable, fast.

### 3A - Storage: Supabase
- [ ] `mcp_servers` table - core MCP data + install config
- [ ] `skills` table - GitHub + skills.sh sources
- [ ] `plugins` table - marketplace.json entries
- [ ] `marketplaces` table - parent repos for plugins
- [ ] Indexes on: `slug`, `stars`, `category`, `install_type`

### 3B - registry.json Generation
- [ ] Auto-regenerate from Supabase on schedule (GitHub Actions cron, weekly)
- [ ] Version field in registry so CLI knows when it's stale

### 3C - Scheduled Refresh
- [ ] GitHub Actions workflow: weekly run of discovery + dedup scripts
- [ ] Commits updated `mcp-crawled.json`, `skills.json`, `plugins.json`
- [ ] Triggers Supabase upsert + registry.json regeneration

---

## Phase 4 - Data Enrichment

**Goal**: Better UX on cgcone.com detail pages.

### 4A - LLM Summaries
- [ ] For each MCP/skill: fetch README -> send to Claude Sonnet
- [ ] Prompt: 80-120 words, developer-to-developer voice, no filler
- [ ] Store as `summary` field in Supabase
- [ ] Show on detail pages (replaces raw description)

### 4B - Star Counts
- [x] GitHub GraphQL batch queries (40 repos per request, rate limit aware)
- [x] Stars stored in registry per entry
- [ ] Refresh weekly via scheduled sync
- [ ] Show on listing + detail pages - sort by stars as default

### 4C - Category Classification
- [ ] Keyword arrays per category (similar to claudemarketplaces `mcp-categories.ts`)
- [ ] Categories: dev-tools, databases, web, files, ai-models, communication, security, etc.
- [ ] Auto-classify on ingest

### 4D - Install Type Badge
- [ ] New field `installType: 'npm' | 'uvx' | 'docker' | 'remote' | 'plugin' | 'skill'`
- [ ] Show as badge on listing cards
- [ ] Filter in search: `cgcone search database --type npm`

### 4E - Registry Quality Signals (from community feedback)
- [ ] Add `lastCommit`, `isArchived`, `openIssues` fields per entry via GitHub GraphQL
- [ ] Surface in `cgcone info <name>` - show last commit date + archived warning
- [ ] Show warning badge on cgcone.com detail pages for repos inactive 12+ months
- [ ] Hide or deprioritize archived repos in default search results

---

## Phase 5 - CLI Updates

**Goal**: CLI benefits from new data automatically.

### 5A - Use pre-computed `installConfig` from registry
- [x] CLI uses baked-in install config per entry
- [x] Runtime heuristics removed from hot path

### 5B - Skills install support
- [ ] `cgcone install {skill-slug}` -> runs `claude skill add {owner}/{repo}:{skill}`
- [ ] New adapter path for skills (different from MCP config)

### 5C - Plugin install support
- [ ] `cgcone install {plugin-slug}` -> runs `/plugin install {name}@{marketplace}`
- [ ] Show in `cgcone list` under type: plugin

### 5D - `cgcone search` improvements
- [ ] Filter by type: `cgcone search web --type mcp`
- [ ] Filter by install method: `cgcone search --installable`
- [ ] Sort by stars or installs

### 5E - Version diff in `cgcone update`
- [ ] Compare installed version vs registry version
- [ ] Show `0.1.0 -> 0.2.0` before updating
- [ ] Skip if already latest, say so

### 5F - `cgcone install --dry-run` (from community feedback)
- [ ] Print exactly what would be written to each CLI config before writing anything
- [ ] Show before/after diff for the affected key only, not the full file
- [ ] Works for all adapters: Claude Code, Gemini CLI, Codex, Copilot

### 5G - TOML comment preservation for Codex (from community feedback)
- [ ] Switch to comment-aware TOML library or write MCP entries to a separate include file
- [ ] Must not break existing Codex configs on upgrade

### 5H - `cgcone doctor` startup validation (from community feedback)
- [ ] Actually attempt to start each installed MCP server, not just validate config syntax
- [ ] Verify server responds before declaring it healthy
- [ ] Check required env vars are present before startup - report exactly which are missing
- [ ] Surface clear human-readable errors

### 5I - Install-time compatibility warnings (from community feedback)
- [ ] Check server's `engines.node` against user's current Node version, warn if incompatible
- [ ] Warn if server's `@modelcontextprotocol/sdk` is pinned to a range with known breaking changes
- [ ] Flag servers with no pinned SDK version (`*` or `latest`) as install-time risk

---

## Execution Order

```
Phase 1A (MCP data rebuild)       ✅ DONE
Phase 1B (skills)                 ✅ DONE
Phase 1C (plugins)                ✅ DONE
Phase 2A+2B (install config)      ✅ DONE
Phase 2D (CLI uses installConfig) ✅ DONE

Phase 5F (--dry-run)              <- DO NEXT
Phase 5H (doctor startup check)   <- DO NEXT
Phase 5I (compat warnings)        <- DO NEXT
Phase 5G (TOML comments)          <- DO NEXT

Phase 1D + 3C (scheduled sync)    ✅ DONE (1D complete, 3C pending Supabase)
Phase 4B (star counts refresh)    <- sort by popularity
Phase 4E (quality signals)        <- liveness, archived, last commit
Phase 4D (installType badge)      <- filter in search + website
Phase 4A (LLM summaries)          <- needs API budget
Phase 3A+3B (Supabase)            <- do when JSON files hit limits

Phase 5B (skills install CLI)     <- depends on Phase 1B data
Phase 5C (plugin install CLI)     <- depends on Phase 1C data
Phase 5D (search filters)         <- depends on installType field
Phase 5E (version diff update)    <- quality of life
Phase 2C (env var coverage)       <- improve existing partial impl
Phase 4C (category classification)<- polish
```

---

## What NOT to copy from claudemarketplaces

- Their MCP install command always emits `uvx` - wrong for npm-native packages
- No Docker support in their CLI - we need it
- No `--for <cli>` targeting - we have this, keep it
- Their `installCommand` is rendered at UI time, not stored - bad for CLI use
- No CLI tool at all - that's our entire differentiator
