"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { MCPCard } from "@/components/mcp-card"
import type { MCPServer } from "@/lib/types"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 24

const CATEGORIES = [
  'all', 'ai-models', 'browser', 'cloud', 'code-analysis', 'communication',
  'databases', 'dev-tools', 'education', 'entertainment', 'files', 'finance',
  'general', 'health', 'iot', 'productivity', 'science', 'security', 'web',
]

const SOURCES = ['all', 'official-mcp', 'github', 'docker', 'community']

export default function MCPPageClient() {
  const [search, setSearch]           = useState("")
  const [debouncedQ, setDebouncedQ]   = useState("")
  const [activeCategory, setCategory] = useState("all")
  const [activeSource, setSource]     = useState("all")
  const [sortBy, setSortBy]           = useState<"stars" | "relevance">("stars")

  const [items, setItems]             = useState<MCPServer[]>([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(0)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [fetchError, setFetchError]   = useState<string | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const hasMore = items.length < total

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Fetch first page whenever filters change
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setFetchError(null)
      const params = buildParams(debouncedQ, activeCategory, activeSource, sortBy, 0)
      try {
        const res  = await fetch(`/api/search?${params}`)
        const json = await res.json()
        if (cancelled) return
        if (json.error) { setFetchError(json.error); return }
        setItems(json.items)
        setTotal(json.total)
        setPage(0)
      } catch {
        if (!cancelled) setFetchError('Failed to load results. Try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [debouncedQ, activeCategory, activeSource, sortBy])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const nextPage = page + 1
    setLoadingMore(true)
    const params = buildParams(debouncedQ, activeCategory, activeSource, sortBy, nextPage)
    try {
      const res  = await fetch(`/api/search?${params}`)
      const json = await res.json()
      setItems(prev => [...prev, ...json.items])
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, debouncedQ, activeCategory, activeSource, sortBy])

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    if (!node) return
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    })
    observerRef.current.observe(node)
  }, [loadMore])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-display-2 mb-3">MCP Servers</h1>
          <p className="text-muted-foreground">
            {loading
              ? 'Loading...'
              : `${total.toLocaleString()} servers across ${CATEGORIES.length - 1} categories`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Source filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {SOURCES.map(source => (
            <button
              key={source}
              onClick={() => setSource(source)}
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
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
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

        {/* Sort + result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Searching...'
              : `Showing ${items.length.toLocaleString()} of ${total.toLocaleString()} results`}
          </p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground mr-1">Sort:</span>
            {(["stars", "relevance"] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  sortBy === opt
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt === "stars" ? "⭐ Stars" : "Relevance"}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <div className="py-20 text-center text-destructive text-sm">{fetchError}</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No MCP servers found matching your criteria.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {items.map(server => (
                <MCPCard key={server.slug} server={server} />
              ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center h-16 mt-4">
                {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function buildParams(q: string, category: string, source: string, sort: string, page: number) {
  return new URLSearchParams({ q, category, source, sort, page: String(page), limit: String(PAGE_SIZE) })
}
