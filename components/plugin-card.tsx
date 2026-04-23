"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Plugin } from "@/lib/types"
import { GitHubLogoIcon, StarFilledIcon } from "@radix-ui/react-icons"
import { formatNumber } from "@/lib/utils"

interface PluginCardProps {
  plugin: Plugin
}

export function PluginCard({ plugin }: PluginCardProps) {
  return (
    <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/plugin/${plugin.slug}`} className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground hover:text-primary transition-colors truncate">
            {plugin.name}
          </h3>
        </Link>
        {plugin.stars !== undefined && plugin.stars > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <StarFilledIcon className="h-3 w-3 text-yellow-500" />
            {formatNumber(plugin.stars)}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
        {plugin.description || "No description available."}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {plugin.category}
        </Badge>
        <Badge variant="secondary" className="text-xs font-mono">
          v{plugin.version}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        <span className="text-xs text-muted-foreground flex-1">by {plugin.author}</span>
        {plugin.repository && (
          <a
            href={plugin.repository}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View repository"
          >
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <GitHubLogoIcon className="h-3.5 w-3.5" />
              Repo
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
