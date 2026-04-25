"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { PluginCard } from "@/components/plugin-card"
import type { Plugin } from "@/lib/types"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PluginsClientProps {
  plugins: Plugin[]
}

export default function PluginsClient({ plugins }: PluginsClientProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [sortBy, setSortBy] = useState("stars")

  const categories = useMemo(() => {
    const cats = new Set(plugins.map(p => p.category))
    return ["all", ...Array.from(cats).sort()]
  }, [plugins])

  const filtered = useMemo(() => {
    let result = plugins.filter(p => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === "all" || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
    if (sortBy === "stars") result = [...result].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [plugins, search, activeCategory, sortBy])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-display-2 mb-3">Plugins</h1>
          <p className="text-muted-foreground">{plugins.length} plugins from the community</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">Most Stars</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
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
            No plugins found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map(plugin => (
              <PluginCard key={plugin.slug} plugin={plugin} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
