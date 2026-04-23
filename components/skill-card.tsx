import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Skill } from "@/lib/types"

interface SkillCardProps {
  skill: Skill
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link href={`/skill/${skill.slug}`}>
      <div className="p-5 rounded-lg border border-border hover:border-primary/40 transition-colors h-full flex flex-col gap-3 bg-card">
        <div>
          <h3 className="font-medium text-foreground hover:text-primary transition-colors">
            {skill.name || skill.slug}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {skill.description || "No description available."}
        </p>

        {skill.allowedTools && skill.allowedTools.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Allowed tools</p>
            <div className="flex flex-wrap gap-1.5">
              {skill.allowedTools.slice(0, 3).map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs font-mono">
                  {tool}
                </Badge>
              ))}
              {skill.allowedTools.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skill.allowedTools.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <Badge variant="outline" className="text-xs">
            {skill.category}
          </Badge>
          {skill.model && (
            <Badge variant="secondary" className="text-xs font-mono">
              {skill.model}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
