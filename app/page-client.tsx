'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Bot, Terminal, Webhook, Sparkles, Package, Server,
  Check, Download, Zap, Shield, Search, Activity, ChevronRight,
  Monitor, Command, Copy, Star, GitFork
} from 'lucide-react'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import type { MCPServer, Plugin, Skill, Subagent, Command as CommandType, Hook } from '@/lib/types'

interface HomePageClientProps {
  mcpCount: number
  pluginCount: number
  subagentCount: number
  skillCount: number
  commandCount: number
  hookCount: number
  marketplaceCount: number
  featuredMCPs: MCPServer[]
  featuredPlugins: Plugin[]
  featuredSubagents: Subagent[]
  featuredSkills: Skill[]
  featuredCommands: CommandType[]
  featuredHooks: Hook[]
}

const AI_CLIS = [
  { name: 'Claude Code', color: '#c96a50' },
  { name: 'Gemini CLI', color: '#4285f4' },
  { name: 'OpenAI Codex', color: '#10a37f' },
  { name: 'Copilot CLI', color: '#6e40c9' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Scan',
    description: 'cgcone detects every AI CLI tool installed on your machine — Claude Code, Gemini CLI, Codex, and more.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Discover',
    description: 'Browse the unified marketplace with hundreds of curated MCP servers, plugins, skills, and hooks.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Install Once',
    description: 'One click or one command. cgcone deploys the extension to every compatible AI CLI simultaneously.',
    icon: Download,
  },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Install Once, Everywhere',
    description: 'One command deploys any extension across all your AI CLIs. No manual config for each tool.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Terminal,
    title: 'Scriptable CLI',
    description: 'cgcone is a real CLI. Automate installs, script your setup, and pipe output to your tools.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Activity,
    title: 'Scan & Audit',
    description: 'See every installed extension across all your AI CLIs from one unified dashboard.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Shield,
    title: 'Verified Extensions',
    description: 'Registry entries include verification status — verified, community, or experimental — so you know what you\'re installing.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Server,
    title: 'Live Marketplace',
    description: '380+ curated extensions synced nightly from the official MCP registry and community.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: GitFork,
    title: 'Open Source',
    description: 'MIT licensed. Contribute adapters, extensions, or improvements. The registry is community-driven.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
]

const CLI_COMMANDS = [
  { cmd: 'cgcone install filesystem-mcp', comment: '# installs to all detected AI CLIs' },
  { cmd: 'cgcone list', comment: '# show installed extensions' },
  { cmd: 'cgcone doctor', comment: '# diagnose your environment' },
  { cmd: 'cgcone uninstall filesystem-mcp', comment: '# remove from all CLIs' },
]

