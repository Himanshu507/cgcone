import { renderMarkdown } from '@/lib/markdown'
import { GitHubLogoIcon } from '@radix-ui/react-icons'

interface ReadmeViewerProps {
  content: string
  sourceUrl?: string
  repoName?: string
  truncated?: boolean
}

export function ReadmeViewer({ content, sourceUrl, repoName, truncated }: ReadmeViewerProps) {
  const html = renderMarkdown(content)

  return (
    <section className="mt-10 sm:mt-12">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-base font-semibold">README</h2>
        {sourceUrl && (
          <a
            href={`${sourceUrl}#readme`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitHubLogoIcon className="h-3.5 w-3.5" />
            <span>View on GitHub</span>
          </a>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div
          className="p-6 sm:p-8 readme-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="px-6 sm:px-8 py-3 border-t border-border/50 bg-secondary/30 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <GitHubLogoIcon className="h-3 w-3 shrink-0" />
          <span>README sourced from GitHub{repoName ? ` · ${repoName}` : ''}</span>
          {truncated && sourceUrl && (
            <>
              <span className="text-border/60">·</span>
              <span>Content truncated.</span>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View full README →
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
