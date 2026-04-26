import type { Metadata } from "next"
import { Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
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
  metadataBase: new URL('https://cgcone.com'),
  title: {
    default: 'cgcone — Universal AI CLI Extension Manager',
    template: '%s | cgcone',
  },
  description:
    'Install MCP servers, plugins, skills, and hooks once. cgcone syncs across Claude Code, Gemini CLI, OpenAI Codex, and Copilot CLI in one command.',
  keywords: [
    'MCP server', 'Claude Code', 'Gemini CLI', 'OpenAI Codex', 'Copilot CLI',
    'AI CLI manager', 'plugins', 'skills', 'hooks', 'subagents', 'cgcone',
    'AI extensions marketplace', 'MCP marketplace',
  ],
  authors: [{ name: 'cgcone', url: 'https://cgcone.com' }],
  creator: 'cgcone',
  publisher: 'cgcone',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cgcone.com',
    siteName: 'cgcone',
    title: 'cgcone — Universal AI CLI Extension Manager',
    description:
      'Install MCP servers, plugins, and skills to every AI CLI — Claude Code, Gemini CLI, Codex — in one command.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cgcone',
    title: 'cgcone — Universal AI CLI Extension Manager',
    description:
      'Install MCP servers, plugins, and skills to every AI CLI — Claude Code, Gemini CLI, Codex — in one command.',
  },
  other: {
    'theme-color': '#0a0a0a',
    'color-scheme': 'dark light',
    'msapplication-TileColor': '#0a0a0a',
  },
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
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
