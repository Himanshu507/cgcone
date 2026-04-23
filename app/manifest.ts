import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'cgcone — Universal AI CLI Extension Manager',
    short_name: 'cgcone',
    description:
      'Install MCP servers, plugins, skills, and hooks once. cgcone syncs across Claude Code, Gemini CLI, OpenAI Codex, and Copilot CLI.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    categories: ['developer tools', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
