import { fetchRegistry, searchExtensions, deriveInstallType } from '../registry.js'
import { spinner, table, info, c, badge, typeBadge } from '../ui.js'

export async function search(query, opts = {}) {
  const spin = spinner('Searching registry...').start()

  let registry
  try {
    registry = await fetchRegistry()
    spin.stop()
  } catch (err) {
    spin.fail(`Registry unavailable: ${err.message}`)
    return
  }

  let results = searchExtensions(query, registry)

  if (opts.type) {
    const typeFilter = opts.type.toLowerCase()
    results = results.filter(e => deriveInstallType(e) === typeFilter)
  }

  if (!results.length) {
    const typeNote = opts.type ? ` with type "${opts.type}"` : ''
    info(`No results for "${query}"${typeNote}. Try a broader term.`)
    return
  }

  const rows = results.slice(0, 20).map(e => {
    const itype = deriveInstallType(e)
    return [
      c.primary(e.slug ?? e.name ?? ''),
      e.displayName ?? e.name ?? '',
      (e.description ?? '').slice(0, 50) + ((e.description?.length ?? 0) > 50 ? '…' : ''),
      itype ? typeBadge(itype) : c.dim('-'),
      e.verificationStatus ? badge(e.verificationStatus) : c.dim('-'),
    ]
  })

  console.log()
  table(rows, ['Slug', 'Name', 'Description', 'Type', 'Status'])
  console.log()
  info(`${results.length} result${results.length > 1 ? 's' : ''}${results.length > 20 ? ` (showing first 20)` : ''}. Run ${c.primary('cgcone info <slug>')} for details.`)
}
