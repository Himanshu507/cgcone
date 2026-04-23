import { getPluginBySlug, getPlugins } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { GitHubLogoIcon, StarFilledIcon } from "@radix-ui/react-icons"
import { formatNumber } from "@/lib/utils"

export async function generateStaticParams() {
  const plugins = getPlugins()
  return plugins.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const plugin = getPluginBySlug(slug)
  if (!plugin) return { title: "Not Found" }
  return {
    title: `${plugin.name} - Plugin - CGCone`,
    description: plugin.description,
  }
}

export default async function PluginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const plugin = getPluginBySlug(slug)
  if (!plugin) notFound()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/plugins" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Plugins
        </Link>

        <div className="mb-8">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1">
              <h1 className="text-display-2 mb-3">{plugin.name}</h1>
              <p className="text-lg text-muted-foreground">{plugin.description}</p>
            </div>
            {plugin.stars !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <StarFilledIcon className="h-4 w-4 text-yellow-500" />
                <span>{formatNumber(plugin.stars)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author</span>
                <span>{plugin.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="secondary" className="font-mono">v{plugin.version}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{plugin.category}</Badge>
              </div>
              {plugin.license && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License</span>
                  <Badge variant="outline">{plugin.license}</Badge>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Links</h3>
            <div className="space-y-2">
              {plugin.repository && (
                <a href={plugin.repository} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <GitHubLogoIcon className="h-4 w-4" />
                    Repository
                  </Button>
                </a>
              )}
              {plugin.authorUrl && (
                <a href={plugin.authorUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Author Profile
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {plugin.keywords && plugin.keywords.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium mb-3">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {plugin.keywords.map(kw => (
                <Badge key={kw} variant="secondary">{kw}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
