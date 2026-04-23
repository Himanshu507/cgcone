import { getSkillBySlug, getSkills } from "@/lib/registry"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export async function generateStaticParams() {
  const skills = getSkills()
  return skills.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const skill = getSkillBySlug(slug)
  if (!skill) return { title: "Not Found" }
  return {
    title: `${skill.name || skill.slug} - Skill - CGCone`,
    description: skill.description,
  }
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const skill = getSkillBySlug(slug)
  if (!skill) notFound()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/skills" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Skills
        </Link>

        <div className="mb-8">
          <h1 className="text-display-2 mb-3">{skill.name || skill.slug}</h1>
          <p className="text-lg text-muted-foreground">{skill.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-lg border border-border bg-card space-y-3">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{skill.category}</Badge>
              </div>
              {skill.model && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <Badge variant="secondary" className="font-mono text-xs">{skill.model}</Badge>
                </div>
              )}
            </div>
          </div>

          {skill.allowedTools && skill.allowedTools.length > 0 && (
            <div className="p-5 rounded-lg border border-border bg-card space-y-3">
              <h3 className="font-medium">Allowed Tools</h3>
              <div className="flex flex-wrap gap-2">
                {skill.allowedTools.map(tool => (
                  <Badge key={tool} variant="secondary" className="font-mono text-xs">{tool}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {skill.content && (
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-medium mb-4">Instructions</h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {skill.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
