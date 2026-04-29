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
  serverType: string
  vendor?: string
  logoUrl?: string
  sourceRegistry: string
  sourceUrl?: string
  githubUrl?: string
  dockerUrl?: string
  npmUrl?: string
  documentationUrl?: string
  stars?: number
  githubStars?: number
  dockerPulls?: number
  packages?: unknown[]
  installationMethods?: unknown[]
  verificationStatus: 'verified' | 'community' | 'experimental'
  isArchived?: boolean
  lastCommit?: string
  lastIndexedAt: string
  readmeContent?: string
  readmeTruncated?: boolean
}

export interface Plugin {
  name: string
  slug: string
  description: string
  version: string
  author: string | { name?: string; email?: string; url?: string }
  authorUrl?: string
  repository: string
  license?: string
  keywords: string[]
  category: string
  stars?: number
  lastIndexedAt: string
  readmeContent?: string
  readmeTruncated?: boolean
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
