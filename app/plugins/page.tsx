import { getPlugins } from "@/lib/registry"
import PluginsClient from "./plugins-client"

export const metadata = {
  title: "Plugins - CGCone",
  description: "Browse Claude Code plugins from the community.",
}

export default function PluginsPage() {
  const plugins = getPlugins()
  return <PluginsClient plugins={plugins} />
}
