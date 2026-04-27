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
    <div className="relative p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
      {/* Whole-card click overlay - mouse navigation, hidden from a11y */}
      <Link
        href={`/plugin/${plugin.slug}`}
        className="absolute inset-0 rounded-lg z-0"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="flex items-start justify-between gap-2 relative z-10">
        <h3 className="font-medium text-foreground truncate flex-1 min-w-0">
          {plugin.name}
        </h3>
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

      <div className="relative z-10 flex items-center gap-2 mt-auto pt-1">
        <span className="text-xs text-muted-foreground flex-1">by {typeof plugin.author === 'object' ? (plugin.author as {name?: string})?.name : plugin.author}</span>
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
