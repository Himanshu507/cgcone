"use client"

import { useEffect, useRef, useState } from "react"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import type { TocItem } from "@/lib/markdown"

interface ReadmeClientProps {
  html: string
  toc: TocItem[]
  sourceUrl?: string
  repoName?: string
  truncated?: boolean
}

export function ReadmeClient({ html, toc, sourceUrl, repoName, truncated }: ReadmeClientProps) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "")
  const [progress, setProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const hasToc = toc.length > 1

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    // Scroll spy via IntersectionObserver
    if (hasToc) {
      const headings = Array.from(el.querySelectorAll<HTMLElement>("h2[id], h3[id]"))
      const observer = new IntersectionObserver(
        entries => {
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
          if (visible.length) setActiveId(visible[0].target.id)
        },
        { rootMargin: "-80px 0px -65% 0px", threshold: 0 }
      )
      headings.forEach(h => observer.observe(h))

      const onScroll = () => {
        const rect = el.getBoundingClientRect()
        const total = rect.height - window.innerHeight
        if (total <= 0) { setProgress(100); return }
        setProgress(Math.min(100, Math.round((Math.max(0, -rect.top) / total) * 100)))
      }
      window.addEventListener("scroll", onScroll, { passive: true })
      onScroll()

      return () => {
        observer.disconnect()
        window.removeEventListener("scroll", onScroll)
      }
    }
  }, [hasToc])

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Reading progress bar */}
      {hasToc && (
        <div className="h-[2px] bg-border/40">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className={hasToc ? "flex divide-x divide-border/60" : ""}>

        {/* TOC sidebar — desktop only */}
        {hasToc && (
          <aside className="hidden lg:flex flex-col w-52 xl:w-56 shrink-0">
            <div className="sticky top-20 p-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                On this page
              </p>

              <nav className="space-y-0.5">
                {toc.map(item => (
                  <a
                    key={`${item.id}-${item.level}`}
                    href={`#${item.id}`}
                    className={[
                      "flex items-center gap-2 py-1 text-[12.5px] leading-snug rounded transition-colors duration-150",
                      item.level === 3 ? "pl-3" : "pl-0",
                      activeId === item.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {item.level === 3 && (
                      <span className="w-1 h-1 rounded-full bg-current shrink-0 opacity-50" />
                    )}
                    <span className="truncate">{item.text}</span>
                  </a>
                ))}
              </nav>

              {/* Mini progress */}
              <div className="mt-5 pt-4 border-t border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Progress</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <div className="h-1 rounded-full bg-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/50 transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* README content */}
        <div
          ref={contentRef}
          className="flex-1 min-w-0 p-6 sm:p-8 readme-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Citation footer */}
      <div className="px-6 sm:px-8 py-3 border-t border-border/40 bg-secondary/20 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <GitHubLogoIcon className="h-3 w-3 shrink-0" />
        <span>README from GitHub{repoName ? ` · ${repoName}` : ""}</span>
        {truncated && sourceUrl && (
          <>
            <span className="opacity-30">·</span>
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
  )
}
