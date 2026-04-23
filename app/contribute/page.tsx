import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { ArrowRight, Bot, Sparkles, Terminal, Webhook } from "lucide-react"

export const metadata = {
  title: "Contribute - CGCone",
  description: "Learn how to contribute to the CGCone marketplace.",
}

const contentTypes = [
  {
    icon: Bot,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Subagents",
    dir: "content/subagents/",
    description: "Specialized AI agents with specific capabilities and tool access.",
    fields: ["name", "category", "description", "tools", "tags"],
  },
  {
    icon: Sparkles,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    title: "Skills",
    dir: "content/skills/",
    description: "Reusable skill modules that can be invoked as needed.",
    fields: ["name", "category", "description", "allowedTools", "model"],
  },
  {
    icon: Terminal,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Commands",
    dir: "content/commands/",
    description: "Slash commands that trigger specific workflows.",
    fields: ["name", "category", "description", "argumentHint", "prefix", "tags"],
  },
  {
    icon: Webhook,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Hooks",
    dir: "content/hooks/",
    description: "Event-driven automation triggered by Claude actions.",
    fields: ["name", "category", "description", "event", "matcher", "language", "tags"],
  },
]

export default function ContributePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-display-2 mb-4">Contribute</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Help build the largest collection of Claude Code extensions. Contributions are welcome from everyone.
          </p>
        </div>

        {/* Quick start */}
        <section className="mb-12">
          <h2 className="text-display-3 mb-6">Quick Start</h2>
          <div className="space-y-4">
            <div className="flex gap-4 p-5 rounded-lg border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold font-mono">1</div>
              <div>
                <p className="font-medium mb-1">Fork the repository</p>
                <p className="text-sm text-muted-foreground">
                  Fork{' '}
                  <a href="https://github.com/cgcone/cgcone" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    github.com/cgcone/cgcone
                  </a>{' '}
                  and clone it locally.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 rounded-lg border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold font-mono">2</div>
              <div>
                <p className="font-medium mb-1">Add a markdown file</p>
                <p className="text-sm text-muted-foreground">
                  Create a <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">.md</code> file in the appropriate <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">content/</code> directory with the required frontmatter fields.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 rounded-lg border border-border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold font-mono">3</div>
              <div>
                <p className="font-medium mb-1">Open a Pull Request</p>
                <p className="text-sm text-muted-foreground">
                  Submit your PR with a clear description of what you&apos;re adding. The registry is regenerated automatically on merge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content types */}
        <section className="mb-12">
          <h2 className="text-display-3 mb-6">Content Types</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {contentTypes.map(type => {
              const Icon = type.icon
              return (
                <div key={type.title} className="p-5 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-full ${type.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${type.color}`} />
                    </div>
                    <h3 className="font-medium">{type.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                  <div className="text-xs text-muted-foreground mb-3">
                    <code className="text-primary">{type.dir}</code>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {type.fields.map(field => (
                      <Badge key={field} variant="secondary" className="text-xs font-mono">{field}</Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* MCP Servers */}
        <section className="mb-12">
          <h2 className="text-display-3 mb-4">MCP Servers</h2>
          <div className="p-5 rounded-lg border border-border bg-card">
            <p className="text-muted-foreground mb-4">
              MCP servers are automatically fetched from two sources on a nightly schedule:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">Official</Badge>
                <div>
                  <p className="text-sm font-medium">Model Context Protocol Registry</p>
                  <p className="text-sm text-muted-foreground">
                    <a href="https://registry.modelcontextprotocol.io" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      registry.modelcontextprotocol.io
                    </a>
                    {' '}— verified and community servers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">Docker</Badge>
                <div>
                  <p className="text-sm font-medium">Docker Hub MCP Organization</p>
                  <p className="text-sm text-muted-foreground">
                    <a href="https://hub.docker.com/u/mcp" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                      hub.docker.com/u/mcp
                    </a>
                    {' '}— containerized MCP servers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* File format example */}
        <section className="mb-12">
          <h2 className="text-display-3 mb-4">Example File Format</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">content/subagents/my-agent.md</span>
            </div>
            <pre className="p-5 text-sm font-mono text-foreground/80 overflow-x-auto leading-relaxed">
{`---
name: my-agent
category: developer-tools
description: Brief description of what this agent does.
tools: [Read, Write, Bash]
tags: [productivity, automation]
---

You are a specialized assistant focused on...
[System prompt content here]`}
            </pre>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="https://github.com/cgcone/cgcone" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              <GitHubLogoIcon className="h-4 w-4" />
              Fork on GitHub
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <Link href="/subagents">
            <Button size="lg" variant="outline">
              Browse Examples
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
