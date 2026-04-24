import { fetchRegistry, searchExtensions } from '../registry.js'
import { spinner, table, info, c, badge } from '../ui.js'

export async function search(query) {
  const spin = spinner('Searching registry...').start()

  let registry
  try {
    registry = await fetchRegistry()
    spin.stop()
  } catch (err) {
    spin.fail(`Registry unavailable: ${err.message}`)
    return
  }

  const results = searchExtensions(query, registry)

  if (!results.length) {
    info(`No results for "${query}". Try a broader term.`)
    return
  }

  const rows = results.slice(0, 20).map(e => [
    c.primary(e.slug ?? e.name ?? ''),
    e.displayName ?? e.name ?? '',
    (e.description ?? '').slice(0, 60) + ((e.description?.length ?? 0) > 60 ? '…' : ''),
    e.verificationStatus ? badge(e.verificationStatus) : c.dim('—'),
  ])

  console.log()
  table(rows, ['Slug', 'Name', 'Description', 'Status'])
  console.log()
  info(`${results.length} result${results.length > 1 ? 's' : ''}${results.length > 20 ? ` (showing first 20)` : ''}. Run ${c.primary('cgcone info <slug>')} for details.`)
}
