import Link from "next/link"
import { LogoMark } from "@/components/logo-mark"

const EXPLORE_LINKS = [
  { href: "/mcp-servers",  label: "MCP Servers" },
  { href: "/plugins",      label: "Plugins" },
  { href: "/skills",       label: "Skills" },
  { href: "/subagents",    label: "Subagents" },
  { href: "/commands",     label: "Commands" },
  { href: "/hooks",        label: "Hooks" },
  { href: "/marketplaces", label: "Marketplaces" },
]

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms of Service" },
]

const RESOURCE_LINKS = [
  { href: "https://github.com/Himanshu507/cgcone", label: "GitHub", external: true },
  { href: "/contribute", label: "Contribute" },
  { href: "https://github.com/Himanshu507/cgcone/blob/main/LICENSE", label: "MIT License", external: true },
]

export function Footer() {
  return (
    <footer className="border-t border-border/40 mt-24" aria-label="Site footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit hover:opacity-80 transition-opacity">
              <LogoMark size={26} />
              <span className="font-mono text-base font-semibold tracking-tight text-foreground">cgcone</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Universal AI CLI extension manager. Install once, sync across every AI CLI on your machine.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">Explore</h3>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {RESOURCE_LINKS.map(link => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-xs text-muted-foreground">

          {/* Creator credit */}
          <p>
            Created by{" "}
            <a
              href="https://himanshudev.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground font-medium hover:text-primary transition-colors"
            >
              Himanshu
            </a>
          </p>

          {/* Copyright */}
          <p className="order-last sm:order-none text-center">
            © {new Date().getFullYear()} cgcone. All rights reserved.
            <span className="block sm:inline sm:ml-1 text-muted-foreground/60">Extensions are property of their respective owners.</span>
          </p>

          {/* Status + version */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
              All systems operational
            </span>
            <span className="text-border">·</span>
            <span className="font-mono">v0.1.0</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
