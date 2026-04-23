import { getMCPBySlug, getMCPServers } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import MCPInstallSection from "./install-section"
import { ReadmeViewer } from "@/components/readme-viewer"
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
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">

        {/* Back */}
        <Link href="/mcp-servers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to MCP Servers
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-3">
            <h1 className="text-display-2 flex-1 min-w-0 break-words">{server.displayName}</h1>
            <span className={`self-start shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${verificationColors[server.verificationStatus]}`}>
              {server.verificationStatus}
            </span>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground">{server.description}</p>
        </div>

        {/* Install section (client) */}
        <MCPInstallSection server={server} />

        {/* Metadata grid */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
          <div className="p-4 sm:p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Category</span>
                <Badge variant="outline" className="truncate max-w-[160px]">{server.category}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Server Type</span>
                <Badge variant="secondary" className="font-mono truncate max-w-[160px]">{server.serverType}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Source</span>
                <Badge variant="outline" className="truncate max-w-[160px]">{server.sourceRegistry}</Badge>
              </div>
              {server.vendor && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Vendor</span>
                  <span className="text-foreground truncate">{server.vendor}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-lg border border-border bg-card space-y-3">
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
              {!server.githubUrl && !server.dockerUrl && !server.documentationUrl && (
                <p className="text-sm text-muted-foreground">No links available</p>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {server.tags && server.tags.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h3 className="font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {server.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* README — wider container so TOC + content have room */}
      {server.readmeContent && (
        <div className="container mx-auto px-4 pb-16 max-w-6xl">
          <div className="border-t border-border/40 pt-10 sm:pt-12">
            <ReadmeViewer
              content={server.readmeContent}
              sourceUrl={server.githubUrl}
              repoName={server.githubUrl?.replace('https://github.com/', '')}
              truncated={server.readmeTruncated}
            />
          </div>
        </div>
      )}
    </div>
  )
}
