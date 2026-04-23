import { getCommandBySlug, getCommands } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export async function generateStaticParams() {
  const commands = getCommands()
  return commands.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const command = getCommandBySlug(slug)
  if (!command) return { title: "Not Found" }
  return {
    title: `${command.prefix || "/"}${command.name || command.slug} - Command - CGCone`,
    description: command.description,
  }
}

export default async function CommandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const command = getCommandBySlug(slug)
  if (!command) notFound()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/commands" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Commands
        </Link>

        <div className="mb-8">
          <h1 className="text-display-2 mb-3">
            <span className="text-primary font-mono">{command.prefix || "/"}</span>
            {command.name || command.slug}
          </h1>
          <p className="text-lg text-muted-foreground">{command.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{command.category}</Badge>
              </div>
              {command.model && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <Badge variant="secondary" className="font-mono text-xs">{command.model}</Badge>
                </div>
              )}
            </div>
          </div>

          {command.argumentHint && (
            <div className="p-5 rounded-lg border border-border bg-card space-y-3">
              <h3 className="font-medium">Usage</h3>
              <div className="rounded-md bg-secondary px-3 py-2">
                <code className="font-mono text-sm text-foreground/90">
                  {command.prefix || "/"}{command.name} {command.argumentHint}
                </code>
              </div>
            </div>
          )}
        </div>

        {command.tags && command.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {command.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {command.content && (
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-medium mb-4">Instructions</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {command.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
