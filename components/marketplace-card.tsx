import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Marketplace } from "@/lib/types"
import { StarFilledIcon } from "@radix-ui/react-icons"
import { formatNumber } from "@/lib/utils"

interface MarketplaceCardProps {
  marketplace: Marketplace
}

export function MarketplaceCard({ marketplace }: MarketplaceCardProps) {
  return (
    <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <Link href={marketplace.url} target="_blank" rel="noopener noreferrer">
          <h3 className="font-medium text-foreground hover:text-primary transition-colors">
            {marketplace.displayName}
          </h3>
        </Link>
        {marketplace.stars > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <StarFilledIcon className="h-3 w-3 text-yellow-500" />
            {formatNumber(marketplace.stars)}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
        {marketplace.description || "No description available."}
      </p>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {marketplace.pluginCount > 0 && (
          <span>{marketplace.pluginCount} plugins</span>
        )}
        {marketplace.skillCount > 0 && (
          <span>{marketplace.skillCount} skills</span>
        )}
      </div>

      <div className="rounded-md bg-secondary border border-border p-2">
        <code className="font-mono text-xs text-foreground/80 break-all">
          {marketplace.installCommand}
        </code>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
        {marketplace.badges?.map((badge) => (
          <Badge key={badge} variant="secondary" className="text-xs">
            {badge}
          </Badge>
        ))}
        {marketplace.categories?.slice(0, 2).map((cat) => (
          <Badge key={cat} variant="outline" className="text-xs">
            {cat}
          </Badge>
        ))}
      </div>
    </div>
  )
}
