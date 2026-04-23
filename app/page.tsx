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
