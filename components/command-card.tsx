import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Command } from "@/lib/types"

interface CommandCardProps {
  command: Command
}

export function CommandCard({ command }: CommandCardProps) {
  return (
    <Link href={`/command/${command.slug}`}>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-sm">{command.prefix || "/"}</span>
          <h3 className="font-medium text-foreground hover:text-primary transition-colors">
            {command.name || command.slug}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {command.description || "No description available."}
        </p>

        {command.argumentHint && (
          <div className="rounded-md bg-secondary px-3 py-1.5 overflow-x-auto">
            <code className="font-mono text-xs text-muted-foreground whitespace-nowrap">
              {command.prefix || "/"}{command.name} {command.argumentHint}
            </code>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <Badge variant="outline" className="text-xs">
            {command.category}
          </Badge>
          {command.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}
