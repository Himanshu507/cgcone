"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { MarketplaceCard } from "@/components/marketplace-card"
import type { Marketplace } from "@/lib/types"
import { Search } from "lucide-react"

interface MarketplacesClientProps {
  marketplaces: Marketplace[]
}

export default function MarketplacesClient({ marketplaces }: MarketplacesClientProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return marketplaces.filter(m => {
      return (
        !search ||
        m.displayName.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [marketplaces, search])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-display-2 mb-3">Marketplaces</h1>
          <p className="text-muted-foreground">{marketplaces.length} curated plugin marketplaces</p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplaces..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            {marketplaces.length === 0
              ? "No marketplaces indexed yet. Check back soon!"
              : "No marketplaces found matching your criteria."
            }
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(marketplace => (
              <MarketplaceCard key={marketplace.namespace} marketplace={marketplace} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
