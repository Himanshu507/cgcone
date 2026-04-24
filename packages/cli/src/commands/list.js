import { getDetectedAdapters } from '../adapters/index.js'
import { section, table, info, c } from '../ui.js'

export async function list() {
  const adapters = await getDetectedAdapters()

  if (!adapters.length) {
    info('No AI CLIs detected. Run cgcone scan to diagnose.')
    return
  }

  // Collect installed per adapter
  const byAdapter = await Promise.all(
    adapters.map(async a => ({ adapter: a, slugs: await a.listInstalled() }))
  )

  const total = byAdapter.reduce((n, { slugs }) => n + slugs.length, 0)

  if (total === 0) {
    info(`No extensions installed yet. Run ${c.primary('cgcone search <query>')} to find something.`)
    return
  }

  // Build unified table: slug → which CLIs it's in
  const allSlugs = [...new Set(byAdapter.flatMap(({ slugs }) => slugs))].sort()

  const rows = allSlugs.map(slug => {
    const clis = byAdapter
      .filter(({ slugs }) => slugs.includes(slug))
      .map(({ adapter }) => adapter.name)
      .join(', ')
    return [c.primary(slug), clis]
  })

  section(`Installed extensions (${total})`)
  console.log()
  table(rows, ['Extension', 'Installed in'])
}
