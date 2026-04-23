import type { Metadata } from "next"
import { Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "CGCone - Claude Code Marketplace",
  description: "The marketplace for Claude Code. Browse MCP servers, plugins, subagents, skills, commands, and hooks to enhance your AI development workflow.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <Navigation />
          <div className="h-16" />
          {children}
          <footer className="border-t border-border/40 mt-24">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>
                  Built with <a href="https://claude.ai" className="hover:text-foreground transition-colors">Claude Code</a>
                </p>
                <div className="flex items-center gap-6">
                  <a
                    href="https://github.com/Himanshu507/cgcone/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    MIT License
                  </a>
                  <a
                    href="https://github.com/Himanshu507/cgcone"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
