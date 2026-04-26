"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GitHubLogoIcon, HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons"
import { Sun, Moon, Star } from "lucide-react"
import { useState, useEffect } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { LogoMark } from "@/components/logo-mark"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stars, setStars] = useState<number | null>(null)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetch('https://api.github.com/repos/Himanshu507/cgcone')
      .then(r => r.json())
      .then(d => { if (typeof d.stargazers_count === 'number') setStars(d.stargazers_count) })
      .catch(() => {})
  }, [])

  const navigationLinks = [
    { href: "/mcp-servers", label: "MCP Servers" },
    { href: "/plugins", label: "Plugins" },
    { href: "/subagents", label: "Subagents" },
    { href: "/skills", label: "Skills" },
    { href: "/commands", label: "Commands" },
    { href: "/hooks", label: "Hooks" },
    { href: "/marketplaces", label: "Marketplaces" },
    { href: "/contribute", label: "Contribute" },
  ]

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" aria-label="cgcone home">
                <LogoMark size={28} />
                <span className="font-mono text-base font-semibold text-foreground tracking-tight">cgcone</span>
              </Link>
              <div className="hidden lg:flex items-center gap-1">
                {navigationLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-3 py-1.5 text-sm transition-colors rounded-md",
                        isActive
                          ? "text-primary bg-primary/10 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <HamburgerMenuIcon className="h-4 w-4" />
              </Button>
              <a
                href="https://github.com/Himanshu507/cgcone"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                aria-label="Star cgcone on GitHub"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Star</span>
                {stars !== null && (
                  <span className="font-mono tabular-nums text-foreground/70">{stars.toLocaleString()}</span>
                )}
              </a>
              <a
                href="https://github.com/Himanshu507/cgcone"
                target="_blank"
                rel="noopener noreferrer"
                className="sm:hidden"
              >
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <GitHubLogoIcon className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <DialogPrimitive.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-y-0 right-0 z-50 h-full w-full max-w-xs bg-background border-l border-border duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
            )}
          >
            <DialogPrimitive.Title className="sr-only">Navigation Menu</DialogPrimitive.Title>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border p-4">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="cgcone home"
                >
                  <LogoMark size={26} />
                  <span className="font-mono text-base font-semibold tracking-tight">cgcone</span>
                </Link>
                <DialogPrimitive.Close className="rounded-sm opacity-70 hover:opacity-100">
                  <Cross2Icon className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>

              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {navigationLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md transition-colors",
                          isActive
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              </nav>

              <div className="border-t border-border p-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <><Sun className="h-4 w-4" /> Light Mode</>
                  ) : (
                    <><Moon className="h-4 w-4" /> Dark Mode</>
                  )}
                </Button>
                <a
                  href="https://github.com/Himanshu507/cgcone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <GitHubLogoIcon className="h-4 w-4" />
                    View on GitHub
                  </Button>
                </a>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
