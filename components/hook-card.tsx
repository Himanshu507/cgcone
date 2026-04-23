import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Hook } from "@/lib/types"

interface HookCardProps {
  hook: Hook
}

const eventColors: Record<string, string> = {
  PostToolUse: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PreToolUse: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Notification: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Stop: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function HookCard({ hook }: HookCardProps) {
  const eventColor = eventColors[hook.event] || "bg-muted text-muted-foreground border-border"

  return (
    <Link href={`/hook/${hook.slug}`}>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground hover:text-primary transition-colors flex-1">
            {hook.name || hook.slug}
          </h3>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${eventColor}`}
          >
            {hook.event}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {hook.description || "No description available."}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <Badge variant="outline" className="text-xs">
            {hook.category}
          </Badge>
          {hook.language && (
            <Badge variant="secondary" className="text-xs font-mono">
              {hook.language}
            </Badge>
          )}
          {hook.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}
