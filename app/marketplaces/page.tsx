import { getMarketplaces } from "@/lib/registry"
import MarketplacesClient from "./marketplaces-client"

export const metadata = {
  title: "Marketplaces - CGCone",
  description: "Browse Claude Code plugin marketplaces.",
}

export default function MarketplacesPage() {
  const marketplaces = getMarketplaces()
  return <MarketplacesClient marketplaces={marketplaces} />
}
