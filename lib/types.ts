export interface Registry {
  generatedAt: string
  mcpServers: MCPServer[]
  plugins: Plugin[]
  subagents: Subagent[]
  skills: Skill[]
  commands: Command[]
  hooks: Hook[]
  marketplaces: Marketplace[]
}

export interface MCPServer {
  name: string
  displayName: string
  slug: string
  description: string
  category: string
  tags: string[]
  serverType: 'stdio' | 'http' | 'sse'
  vendor?: string
  logoUrl?: string
  sourceRegistry: 'official-mcp' | 'docker' | 'github' | 'community'
  sourceUrl?: string
  githubUrl?: string
  dockerUrl?: string
  npmUrl?: string
  documentationUrl?: string
  githubStars?: number
  dockerPulls?: number
  packages?: unknown[]
  installationMethods?: unknown[]
  verificationStatus: 'verified' | 'community' | 'experimental'
  lastIndexedAt: string
}

export interface Plugin {
  name: string
  slug: string
  description: string
  version: string
  author: string
  authorUrl?: string
  repository: string
  license?: string
  keywords: string[]
  category: string
  stars?: number
  lastIndexedAt: string
}

export interface Subagent {
  name: string
  slug: string
  category: string
  description: string
  tools: string[]
  tags: string[]
  content: string
}

export interface Skill {
  name: string
  slug: string
  category: string
  description: string
  allowedTools: string[]
  model?: string
  content: string
}

export interface Command {
  name: string
  slug: string
  category: string
  description: string
  argumentHint: string
  model?: string
  prefix: string
  tags: string[]
  content: string
}

export interface Hook {
  name: string
  slug: string
  category: string
  description: string
  event: string
  matcher: string
  language: string
  tags: string[]
  content: string
}

export interface Marketplace {
  name: string
  displayName: string
  namespace: string
  description: string
  url: string
  repository: string
  installCommand: string
  pluginCount: number
  skillCount: number
  stars: number
  categories: string[]
  badges: string[]
  maintainerName: string
  maintainerGithub: string
  lastIndexedAt: string
}
