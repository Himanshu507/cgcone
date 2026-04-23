"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons"
import type { MCPServer } from "@/lib/types"

interface MCPInstallSectionProps {
  server: MCPServer
}

export default function MCPInstallSection({ server }: MCPInstallSectionProps) {
  const [copied, setCopied] = useState(false)
  const installCmd = `claude mcp add ${server.slug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-border bg-card">
      <h3 className="font-medium mb-2 sm:mb-3">Installation</h3>
      <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
        Run this command in your terminal to add the MCP server to Claude Code:
      </p>
      <div className="rounded-md bg-secondary border border-border p-3 sm:p-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs sm:text-sm text-foreground/90 flex-1 overflow-x-auto whitespace-nowrap pr-2">
            {installCmd}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Copy command"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
