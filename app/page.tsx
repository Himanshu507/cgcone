import type { Metadata } from 'next'
import {
  getMCPServers,
  getPlugins,
  getSubagents,
  getSkills,
  getCommands,
  getHooks,
  getMarketplaces,
} from "@/lib/registry"
import HomePageClient from "./page-client"

export const metadata: Metadata = {
  title: 'cgcone - Universal AI CLI Extension Manager',
  description:
    'Install MCP servers, plugins, skills, and hooks once. cgcone syncs across Claude Code, Gemini CLI, OpenAI Codex, and Copilot CLI in one command.',
  keywords: [
    'MCP server', 'Claude Code', 'Gemini CLI', 'OpenAI Codex', 'AI CLI manager',
    'plugins', 'skills', 'hooks', 'subagents', 'cgcone', 'AI extensions marketplace',
  ],
  authors: [{ name: 'cgcone' }],
  openGraph: {
    type: 'website',
    url: 'https://cgcone.vercel.app',
    title: 'cgcone - Universal AI CLI Extension Manager',
    description:
      'Install MCP servers, plugins, and skills to every AI CLI - Claude Code, Gemini CLI, Codex - in one command.',
    siteName: 'cgcone',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'cgcone - Universal AI CLI Extension Manager',
    description:
      'Install MCP servers, plugins, and skills to every AI CLI - Claude Code, Gemini CLI, Codex - in one command.',
  },
  robots: { index: true, follow: true },
}

export default function Home() {
  const mcpServers = getMCPServers()
  const plugins = getPlugins()
  const subagents = getSubagents()
  const skills = getSkills()
  const commands = getCommands()
  const hooks = getHooks()
  const marketplaces = getMarketplaces()

  return (
    <HomePageClient
      mcpCount={mcpServers.length}
      pluginCount={plugins.length}
      subagentCount={subagents.length}
      skillCount={skills.length}
      commandCount={commands.length}
      hookCount={hooks.length}
      marketplaceCount={marketplaces.length}
      featuredMCPs={mcpServers.slice(0, 6)}
      featuredPlugins={plugins.slice(0, 6)}
      featuredSubagents={subagents.slice(0, 6)}
      featuredSkills={skills.slice(0, 6)}
      featuredCommands={commands.slice(0, 6)}
      featuredHooks={hooks.slice(0, 6)}
    />
  )
}
