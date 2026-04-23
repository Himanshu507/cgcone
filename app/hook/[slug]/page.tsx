import { getHookBySlug, getHooks } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export async function generateStaticParams() {
  const hooks = getHooks()
  return hooks.map(h => ({ slug: h.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hook = getHookBySlug(slug)
  if (!hook) return { title: "Not Found" }
  return {
    title: `${hook.name || hook.slug} - Hook - CGCone`,
    description: hook.description,
  }
}

const eventColors: Record<string, string> = {
  PostToolUse: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PreToolUse: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Notification: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Stop: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default async function HookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const hook = getHookBySlug(slug)
  if (!hook) notFound()

  const eventColor = eventColors[hook.event] || "bg-muted text-muted-foreground border-border"

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/hooks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Hooks
        </Link>

        <div className="mb-8">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="text-display-2 mb-3">{hook.name || hook.slug}</h1>
              <p className="text-lg text-muted-foreground">{hook.description}</p>
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${eventColor}`}>
              {hook.event}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{hook.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <Badge variant="secondary">{hook.event}</Badge>
              </div>
              {hook.matcher && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matcher</span>
                  <Badge variant="secondary" className="font-mono text-xs">{hook.matcher}</Badge>
                </div>
              )}
              {hook.language && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="secondary" className="font-mono text-xs">{hook.language}</Badge>
                </div>
              )}
            </div>
          </div>

          {hook.tags && hook.tags.length > 0 && (
            <div className="p-5 rounded-lg border border-border bg-card space-y-3">
              <h3 className="font-medium">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {hook.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {hook.content && (
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-medium mb-4">Implementation</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {hook.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
