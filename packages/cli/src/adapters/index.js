import { ClaudeCodeAdapter } from './claude-code.js'
import { GeminiCLIAdapter }  from './gemini-cli.js'
import { CodexCLIAdapter }   from './codex-cli.js'

export const ALL_ADAPTERS = [
  new ClaudeCodeAdapter(),
  new GeminiCLIAdapter(),
  new CodexCLIAdapter(),
]

export async function getDetectedAdapters() {
  const results = await Promise.all(
    ALL_ADAPTERS.map(async a => ({ adapter: a, detected: await a.detect() }))
  )
  return results.filter(r => r.detected).map(r => r.adapter)
}

export { ClaudeCodeAdapter, GeminiCLIAdapter, CodexCLIAdapter }
