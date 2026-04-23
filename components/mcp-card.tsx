"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InstallationModal } from "@/components/installation-modal"
import type { MCPServer } from "@/lib/types"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { Terminal } from "lucide-react"

interface MCPCardProps {
  server: MCPServer
}

const verificationColors = {
  verified: "bg-green-500/10 text-green-500 border-green-500/20",
  community: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  experimental: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
}

export function MCPCard({ server }: MCPCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/mcp-server/${server.slug}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground hover:text-primary transition-colors truncate">
              {server.displayName}
            </h3>
          </Link>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${verificationColors[server.verificationStatus]}`}
          >
            {server.verificationStatus}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {server.description || "No description available."}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {server.category}
          </Badge>
          {server.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="flex-1 gap-1.5"
          >
            <Terminal className="h-3.5 w-3.5" />
            Install
          </Button>
          {server.githubUrl && (
            <a
              href={server.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <GitHubLogoIcon className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      <InstallationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        serverName={server.displayName}
        serverSlug={server.slug}
        githubUrl={server.githubUrl}
        dockerUrl={server.dockerUrl}
      />
    </>
  )
}
