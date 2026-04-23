"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons"

interface InstallationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverName: string
  serverSlug: string
  githubUrl?: string
  dockerUrl?: string
}

export function InstallationModal({
  open,
  onOpenChange,
  serverName,
  serverSlug,
  githubUrl,
  dockerUrl,
}: InstallationModalProps) {
  const [copied, setCopied] = useState(false)

  const installCommand = `claude mcp add ${serverSlug}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install {serverName}</DialogTitle>
          <DialogDescription>
            Run the following command in your terminal to add this MCP server to Claude Code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-secondary border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-sm text-foreground/90 flex-1 overflow-x-auto">
                {installCommand}
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

          {(githubUrl || dockerUrl) && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Resources</p>
              <div className="flex gap-2 flex-wrap">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      View on GitHub
                    </Button>
                  </a>
                )}
                {dockerUrl && (
                  <a
                    href={dockerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      Docker Hub
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
