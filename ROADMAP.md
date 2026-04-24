# cgcone — Product Roadmap

> Strategy: CLI-first universal AI extension manager. Registry is the moat. Desktop GUI is a later paid product for teams.

---

## ✅ Phase 0 — What's Already Built (Website + Registry)

### Website / Registry Browser
- [x] Next.js 15 App Router with SSG
- [x] MCP Servers listing page (search, filter, categories)
- [x] Plugins listing page
- [x] Skills, Subagents, Commands, Hooks listing pages
- [x] Individual detail pages for all item types
- [x] README viewer with sticky TOC + scroll spy
- [x] GitHub stars + README fetched at crawl time
- [x] Relative URL rewriting in READMEs (no more 404 images)
- [x] Dark/light theme
- [x] Fully responsive layout (mobile → 15" Windows → wide desktop)
- [x] Registry generator script (`npm run generate`)
- [x] robots.txt + noindex (search crawlers blocked during dev)
- [x] Navigation, footer, SEO metadata structure

### Registry Data Pipeline
- [x] Crawls official-mcp, npm, GitHub sources
- [x] Normalizes schema differences across sources
- [x] Fetches READMEs in batches with rate-limit handling
- [x] Outputs `public/registry.json` (~380+ entries)
- [x] `GITHUB_TOKEN` + `SKIP_README=1` env support

---

## 🔧 Phase 1 — Pre-Launch Prep (Do Before Open Sourcing)

### CLI Tool (`cgcone` npm package)
- [ ] `cgcone scan` — detect AI CLIs installed on machine (Claude Code, Gemini CLI, Codex, Copilot)
- [ ] `cgcone install <name>` — install extension to all detected CLIs
- [ ] `cgcone uninstall <name>` — remove from all CLIs
- [ ] `cgcone list` — show installed extensions + which CLI they're in
- [ ] `cgcone search <query>` — search registry (hits cgcone.com API or local cache)
- [ ] `cgcone info <name>` — show details, version, author, security status
- [ ] `cgcone doctor` — diagnose broken installs, missing configs
- [ ] `cgcone update <name>` / `cgcone update --all`
- [ ] `--for <cli>` flag — target specific CLI only

### Website Updates (New Approach — CLI-First Landing Page)
- [ ] Hero: rewrite to position cgcone as "npm for AI CLIs" — terminal demo stays, CTA becomes `npm install -g cgcone`
- [ ] Remove desktop app as primary CTA (move to "Coming Soon" section)
- [ ] Add `cgcone install <package>` one-liner on every extension detail page
- [ ] Add verified/unverified badge UI on extension cards
- [ ] Add "Submit your extension" page for authors
- [ ] Enable robots.txt + SEO indexing when ready to go public

### Open Source Readiness
- [ ] `LICENSE` — MIT
- [ ] `CONTRIBUTING.md` — how to submit extensions, how to contribute code
- [ ] `README.md` (root) — killer README with GIF demo, install command, supported CLIs table
- [ ] `.github/ISSUE_TEMPLATE/` — bug report + feature request + extension submission templates
- [ ] Rename repo from `cgcone_web` → `cgcone` (monorepo: web + cli together)
- [ ] Clean up any secrets/tokens from git history before making public

---

## 🚀 Phase 2 — Open Source Launch

### When to go public
Open source when ALL of these are true:
1. CLI has `install`, `uninstall`, `list`, `scan`, `doctor` working end-to-end
2. Registry has 400+ entries with clean metadata
3. README has a screen recording / GIF demo
4. CONTRIBUTING.md exists
5. At least 3 real installs tested on macOS + Windows + Linux

### What to give initial users (launch day package)
- Working `npm install -g cgcone` that actually installs an MCP to Claude Code
- The registry website live at cgcone.com with SEO unblocked
- A 90-second screen recording: install same 5 MCPs across 3 CLIs simultaneously
- GitHub badges ready for MCP authors to copy-paste
- "Submit your extension" form live

### Launch Channels (in order)
1. **Hacker News Show HN** — post Tuesday 9am EST. Title: "Show HN: cgcone – install MCP servers and AI CLI extensions once, works across all CLIs"
2. **r/ClaudeAI** — Claude Code users are the most active AI CLI community right now
3. **r/LocalLLaMA** — broader AI developer audience
4. **Claude Code Discord** — direct community
5. **X/Twitter** — post the screen recording, tag @AnthropicAI @GoogleDeepMind
6. **DM top 10 MCP server authors** — "we feature your server, here's your badge to add to your README"
7. **Dev.to / Hashnode article** — "I built npm for AI CLIs"

---

## 🔐 Phase 3 — Trust Layer (Verification + Badges)

- [ ] Security scan pipeline for registry entries (check for obfuscated code, suspicious permissions)
- [ ] "cgcone verified" badge — manual review + automated scan passes
- [ ] Badge embed code for MCP authors to add to their READMEs
- [ ] Extension stats: install count, GitHub stars, last updated
- [ ] Changelog tracking per extension

---

## ☁️ Phase 4 — Sync Feature (Retention + Lock-in)

> This is the killer feature. "New machine? `cgcone sync pull` restores everything in 30 seconds."

- [ ] `cgcone login` — auth (GitHub OAuth)
- [ ] `cgcone sync push` — backup installed extension config to cloud
- [ ] `cgcone sync pull` — restore on new machine
- [ ] Profile page on cgcone.com — see your installed extensions
- [ ] Team sync — share extension configs across a team (paid tier)

---

## 💰 Phase 5 — Monetization (After Traction)

| Free | Pro ($X/mo) | Teams ($Y/mo) |
|------|-------------|---------------|
| CLI unlimited | Cloud sync | Team shared configs |
| Registry browsing | Extension history | Org-level verified packages |
| Public extensions | Priority support | Private registry |
| — | — | SSO + audit logs |

**Desktop GUI app** — launch here as a premium Teams product. Not free. GUI for managing team extension configs, visual diff of what's installed vs team standard.

---

## 🌐 Landing Page Rewrite Plan

### Current messaging (to change)
> "Desktop app and CLI that scans your machine..."
> Primary CTA: Download App

### New messaging
> "npm for AI CLIs. Install MCP servers, plugins, and skills once — works across Claude Code, Gemini CLI, and Codex."
> Primary CTA: `npm install -g cgcone`

### New landing page sections (in order)
1. **Hero** — one-liner value prop + terminal showing `cgcone install filesystem-mcp` deploying to 3 CLIs
2. **Social proof bar** — X extensions · X MCP servers · X GitHub stars
3. **The problem** — "You have 4 AI CLI tools. Each needs extensions configured separately. That's insane."
4. **How it works** — Scan → Discover → Install Once (keep existing section, update copy)
5. **Supported CLIs** — logos: Claude Code, Gemini CLI, Codex CLI, Copilot CLI
6. **Registry preview** — browse MCPs, plugins, skills (keep existing)
7. **CLI commands** — keep existing section
8. **Sync teaser** — "Coming soon: `cgcone sync` — restore everything on a new machine in 30 seconds"
9. **For authors** — "Add a cgcone badge to your MCP server README"
10. **Get started** — `npm install -g cgcone` as primary + "Browse registry" as secondary

---

## 📁 Repo Structure After Rename

```
cgcone/                     ← renamed from cgcone_web
├── app/                    ← Next.js website (registry browser)
├── components/
├── lib/
├── scripts/                ← registry crawlers
├── public/
│   └── registry.json
├── packages/
│   └── cli/               ← NEW: the cgcone npm CLI package
│       ├── src/
│       ├── package.json    ← name: "cgcone", bin: { "cgcone": "./src/index.js" }
│       └── README.md
├── ROADMAP.md              ← this file
├── CONTRIBUTING.md
├── LICENSE
└── README.md               ← killer root README
```

---

## 🏷️ Repo Rename Recommendation

**Yes, rename `cgcone_web` → `cgcone`.**

Reasons:
- The CLI will live here too (monorepo). Calling it `cgcone_web` undersells it.
- When people search for the project, `github.com/Himanshu507/cgcone` is cleaner
- GitHub auto-redirects old URLs after rename — no broken links
- Signals this is the product repo, not just a website

---

*Last updated: 2026-04-24*
