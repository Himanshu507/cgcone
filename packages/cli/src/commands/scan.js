import { ALL_ADAPTERS } from '../adapters/index.js'
import { section, table, c } from '../ui.js'

export async function scan() {
  section('Scanning for AI CLIs...')

  const results = await Promise.all(
    ALL_ADAPTERS.map(async a => {
      const detected = await a.detect()
      return [
        a.name,
        detected ? c.green('✓ detected') : c.dim('✗ not found'),
        detected ? c.dim(a.id) : c.dim('—'),
      ]
    })
  )

  console.log()
  table(results, ['CLI', 'Status', 'ID'])

  const found = results.filter(r => r[1].includes('detected')).length
  console.log()
  if (found === 0) {
    console.log(c.yellow(`No AI CLIs detected. Install Claude Code, Gemini CLI, or Codex CLI first.`))
  } else {
    console.log(c.dim(`${found} CLI${found > 1 ? 's' : ''} found. Run ${c.primary('cgcone install <name>')} to get started.`))
  }
}
