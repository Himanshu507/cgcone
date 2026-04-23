import { getCommands } from "@/lib/registry"
import CommandsClient from "./commands-client"

export const metadata = {
  title: "Commands - CGCone",
  description: "Browse slash commands for Claude Code.",
}

export default function CommandsPage() {
  const commands = getCommands()
  return <CommandsClient commands={commands} />
}
