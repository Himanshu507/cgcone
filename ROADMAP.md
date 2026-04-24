# cgcone — Product Roadmap

> Strategy: CLI-first universal AI extension manager. Registry is the moat. Desktop GUI is a later paid Teams product.
> Repo renamed: `cgcone_web` → `cgcone` ✅

---

## ⚠️ Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Problem doesn't exist at scale yet (most devs have 1 CLI) | MVP messaging = "best way to manage Claude Code extensions" — cross-CLI is the upgrade pitch, not the hook |
| Anthropic/Google ships native install mechanism | Bet on registry curation + verification, not install mechanics. Position as aggregator, not competitor. |
| CLI build takes longer than one person can handle | Open source skeleton early. Claude Code adapter first. Community adds Gemini/Codex adapters. |
| Sync costs money before revenue exists | Sync is paid from day one — no free tier ever. State this publicly in README before launch. |
| Registry data is replicable in a weekend | Verified badges + author submissions move to Phase 1. Curation quality + trust = the real moat. |

---

## ✅ Phase 0 — Done (Website + Registry)

### Website / Registry Browser
- [x] Next.js 15 App Router with SSG
- [x] MCP Servers, Plugins, Skills, Subagents, Commands, Hooks listing pages
- [x] Individual detail pages for all item types
- [x] README viewer with sticky TOC + scroll spy
- [x] GitHub stars + README fetched at crawl time
- [x] Relative URL rewriting in READMEs
- [x] Dark/light theme, fully responsive (mobile → 15" Windows → wide)
- [x] Registry generator script (`npm run generate`)
- [x] robots.txt + noindex (crawlers blocked during dev)
- [x] Navigation, footer, SEO metadata structure

### Registry Data Pipeline
- [x] Crawls official-mcp, npm, GitHub sources
- [x] Normalizes schema across sources
- [x] READMEs fetched in batches with rate-limit handling
- [x] Outputs `public/registry.json` (~380+ entries)
- [x] `GITHUB_TOKEN` + `SKIP_README=1` env support

---

## 🔧 Phase 1 — Current (Pre-Launch) — IN PROGRESS

> Must complete ALL of this before open source launch.

### CLI Tool (`packages/cli/`) — Claude Code adapter first, others later
- [x] Project scaffold (`packages/cli/package.json`, src structure)
- [x] `cgcone scan` — detect AI CLIs on machine
- [x] `cgcone install <name>` — install to all detected CLIs (`--for <cli>` flag)
- [x] `cgcone uninstall <name>` — remove from all CLIs
- [x] `cgcone list` — show installed extensions + which CLI
- [x] `cgcone search <query>` — search registry (cached locally)
- [x] `cgcone info <name>` — details, version, author, security status
- [x] `cgcone doctor` — diagnose broken installs, missing configs
- [x] `cgcone update <name>` / `cgcone update --all`
- [ ] End-to-end tested: install real MCP to Claude Code on macOS + Windows + Linux
- [ ] Gemini CLI adapter (community contribution welcome)
- [ ] Codex CLI adapter (community contribution welcome)

### Registry — Add `packageName` field for CLI install
- [x] `getInstallConfig()` uses structured `packages` field → README extraction → heuristics
- [ ] Re-run `npm run generate` with updated schema
- [x] Verification status visible on website cards (verified/community/experimental badges)
- [x] Author submission form — GitHub issue template (`extension_submission.yml`)

### Website Updates — CLI-First Landing Page
- [x] Hero rewrite: "npm for AI CLIs" — primary CTA → `npm install -g cgcone`
- [x] Remove desktop app as primary CTA (moved to "Coming Soon" section)
- [x] Add `cgcone install <slug>` one-liner on every MCP detail page
- [x] Verified/unverified badge UI on extension cards (was already present)
- [x] "Submit your extension" page updated (`/contribute`)

### Open Source Readiness
- [x] Repo renamed: `cgcone_web` → `cgcone`
- [x] `LICENSE` — MIT
- [x] `CONTRIBUTING.md` — how to submit extensions + contribute code
- [x] Root `README.md` — killer README with install command, supported CLIs table, commands
- [x] `.github/ISSUE_TEMPLATE/` — bug_report, feature_request, extension_submission
- [x] Audit git history for secrets — none found. Stale `Himanshu507/cgcone_web` URLs updated to `cgcone/cgcone`

---

## 🚀 Phase 2 — Open Source Launch

### Go public when ALL true:
1. `cgcone install <name>` works end-to-end for Claude Code MCPs
2. Registry has `packageName` for 80%+ of MCP entries
3. Root README has screen recording or GIF demo
4. CONTRIBUTING.md exists
5. Tested on macOS + Windows

### Launch day package
- Working `npm install -g cgcone` that installs real MCP to Claude Code
- cgcone.com live with SEO unblocked (remove robots.txt `Disallow: /`)
- 90-second screen recording: install 3 MCPs across 2 CLIs simultaneously
- GitHub badges ready for MCP authors to copy-paste into their READMEs
- "Submit your extension" GitHub issue template live

### Launch channels (in order)
1. **Hacker News Show HN** — Tuesday 9am EST
2. **r/ClaudeAI** — largest active AI CLI community
3. **r/LocalLLaMA** — broader AI developer audience
4. **Claude Code Discord**
5. **X/Twitter** — screen recording post, tag @AnthropicAI
6. **DM top 10 MCP server authors** — "feature your server + badge for your README"
7. **Dev.to article** — "I built npm for AI CLIs"

---

## 🔐 Phase 3 — Trust Layer

- [ ] Security scan pipeline (check for obfuscated code, suspicious permissions)
- [ ] "cgcone verified" badge — manual review + automated scan passes
- [ ] Badge embed code for MCP authors (add to their READMEs → viral distribution)
- [ ] Extension stats: install count, last updated, GitHub stars
- [ ] Changelog tracking per extension

---

## ☁️ Phase 4 — Sync (Retention + Lock-in)

> "New machine? `cgcone sync pull` restores everything in 30 seconds."
> **Paid from day one — no free tier. State this before launch.**

- [ ] `cgcone login` — GitHub OAuth
- [ ] `cgcone sync push` — backup installed extension config to cloud
- [ ] `cgcone sync pull` — restore on new machine
- [ ] Self-hostable sync server (open source) — hosted version is the paid product
- [ ] Team sync — share extension configs across a team (paid tier)

---

## 💰 Phase 5 — Monetization + Desktop GUI

| Free | Pro ($X/mo) | Teams ($Y/mo) |
|------|-------------|---------------|
| CLI unlimited | Cloud sync | Team shared configs |
| Registry browsing | Extension history | Org-level verified packages |
| Public extensions | Priority support | Private registry |
| — | — | SSO + audit logs |

**Desktop GUI app** — launch here as a paid Teams product. Not free. GUI for managing team extension configs, visual diff of what's installed vs team standard. This is the original USP — just at the right timing and monetization layer.

---

## 📁 Monorepo Structure

```
cgcone/
├── app/                    ← Next.js website (registry browser)
├── components/
├── lib/
├── scripts/                ← registry crawlers
├── public/
│   └── registry.json
├── packages/
│   └── cli/               ← the cgcone npm CLI package
│       ├── src/
│       │   ├── index.js
│       │   ├── ui.js
│       │   ├── registry.js
│       │   ├── store.js
│       │   ├── adapters/
│       │   └── commands/
│       └── package.json
├── .github/
│   └── ISSUE_TEMPLATE/
├── ROADMAP.md
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

*Last updated: 2026-04-24*
