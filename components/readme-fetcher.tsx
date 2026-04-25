"use client"

import { useEffect, useState } from "react"
import { ReadmeClient } from "@/components/readme-client"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import type { TocItem } from "@/lib/markdown"

interface Props {
  githubUrl: string
  repoName?: string
}

export function ReadmeFetcher({ githubUrl, repoName }: Props) {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [html, setHtml]   = useState('')
  const [toc, setToc]     = useState<TocItem[]>([])
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    fetch(`/api/readme?url=${encodeURIComponent(githubUrl)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setHtml(data.html)
        setToc(data.toc)
        setTruncated(data.truncated)
        setState('done')
      })
      .catch(() => setState('error'))
  }, [githubUrl])

  if (state === 'error') return null

  if (state === 'loading') {
    return (
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-semibold">README</h2>
          <a
            href={`${githubUrl}#readme`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitHubLogoIcon className="h-3.5 w-3.5" />
            <span>View on GitHub</span>
          </a>
        </div>
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-base font-semibold">README</h2>
        <a
          href={`${githubUrl}#readme`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <GitHubLogoIcon className="h-3.5 w-3.5" />
          <span>View on GitHub</span>
        </a>
      </div>
      <ReadmeClient
        html={html}
        toc={toc}
        sourceUrl={githubUrl}
        repoName={repoName}
        truncated={truncated}
      />
    </section>
  )
}
