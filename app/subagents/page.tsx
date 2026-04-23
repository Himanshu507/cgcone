import { getSubagents } from "@/lib/registry"
import SubagentsClient from "./subagents-client"

export const metadata = {
  title: "Subagents - CGCone",
  description: "Browse curated subagents for Claude Code.",
}

export default function SubagentsPage() {
  const subagents = getSubagents()
  return <SubagentsClient subagents={subagents} />
}
