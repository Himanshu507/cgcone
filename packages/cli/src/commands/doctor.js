import { ALL_ADAPTERS } from '../adapters/index.js'
import { section, c } from '../ui.js'

export async function doctor() {
  section('Running diagnostics...')
  console.log()

  let totalErrors = 0
  let totalWarns  = 0

  for (const adapter of ALL_ADAPTERS) {
    const detected = await adapter.detect()
    const prefix   = detected ? c.green('●') : c.dim('○')
    console.log(`${prefix}  ${c.bold(adapter.name)} ${detected ? '' : c.dim('(not detected)')}`)

    if (!detected) {
      console.log()
      continue
    }

    const issues = await adapter.doctor()
    for (const issue of issues) {
      if (issue.level === 'ok') {
        console.log(`   ${c.green('✓')} ${c.dim(issue.message)}`)
      } else if (issue.level === 'warn') {
        console.log(`   ${c.yellow('⚠')} ${issue.message}`)
        totalWarns++
      } else if (issue.level === 'error') {
        console.log(`   ${c.red('✗')} ${issue.message}`)
        totalErrors++
      }
    }
    console.log()
  }

  if (totalErrors === 0 && totalWarns === 0) {
    console.log(c.green('✓ All checks passed'))
  } else {
    if (totalErrors) console.log(c.red(`✗ ${totalErrors} error${totalErrors > 1 ? 's' : ''} found`))
    if (totalWarns)  console.log(c.yellow(`⚠ ${totalWarns} warning${totalWarns > 1 ? 's' : ''} found`))
  }
}
