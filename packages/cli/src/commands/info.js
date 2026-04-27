import { fetchRegistry, findExtension, extensionType, getInstallConfig } from '../registry.js'
import { spinner, error, info, section, c, badge } from '../ui.js'

export async function showInfo(name) {
  const spin = spinner(`Looking up ${c.primary(name)}...`).start()

  let registry
  try {
    registry = await fetchRegistry()
  } catch (err) {
    spin.fail(`Registry unavailable: ${err.message}`)
    return
  }

  const entry = findExtension(name, registry)
  if (!entry) {
    spin.fail(`"${name}" not found in registry`)
    info(`Try ${c.bold('cgcone search ' + name)}`)
    return
  }

  spin.stop()

  const type    = extensionType(entry, registry)
  const config  = getInstallConfig(entry)

  section(entry.displayName ?? entry.name ?? entry.slug)
  console.log()

  const fields = [
    ['Slug',     c.primary(entry.slug ?? entry.name)],
    ['Type',     type],
    ['Category', entry.category ?? c.dim('-')],
    ['Author',   entry.author ?? entry.vendor ?? c.dim('-')],
    ['Version',  entry.version ? `v${entry.version}` : c.dim('-')],
    ['Status',   entry.verificationStatus ? badge(entry.verificationStatus) : c.dim('-')],
    ['Stars',    entry.stars != null ? `⭐ ${entry.stars.toLocaleString()}` : c.dim('-')],
    ['License',  entry.license ?? c.dim('-')],
  ]

  fields.forEach(([label, value]) => {
    console.log(`  ${c.dim(label.padEnd(12))}  ${value}`)
  })

  if (entry.description) {
    console.log()
    console.log(`  ${entry.description}`)
  }

  if (entry.githubUrl) {
    console.log()
    console.log(`  ${c.dim('Repository')}  ${entry.githubUrl}`)
  }

  if (config) {
    console.log()
    console.log(`  ${c.dim('Install')}      ${c.bold('cgcone install ' + (entry.slug ?? entry.name))}`)
    if (config.uncertain) {
      console.log(`  ${c.dim('Note')}         Install command inferred - verify with repository`)
    }
  } else {
    console.log()
    console.log(`  ${c.dim('Note')}  No automatic install available. See ${entry.githubUrl ?? 'repository'} for manual setup.`)
  }

  if (entry.tags?.length) {
    console.log()
    console.log(`  ${c.dim('Tags')}         ${entry.tags.join(', ')}`)
  }

  console.log()
}
