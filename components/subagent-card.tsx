import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Subagent } from "@/lib/types"

interface SubagentCardProps {
  subagent: Subagent
}

export function SubagentCard({ subagent }: SubagentCardProps) {
  return (
    <Link href={`/subagent/${subagent.slug}`}>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
        <div>
          <h3 className="font-medium text-foreground hover:text-primary transition-colors">
            {subagent.name || subagent.slug}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {subagent.description || "No description available."}
        </p>

        {subagent.tools && subagent.tools.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tools</p>
            <div className="flex flex-wrap gap-1.5">
              {subagent.tools.slice(0, 3).map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs font-mono">
                  {tool}
                </Badge>
              ))}
              {subagent.tools.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{subagent.tools.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <Badge variant="outline" className="text-xs">
            {subagent.category}
          </Badge>
          {subagent.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}
