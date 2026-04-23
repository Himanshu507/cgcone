'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bot, Terminal, Webhook, Sparkles, Package, Server } from 'lucide-react'
import type { MCPServer, Plugin, Skill, Subagent, Command, Hook } from '@/lib/types'

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
  featuredCommands: Command[]
  featuredHooks: Hook[]
}

const words = ['plugins', 'skills', 'tools', 'agents']

interface FeaturedSectionProps {
  title: string
  href: string
  icon: React.ElementType
  color: 'purple' | 'yellow' | 'blue' | 'green' | 'orange' | 'red'
  items: Array<{ name?: string; slug: string; description: string }>
  itemLinkPrefix: string
}

function FeaturedSection({ title, href, icon: Icon, color, items, itemLinkPrefix }: FeaturedSectionProps) {
  const colorClasses = {
    purple: 'text-purple-500',
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
  }

  if (items.length === 0) return null

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-display-3 flex items-center gap-3">
            <Icon className={`h-7 w-7 ${colorClasses[color]}`} />
            {title}
          </h2>
          <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link key={item.slug} href={`${itemLinkPrefix}/${item.slug}`}>
              <div className="p-6 rounded-lg border border-border hover:border-primary/40 transition-colors h-full">
                <h3 className="font-medium mb-2">{item.name || item.slug}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePageClient({
  mcpCount,
  pluginCount,
  subagentCount,
  skillCount,
  commandCount,
  hookCount,
  marketplaceCount,
  featuredMCPs,
  featuredPlugins,
  featuredSubagents,
  featuredSkills,
  featuredCommands,
  featuredHooks,
}: HomePageClientProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length)
        setIsVisible(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const totalCount = mcpCount + pluginCount + subagentCount + skillCount + commandCount + hookCount

  const categories = [
    { href: '/mcp-servers', label: 'MCP Servers', count: mcpCount, icon: Server, color: 'red' as const },
    { href: '/plugins', label: 'Plugins', count: pluginCount, icon: Package, color: 'purple' as const },
    { href: '/skills', label: 'Skills', count: skillCount, icon: Sparkles, color: 'yellow' as const },
    { href: '/subagents', label: 'Subagents', count: subagentCount, icon: Bot, color: 'blue' as const },
    { href: '/commands', label: 'Commands', count: commandCount, icon: Terminal, color: 'green' as const },
    { href: '/hooks', label: 'Hooks', count: hookCount, icon: Webhook, color: 'orange' as const },
  ]

  const installCmd = '/plugin marketplace add cgcone/cgcone'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text content */}
            <div className="max-w-xl">
              <h1 className="text-display-1 mb-8">
                Extend Claude with curated{' '}
                <span
                  className={`text-[#e89a7a] inline-block transition-all duration-200 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                  }`}
                >
                  {words[wordIndex]}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                A collection of {totalCount}+ practical extensions to enhance your productivity
                across Claude.ai, Claude Code, and the Claude API.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/mcp-servers">
                  <Button size="lg" className="gap-2">
                    Browse MCP Servers <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://github.com/cgcone/cgcone"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline">
                    View on GitHub
                  </Button>
                </a>
              </div>

              {/* Platform badges */}
              <div className="flex gap-3 mt-10">
                <div className="px-4 py-2 rounded-md border border-border text-center">
                  <div className="text-sm font-medium">Claude.ai</div>
                  <div className="text-xs text-muted-foreground">Chat</div>
                </div>
                <div className="px-4 py-2 rounded-md border border-border text-center">
                  <div className="text-sm font-medium">Claude Code</div>
                  <div className="text-xs text-muted-foreground">CLI</div>
                </div>
                <div className="px-4 py-2 rounded-md border border-border text-center">
                  <div className="text-sm font-medium">Claude API</div>
                  <div className="text-xs text-muted-foreground">Developers</div>
                </div>
              </div>
            </div>

            {/* Right: Terminal mockup */}
            <div className="hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden p-6 bg-[#c96a50]">
                {/* SVG wavy pattern overlay */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-30"
                  viewBox="0 0 400 300"
                  preserveAspectRatio="none"
                >
                  <path d="M-20,50 Q50,20 100,60 T200,50 T300,70 T400,40 T500,60" stroke="#9a4a3a" strokeWidth="3" fill="none" />
                  <path d="M-20,100 Q80,70 150,110 T280,90 T400,120 T500,80" stroke="#9a4a3a" strokeWidth="2" fill="none" />
                  <path d="M-20,150 Q60,180 130,140 T250,170 T380,130 T500,160" stroke="#9a4a3a" strokeWidth="3" fill="none" />
                  <path d="M-20,200 Q90,170 160,210 T300,180 T420,220 T500,190" stroke="#9a4a3a" strokeWidth="2" fill="none" />
                  <path d="M-20,250 Q70,280 140,240 T270,270 T400,240 T500,270" stroke="#9a4a3a" strokeWidth="3" fill="none" />
                </svg>

                {/* Terminal window */}
                <div className="relative bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl">
                  {/* Terminal header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#252525]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#5a5a5a]" />
                      <div className="w-3 h-3 rounded-full bg-[#5a5a5a]" />
                      <div className="w-3 h-3 rounded-full bg-[#5a5a5a]" />
                    </div>
                  </div>
                  {/* Terminal content */}
                  <div className="p-5 font-mono text-sm leading-relaxed">
                    <div className="inline-block border border-primary rounded px-4 py-2 mb-6">
                      <span className="text-primary">*</span>{' '}
                      <span className="text-foreground">Welcome to Claude Code</span>
                    </div>

                    <div className="text-muted-foreground mb-4">
                      <span className="text-muted-foreground">{'>'}</span>{' '}
                      <span className="text-foreground">/plugin marketplace add cgcone/cgcone</span>
                    </div>

                    <div className="text-muted-foreground/70 space-y-1.5">
                      <div><span className="text-green-500">✓</span> Fetching marketplace registry...</div>
                      <div><span className="text-green-500">✓</span> Adding cgcone marketplace</div>
                      <div className="mt-3 text-foreground/80">Available extensions:</div>
                      <div className="ml-2 text-muted-foreground/60">• {mcpCount} MCP servers</div>
                      <div className="ml-2 text-muted-foreground/60">• {pluginCount} plugins</div>
                      <div className="ml-2 text-muted-foreground/60">• {subagentCount + skillCount} agents & skills</div>
                      <div className="mt-3 text-foreground/80">
                        Run <span className="text-primary">/plugin install {'<name>'}</span> to install
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by type */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground mb-8 text-center tracking-wide uppercase">
            Browse by type
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {categories.map((cat) => {
              const Icon = cat.icon
              const colorClasses = {
                red: 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20',
                blue: 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20',
                green: 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20',
                orange: 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20',
                yellow: 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20',
                purple: 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20',
              }
              return (
                <Link key={cat.href} href={cat.href}>
                  <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-all group text-center">
                    <div className={`w-11 h-11 rounded-full ${colorClasses[cat.color]} flex items-center justify-center mx-auto mb-3 transition-colors`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-serif text-foreground mb-0.5">
                      {cat.count}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {cat.label}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured MCP Servers */}
      <FeaturedSection
        title="MCP Servers"
        href="/mcp-servers"
        icon={Server}
        color="red"
        items={featuredMCPs.map(s => ({ slug: s.slug, name: s.displayName, description: s.description }))}
        itemLinkPrefix="/mcp-server"
      />

      {/* Featured Subagents */}
      <FeaturedSection
        title="Subagents"
        href="/subagents"
        icon={Bot}
        color="blue"
        items={featuredSubagents.map(s => ({ slug: s.slug, name: s.name, description: s.description }))}
        itemLinkPrefix="/subagent"
      />

      {/* Featured Skills */}
      <FeaturedSection
        title="Skills"
        href="/skills"
        icon={Sparkles}
        color="yellow"
        items={featuredSkills.map(s => ({ slug: s.slug, name: s.name, description: s.description }))}
        itemLinkPrefix="/skill"
      />

      {/* Featured Commands */}
      <FeaturedSection
        title="Commands"
        href="/commands"
        icon={Terminal}
        color="green"
        items={featuredCommands.map(c => ({ slug: c.slug, name: c.name, description: c.description }))}
        itemLinkPrefix="/command"
      />

      {/* Featured Hooks */}
      <FeaturedSection
        title="Hooks"
        href="/hooks"
        icon={Webhook}
        color="orange"
        items={featuredHooks.map(h => ({ slug: h.slug, name: h.name, description: h.description }))}
        itemLinkPrefix="/hook"
      />

      {/* Featured Plugins */}
      <FeaturedSection
        title="Plugins"
        href="/plugins"
        icon={Package}
        color="purple"
        items={featuredPlugins.map(p => ({ slug: p.slug, name: p.name, description: p.description }))}
        itemLinkPrefix="/plugin"
      />

      {/* Quick install */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-display-3 mb-6">Get started</h2>
            <p className="text-muted-foreground mb-10">
              Add the cgcone marketplace to Claude Code
            </p>
            <div className="inline-flex items-center gap-1 bg-[#1a1a1a] rounded-full p-1.5 pr-4">
              <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
                Get Extensions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <code className="font-mono text-sm ml-3">
                <span className="text-primary">/plugin</span>{' '}
                <span className="text-foreground/80">marketplace add cgcone/cgcone</span>
              </code>
              <button
                onClick={handleCopy}
                className="ml-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy command"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              Or{' '}
              <Link href="/mcp-servers" className="text-primary hover:underline">
                browse MCP servers
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
