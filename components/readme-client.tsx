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

    const headings = Array.from(el.querySelectorAll<HTMLElement>("h2[id], h3[id]"))

    // Scroll spy
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: 0 }
    )
    headings.forEach(h => observer.observe(h))

    // Reading progress
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
  }, [])

  return (
    /* Grid: content column + sticky TOC column. items-start is critical —
       prevents grid from stretching the TOC cell, which would break sticky. */
    <div className={`grid grid-cols-1 gap-6 items-start ${hasToc ? "lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_248px]" : ""}`}>

      {/* ── Left: content ── */}
      <div className="min-w-0">
        {/* Thin progress strip above the card */}
        {hasToc && (
          <div className="h-[2px] rounded-full bg-border/40 mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Prose card — no overflow-hidden so images/tables can scroll */}
        <div className="rounded-lg border border-border bg-card">
          <div
            ref={contentRef}
            className="p-6 sm:p-8 readme-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Citation */}
        <div className="mt-3 px-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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

      {/* ── Right: sticky TOC ── */}
      {hasToc && (
        <aside className="hidden lg:block sticky top-20 self-start">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-2">
              On this page
            </p>

            <nav
              className="space-y-0.5 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 16rem)" }}
            >
              {toc.map(item => (
                <a
                  key={`${item.id}-${item.level}`}
                  href={`#${item.id}`}
                  className={[
                    "flex items-center gap-2.5 py-1.5 px-2 rounded-md text-[12.5px] leading-snug transition-colors duration-100",
                    item.level === 3 ? "pl-5" : "",
                    activeId === item.id
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "rounded-full shrink-0 transition-colors",
                      item.level === 3 ? "w-[3px] h-[3px]" : "w-1 h-1",
                      activeId === item.id ? "bg-primary" : "bg-current opacity-30",
                    ].join(" ")}
                  />
                  <span className="truncate">{item.text}</span>
                </a>
              ))}
            </nav>

            {/* Progress meter */}
            <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5 px-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Read</span>
                <span className="tabular-nums font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
