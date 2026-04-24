"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { SkillCard } from "@/components/skill-card"
import type { Skill } from "@/lib/types"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SkillsClientProps {
  skills: Skill[]
}

export default function SkillsClient({ skills }: SkillsClientProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const categories = useMemo(() => {
    const cats = new Set(skills.map(s => s.category))
    return ["all", ...Array.from(cats).sort()]
  }, [skills])

  const filtered = useMemo(() => {
    return skills.filter(s => {
      const matchesSearch =
        !search ||
        (s.name || s.slug).toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === "all" || s.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [skills, search, activeCategory])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-display-2 mb-3">Skills</h1>
          <p className="text-muted-foreground">{skills.length} curated skills</p>
        </div>

        <div className="relative mb-6 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
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
            No skills found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map(skill => (
              <SkillCard key={skill.slug} skill={skill} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
