import { renderMarkdown, extractToc } from "@/lib/markdown"
import { ReadmeClient } from "@/components/readme-client"
import { GitHubLogoIcon } from "@radix-ui/react-icons"

interface ReadmeViewerProps {
  content: string
  sourceUrl?: string
  repoName?: string
  truncated?: boolean
}

export function ReadmeViewer({ content, sourceUrl, repoName, truncated }: ReadmeViewerProps) {
  const html = renderMarkdown(content, sourceUrl)
  const toc = extractToc(content)

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

      <ReadmeClient
        html={html}
        toc={toc}
        sourceUrl={sourceUrl}
        repoName={repoName}
        truncated={truncated}
      />
    </section>
  )
}
