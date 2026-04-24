"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons"
import type { MCPServer } from "@/lib/types"

interface MCPInstallSectionProps {
  server: MCPServer
}

export default function MCPInstallSection({ server }: MCPInstallSectionProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const cgconeCmd = `cgcone install ${server.slug}`
  const claudeCmd = `claude mcp add ${server.slug}`

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-border bg-card space-y-4">
      <div>
        <h3 className="font-medium mb-1">Install with cgcone</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Installs to all AI CLIs on your machine simultaneously.{' '}
          <Link href="/#getstarted-heading" className="text-primary hover:underline">
            Get cgcone →
          </Link>
        </p>
        <div className="rounded-md bg-secondary border border-border p-3 sm:p-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <code className="font-mono text-xs sm:text-sm text-foreground/90 flex-1 overflow-x-auto whitespace-nowrap pr-2">
              {cgconeCmd}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(cgconeCmd)}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Copy cgcone install command"
            >
              {copied === cgconeCmd ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2">Claude Code only:</p>
        <div className="rounded-md bg-secondary/50 border border-border/60 p-3 overflow-hidden">
          <div className="flex items-center gap-2">
            <code className="font-mono text-xs text-foreground/60 flex-1 overflow-x-auto whitespace-nowrap pr-2">
              {claudeCmd}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(claudeCmd)}
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Copy claude mcp add command"
            >
              {copied === claudeCmd ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
