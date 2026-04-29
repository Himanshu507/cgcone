import { fetchRegistry, searchExtensions, deriveInstallType } from '../registry.js'
import { spinner, table, info, c, badge, typeBadge } from '../ui.js'

function fmtStars(n) {
  if (n == null) return c.dim('-')
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

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
    results = results.filter(e => deriveInstallType(e) === opts.type.toLowerCase())
  }

  if (opts.installable) {
    results = results.filter(e => deriveInstallType(e) !== null)
  }

  const sortBy = opts.sort?.toLowerCase()
  if (sortBy === 'stars') {
    results = [...results].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
  }

  if (!results.length) {
    const notes = [
      opts.type        && `type "${opts.type}"`,
      opts.installable && 'installable only',
    ].filter(Boolean).join(', ')
    info(`No results for "${query}"${notes ? ` (${notes})` : ''}. Try a broader term.`)
    return
  }

  const showStars = sortBy === 'stars'

  const rows = results.slice(0, 20).map(e => {
    const itype = deriveInstallType(e)
    const repoShort = e.githubUrl
      ? e.githubUrl.replace('https://github.com/', '')
      : c.dim('-')
    const row = [
      c.primary(e.slug ?? e.name ?? ''),
      e.displayName ?? e.name ?? '',
      (e.description ?? '').slice(0, 46) + ((e.description?.length ?? 0) > 46 ? '…' : ''),
      itype ? typeBadge(itype) : c.dim('-'),
      e.verificationStatus ? badge(e.verificationStatus) : c.dim('-'),
      repoShort,
    ]
    if (showStars) row.push(fmtStars(e.stars))
    return row
  })

  const cols = ['Slug', 'Name', 'Description', 'Type', 'Status', 'Repo']
  if (showStars) cols.push('Stars')

  console.log()
  table(rows, cols)
  console.log()

  const filterNotes = [
    opts.type        && `type: ${opts.type}`,
    opts.installable && 'installable only',
    sortBy === 'stars' && 'sorted by stars',
  ].filter(Boolean)

  const suffix = filterNotes.length ? c.dim(` [${filterNotes.join(', ')}]`) : ''
  info(`${results.length} result${results.length > 1 ? 's' : ''}${results.length > 20 ? ` (showing first 20)` : ''}${suffix}. Run ${c.primary('cgcone info <slug>')} for details.`)
}
