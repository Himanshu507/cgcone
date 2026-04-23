"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { MCPCard } from "@/components/mcp-card"
import type { MCPServer } from "@/lib/types"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface MCPPageClientProps {
  servers: MCPServer[]
}

const PAGE_SIZE = 24

export default function MCPPageClient({ servers }: MCPPageClientProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [activeSource, setActiveSource] = useState<string>("all")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(servers.map(s => s.category))
    return ["all", ...Array.from(cats).sort()]
  }, [servers])

  const sources = ["all", "official-mcp", "docker", "github", "community"]

  const filtered = useMemo(() => {
    return servers.filter(s => {
      const matchesSearch =
        !search ||
        s.displayName.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      const matchesCategory = activeCategory === "all" || s.category === activeCategory
      const matchesSource = activeSource === "all" || s.sourceRegistry === activeSource
      return matchesSearch && matchesCategory && matchesSource
    })
  }, [servers, search, activeCategory, activeSource])

  const visible = filtered.slice(0, visibleCount)

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + PAGE_SIZE)
      }
    })
    observerRef.current.observe(node)
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-display-2 mb-3">MCP Servers</h1>
          <p className="text-muted-foreground">
            {servers.length} servers across {categories.length - 1} categories
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
            className="pl-9"
          />
        </div>

        {/* Source filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {sources.map(source => (
            <button
              key={source}
              onClick={() => { setActiveSource(source); setVisibleCount(PAGE_SIZE) }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors border",
                activeSource === source
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {source === "all" ? "All Sources" : source}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setVisibleCount(PAGE_SIZE) }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors border",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} results
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No MCP servers found matching your criteria.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map(server => (
                <MCPCard key={server.slug} server={server} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div ref={sentinelRef} className="h-10 mt-8" />
            )}
          </>
        )}
      </div>
    </div>
  )
}
