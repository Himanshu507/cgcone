"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { HookCard } from "@/components/hook-card"
import type { Hook } from "@/lib/types"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface HooksClientProps {
  hooks: Hook[]
}

export default function HooksClient({ hooks }: HooksClientProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = useMemo(() => {
    const cats = new Set(hooks.map(h => h.category))
    return ["all", ...Array.from(cats).sort()]
  }, [hooks])

  const filtered = useMemo(() => {
    return hooks.filter(h => {
      const matchesSearch =
        !search ||
        (h.name || h.slug).toLowerCase().includes(search.toLowerCase()) ||
        h.description.toLowerCase().includes(search.toLowerCase()) ||
        h.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      const matchesCategory = activeCategory === "all" || h.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [hooks, search, activeCategory])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-display-2 mb-3">Hooks</h1>
          <p className="text-muted-foreground">{hooks.length} automation hooks</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hooks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
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

        <p className="text-sm text-muted-foreground mb-6">{filtered.length} results</p>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No hooks found matching your criteria.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(hook => (
              <HookCard key={hook.slug} hook={hook} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
