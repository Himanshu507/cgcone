import MCPPageClient from "./mcp-client"

export const metadata = {
  title: "MCP Servers - CGCone",
  description: "Browse MCP (Model Context Protocol) servers for Claude. Find verified and community servers for databases, tools, and integrations.",
}

export default function MCPServersPage() {
  return <MCPPageClient />
}