export default function HomePageClient({
  mcpCount,
  pluginCount,
  subagentCount,
  skillCount,
  commandCount,
  hookCount,
  featuredMCPs,
}: HomePageClientProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const totalCount = mcpCount + pluginCount + subagentCount + skillCount + commandCount + hookCount

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCmd(text)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  const categories = [
    { href: '/mcp-servers', label: 'MCP Servers', count: mcpCount, icon: Server, color: 'red' as const },
    { href: '/plugins', label: 'Plugins', count: pluginCount, icon: Package, color: 'purple' as const },
    { href: '/skills', label: 'Skills', count: skillCount, icon: Sparkles, color: 'yellow' as const },
    { href: '/subagents', label: 'Subagents', count: subagentCount, icon: Bot, color: 'blue' as const },
    { href: '/commands', label: 'Commands', count: commandCount, icon: Command, color: 'green' as const },
    { href: '/hooks', label: 'Hooks', count: hookCount, icon: Webhook, color: 'orange' as const },
  ]

  const colorMap = {
    red: { pill: 'bg-red-500/10 text-red-500', hover: 'group-hover:bg-red-500/20' },
    blue: { pill: 'bg-blue-500/10 text-blue-500', hover: 'group-hover:bg-blue-500/20' },
    green: { pill: 'bg-green-500/10 text-green-500', hover: 'group-hover:bg-green-500/20' },
    orange: { pill: 'bg-orange-500/10 text-orange-500', hover: 'group-hover:bg-orange-500/20' },
    yellow: { pill: 'bg-yellow-500/10 text-yellow-500', hover: 'group-hover:bg-yellow-500/20' },
    purple: { pill: 'bg-purple-500/10 text-purple-500', hover: 'group-hover:bg-purple-500/20' },
  }

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                npm for AI CLIs · Open Source
              </div>

              <h1 id="hero-heading" className="text-display-1 mb-6 leading-tight">
                One command.{' '}
                <span className="text-primary">Every AI CLI covered.</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                cgcone is the package manager for AI CLI extensions. Scan your machine, find every
                AI CLI you have installed, and deploy MCP servers, plugins, and skills to all of them simultaneously.
              </p>

              {/* Install command */}
              <div className="rounded-lg border border-border bg-card overflow-hidden mb-6">
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="flex-1 overflow-x-auto">
                    <code className="font-mono text-sm whitespace-nowrap">
                      <span className="text-muted-foreground">$</span>{' '}
                      <span className="text-foreground">npm install -g @cgcone/cli</span>
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy('npm install -g @cgcone/cli')}
                    className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copy install command"
                  >
                    {copiedCmd === 'npm install -g @cgcone/cli' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Supported CLIs */}
              <div className="flex flex-wrap gap-2 mb-8" aria-label="Supported AI CLI tools">
                {AI_CLIS.map(cli => (
                  <span
                    key={cli.name}
                    className="px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground"
                  >
                    {cli.name}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link href="/mcp-servers">
                    Browse Marketplace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="gap-2" asChild>
                  <a href="https://github.com/Himanshu507/cgcone" target="_blank" rel="noopener noreferrer">
                    <GitHubLogoIcon className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: Terminal demo */}
            <div aria-hidden="true" className="hidden lg:block">
              <div className="rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">terminal</span>
                </div>
                {/* Terminal body */}
                <div className="p-5 font-mono text-sm leading-loose">
                  <div className="text-muted-foreground/60 mb-1"># install filesystem MCP across all AI CLIs</div>
                  <div className="mb-4">
                    <span className="text-primary">$</span>{' '}
                    <span className="text-foreground">cgcone install filesystem-mcp</span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="text-muted-foreground">
                      <span className="text-yellow-500">⟳</span> Scanning AI CLIs on your machine...
                    </div>
                    <div className="text-muted-foreground ml-4">
                      Found: <span className="text-foreground">Claude Code, Gemini CLI, OpenAI Codex</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm">
                    <div className="text-muted-foreground">Installing <span className="text-foreground">filesystem-mcp v2.1.0</span>...</div>
                    <div className="ml-4 space-y-1">
                      <div><span className="text-green-500">✓</span> <span className="text-foreground">Claude Code</span><span className="text-muted-foreground/60"> → configured</span></div>
                      <div><span className="text-green-500">✓</span> <span className="text-foreground">Gemini CLI</span><span className="text-muted-foreground/60"> → configured</span></div>
                      <div><span className="text-green-500">✓</span> <span className="text-foreground">OpenAI Codex</span><span className="text-muted-foreground/60"> → configured</span></div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm">
                    <span className="text-green-500">✓</span>{' '}
                    <span className="text-foreground">3 CLIs updated</span>
                    <span className="text-muted-foreground/60"> in 1.8s</span>
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    <span className="text-primary">$</span>{' '}
                    <span className="text-foreground">cgcone list</span>
                    <span className="ml-2 text-muted-foreground/40 animate-pulse">▍</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <section aria-label="Extension counts" className="border-y border-border bg-secondary/30 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
            {[
              { value: totalCount + '+', label: 'Total Extensions' },
              { value: mcpCount, label: 'MCP Servers' },
              { value: pluginCount, label: 'Plugins' },
              { value: skillCount + subagentCount, label: 'Skills & Agents' },
            ].map(stat => (
              <div key={stat.label}>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</dt>
                <dd className="text-2xl font-serif text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section aria-labelledby="how-heading" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
            <h2 id="how-heading" className="text-display-2">Three steps to one CLI to rule them all</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <article key={step.step} className="relative p-7 rounded-xl border border-border bg-card">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-border z-10" aria-hidden="true" />
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-muted-foreground/50">{step.step}</span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section aria-labelledby="features-heading" className="py-24 border-t border-border bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Features</p>
            <h2 id="features-heading" className="text-display-2">Everything your AI toolchain needs</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {FEATURES.map(feat => {
              const Icon = feat.icon
              return (
                <article key={feat.title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${feat.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`h-5 w-5 ${feat.color}`} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CLI commands ─────────────────────────────────────── */}
      <section aria-labelledby="cli-heading" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">CLI Tool</p>
              <h2 id="cli-heading" className="text-display-2 mb-5">Power your workflow from the terminal</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                The <code className="font-mono text-sm bg-secondary px-1.5 py-0.5 rounded text-foreground">cgcone</code> CLI
                is published on npm. Install it once, manage your entire AI CLI extension ecosystem from any terminal.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                  Works on macOS, Windows, Linux
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                  Node.js 20+ required
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                  Open source, MIT license
                </div>
              </div>
            </div>

            {/* Commands */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground font-mono">cgcone commands</span>
              </div>
              <div className="divide-y divide-border">
                {CLI_COMMANDS.map(({ cmd, comment }) => (
                  <div
                    key={cmd}
                    className="flex items-center gap-3 px-4 py-3 group hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 font-mono text-sm overflow-x-auto">
                      <span className="text-primary">$</span>{' '}
                      <span className="text-foreground">{cmd}</span>
                      <span className="text-muted-foreground/40 ml-2 hidden sm:inline">{comment}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(cmd)}
                      className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Copy: ${cmd}`}
                    >
                      {copiedCmd === cmd ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marketplace preview ──────────────────────────────── */}
      <section aria-labelledby="marketplace-heading" className="py-24 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Marketplace</p>
            <h2 id="marketplace-heading" className="text-display-2 mb-4">
              {totalCount}+ curated extensions, always fresh
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The cgcone marketplace is what powers the app. Browse it here, or use it directly from
              the desktop app and CLI. Updated nightly from the community.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mb-10">
            {categories.map(cat => {
              const Icon = cat.icon
              const c = colorMap[cat.color]
              return (
                <Link key={cat.href} href={cat.href}>
                  <article className="p-5 rounded-xl border border-border hover:border-primary/40 transition-all group text-center cursor-pointer">
                    <div className={`w-11 h-11 rounded-full ${c.pill} ${c.hover} flex items-center justify-center mx-auto mb-3 transition-colors`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="text-2xl font-serif text-foreground mb-0.5">{cat.count}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{cat.label}</div>
                  </article>
                </Link>
              )
            })}
          </div>

          {/* Featured MCPs */}
          {featuredMCPs.length > 0 && (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4 text-red-500" aria-hidden="true" />
                  Popular MCP Servers
                </h3>
                <Link href="/mcp-servers" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredMCPs.slice(0, 6).map(server => (
                  <Link key={server.slug} href={`/mcp-server/${server.slug}`}>
                    <article className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors bg-card h-full">
                      <h4 className="font-medium text-sm mb-1 text-foreground">{server.displayName}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{server.description}</p>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Get started ──────────────────────────────────────── */}
      <section aria-labelledby="getstarted-heading" className="py-24 border-t border-border bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="getstarted-heading" className="text-display-2 mb-4">Get started in seconds</h2>
              <p className="text-muted-foreground">Requires Node.js 18+. Works on macOS, Windows, and Linux.</p>
            </div>

            {/* Primary: CLI install */}
            <div className="p-8 rounded-2xl border border-primary/20 bg-card flex flex-col mb-6">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Terminal className="h-6 w-6 text-green-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">cgcone CLI</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">Available now</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    Install, manage, and audit AI CLI extensions from any terminal. One command reaches every AI CLI on your machine.
                  </p>
                  <div className="space-y-2">
                    {[
                      { cmd: 'npm install -g @cgcone/cli', comment: '# install cgcone' },
                      { cmd: 'cgcone scan', comment: '# detect your AI CLIs' },
                      { cmd: 'cgcone install filesystem-mcp', comment: '# install to all of them' },
                    ].map(({ cmd, comment }) => (
                      <div key={cmd} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 group">
                        <div className="flex-1 overflow-x-auto">
                          <code className="font-mono text-sm whitespace-nowrap">
                            <span className="text-muted-foreground">$</span>{' '}
                            <span className="text-foreground">{cmd}</span>
                            <span className="text-muted-foreground/40 ml-2 hidden sm:inline">{comment}</span>
                          </code>
                        </div>
                        <button
                          onClick={() => handleCopy(cmd)}
                          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`Copy: ${cmd}`}
                        >
                          {copiedCmd === cmd ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary: Coming soon */}
            <div className="p-6 rounded-2xl border border-border bg-card/50 flex items-center gap-5 opacity-60">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Monitor className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-muted-foreground">Desktop App</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">Coming soon</span>
                </div>
                <p className="text-sm text-muted-foreground">Native GUI for macOS, Windows, and Linux. Visual dashboard for managing your extension ecosystem.</p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              Or just{' '}
              <Link href="/mcp-servers" className="text-primary hover:underline">
                browse the marketplace
              </Link>
              {' '}— no install required.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
