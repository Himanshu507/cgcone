import { getHooks } from "@/lib/registry"
import HooksClient from "./hooks-client"

export const metadata = {
  title: "Hooks - CGCone",
  description: "Browse automation hooks for Claude Code.",
}

export default function HooksPage() {
  const hooks = getHooks()
  return <HooksClient hooks={hooks} />
}
