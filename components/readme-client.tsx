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
  const contentRef = useRef<HTMLDivElement>(null)
  const hasToc = toc.length > 1

  useEffect(() => {
    // TOC is only visible on lg+ - skip all scroll work on smaller screens
    if (!window.matchMedia("(min-width: 1024px)").matches) return

    const el = contentRef.current
    if (!el) return

    const THRESHOLD = 88 + 8 // navbar height + buffer

    // Cache absolute document positions once - no DOM queries on scroll
    type HeadingPos = { id: string; top: number }
    let positions: HeadingPos[] = []

    const cachePositions = () => {
      positions = Array.from(
        el.querySelectorAll<HTMLElement>("h2[id], h3[id]")
      ).map(h => ({ id: h.id, top: h.getBoundingClientRect().top + window.scrollY }))
    }

    cachePositions()
    // Re-cache after images/fonts settle
    window.addEventListener("load", cachePositions, { once: true })
    window.addEventListener("resize", cachePositions, { passive: true })

    let rafId = 0
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        if (!positions.length) return
        const scrollLine = window.scrollY + THRESHOLD
        let current = positions[0].id
        for (const { id, top } of positions) {
          if (top <= scrollLine) current = id
        }
        setActiveId(current)
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", cachePositions)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className={`grid grid-cols-1 gap-6 xl:gap-8 items-start ${hasToc ? "lg:grid-cols-[200px_1fr]" : ""}`}>

      {/* TOC - left column, sticky */}
      {hasToc && (
        <aside className="hidden lg:block sticky top-20 self-start order-first">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              On this page
            </p>
            <nav
              className="space-y-0.5 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 12rem)" }}
            >
              {toc.map((item, i) => (
                <a
                  key={i}
                  href={`#${item.id}`}
                  className={[
                    "flex items-center gap-2 py-1.5 px-2 rounded-md text-[12.5px] leading-snug transition-colors duration-100",
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
          </div>
        </aside>
      )}

      {/* Content - right column */}
      <div className="min-w-0">
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

    </div>
  )
}
