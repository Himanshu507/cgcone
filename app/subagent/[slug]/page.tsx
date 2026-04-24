import { getSubagentBySlug, getSubagents } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export async function generateStaticParams() {
  const subagents = getSubagents()
  return subagents.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const subagent = getSubagentBySlug(slug)
  if (!subagent) return { title: "Not Found" }
  return {
    title: `${subagent.name || subagent.slug} - Subagent - CGCone`,
    description: subagent.description,
  }
}

export default async function SubagentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const subagent = getSubagentBySlug(slug)
  if (!subagent) notFound()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
        <Link href="/subagents" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to Subagents
        </Link>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-display-2 mb-3 break-words">{subagent.name || subagent.slug}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">{subagent.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="p-4 sm:p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Category</span>
                <Badge variant="outline" className="truncate max-w-[160px]">{subagent.category}</Badge>
              </div>
            </div>
          </div>

          {subagent.tools && subagent.tools.length > 0 && (
            <div className="p-4 sm:p-5 rounded-lg border border-border bg-card space-y-3">
              <h3 className="font-medium">Tools</h3>
              <div className="flex flex-wrap gap-2">
                {subagent.tools.map(tool => (
                  <Badge key={tool} variant="secondary" className="font-mono text-xs">{tool}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {subagent.tags && subagent.tags.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {subagent.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {subagent.content && (
          <div className="p-4 sm:p-6 rounded-lg border border-border bg-card">
            <h3 className="font-medium mb-3 sm:mb-4">Instructions</h3>
            <div className="overflow-x-auto">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed break-words">
                {subagent.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
