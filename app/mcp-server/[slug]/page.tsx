import { getMCPBySlug, getMCPServers } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import MCPInstallSection from "./install-section"
import { ArrowLeft } from "lucide-react"

export async function generateStaticParams() {
  const servers = getMCPServers()
  return servers.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const server = getMCPBySlug(slug)
  if (!server) return { title: "Not Found" }
  return {
    title: `${server.displayName} - MCP Server - CGCone`,
    description: server.description,
  }
}

const verificationColors = {
  verified: "bg-green-500/10 text-green-500 border-green-500/20",
  community: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  experimental: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

export default async function MCPServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const server = getMCPBySlug(slug)
  if (!server) notFound()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back */}
        <Link href="/mcp-servers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to MCP Servers
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="text-display-2 mb-3">{server.displayName}</h1>
              <p className="text-lg text-muted-foreground">{server.description}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${verificationColors[server.verificationStatus]}`}
            >
              {server.verificationStatus}
            </span>
          </div>
        </div>

        {/* Install section (client) */}
        <MCPInstallSection server={server} />

        {/* Metadata grid */}
        <div className="grid sm:grid-cols-2 gap-6 mt-10">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{server.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server Type</span>
                <Badge variant="secondary" className="font-mono">{server.serverType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="outline">{server.sourceRegistry}</Badge>
              </div>
              {server.vendor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor</span>
                  <span className="text-foreground">{server.vendor}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Links</h3>
            <div className="space-y-2">
              {server.githubUrl && (
                <a href={server.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    GitHub Repository
                  </Button>
                </a>
              )}
              {server.dockerUrl && (
                <a href={server.dockerUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Docker Hub
                  </Button>
                </a>
              )}
              {server.documentationUrl && (
                <a href={server.documentationUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Documentation
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {server.tags && server.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {server.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
