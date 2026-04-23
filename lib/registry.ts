import fs from 'fs'
import path from 'path'
import type { Registry, MCPServer, Plugin, Subagent, Skill, Command, Hook, Marketplace } from './types'
import { resolveUrl } from './utils'

let cached: Registry | null = null

function normalizeMCPServer(raw: Record<string, unknown>): MCPServer {
  return {
    ...(raw as unknown as MCPServer),
    githubUrl: resolveUrl(raw.githubUrl),
    dockerUrl: resolveUrl(raw.dockerUrl) ?? (typeof raw.dockerUrl === 'string' ? raw.dockerUrl : undefined),
    documentationUrl: resolveUrl(raw.documentationUrl) ?? (typeof raw.documentationUrl === 'string' ? raw.documentationUrl : undefined),
    npmUrl: resolveUrl(raw.npmUrl) ?? (typeof raw.npmUrl === 'string' ? raw.npmUrl : undefined),
    description: typeof raw.description === 'string' ? raw.description : '',
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    packages: Array.isArray(raw.packages) ? raw.packages : [],
  }
}

function loadRegistry(): Registry {
  if (cached) return cached
  const filePath = path.join(process.cwd(), 'public', 'registry.json')
  if (!fs.existsSync(filePath)) {
    return {
      generatedAt: '',
      mcpServers: [],
      plugins: [],
      subagents: [],
      skills: [],
      commands: [],
      hooks: [],
      marketplaces: [],
    }
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  cached = {
    ...raw,
    mcpServers: Array.isArray(raw.mcpServers)
      ? raw.mcpServers.map((s: Record<string, unknown>) => normalizeMCPServer(s))
      : [],
  } as Registry
  return cached
}

export const getMCPServers = (): MCPServer[] => loadRegistry().mcpServers
export const getMCPBySlug = (slug: string): MCPServer | null =>
  loadRegistry().mcpServers.find(s => s.slug === slug) ?? null
export const getPlugins = (): Plugin[] => loadRegistry().plugins
export const getPluginBySlug = (slug: string): Plugin | null =>
  loadRegistry().plugins.find(p => p.slug === slug) ?? null
export const getSubagents = (): Subagent[] => loadRegistry().subagents
export const getSubagentBySlug = (slug: string): Subagent | null =>
  loadRegistry().subagents.find(s => s.slug === slug) ?? null
export const getSkills = (): Skill[] => loadRegistry().skills
export const getSkillBySlug = (slug: string): Skill | null =>
  loadRegistry().skills.find(s => s.slug === slug) ?? null
export const getCommands = (): Command[] => loadRegistry().commands
export const getCommandBySlug = (slug: string): Command | null =>
  loadRegistry().commands.find(c => c.slug === slug) ?? null
export const getHooks = (): Hook[] => loadRegistry().hooks
export const getHookBySlug = (slug: string): Hook | null =>
  loadRegistry().hooks.find(h => h.slug === slug) ?? null
export const getMarketplaces = (): Marketplace[] => loadRegistry().marketplaces
export const getStats = () => {
  const r = loadRegistry()
  return {
    mcpCount: r.mcpServers.length,
    pluginCount: r.plugins.length,
    subagentCount: r.subagents.length,
    skillCount: r.skills.length,
    commandCount: r.commands.length,
    hookCount: r.hooks.length,
    marketplaceCount: r.marketplaces.length,
  }
}
