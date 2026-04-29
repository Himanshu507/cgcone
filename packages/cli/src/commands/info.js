import { fetchRegistry, findExtension, extensionType, getInstallConfig, deriveInstallType } from '../registry.js'
import { spinner, error, info, section, c, typeBadge, link } from '../ui.js'

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

  const type        = extensionType(entry, registry)
  const installType = deriveInstallType(entry)
  const config      = getInstallConfig(entry)

  section(entry.displayName ?? entry.name ?? entry.slug)
  console.log()

  const typeDisplay = (installType && installType !== type)
    ? `${type}  ${typeBadge(installType)}`
    : (installType ? typeBadge(installType) : type)

  const lastCommitDisplay = (() => {
    if (!entry.lastCommit) return null
    const d = new Date(entry.lastCommit)
    const now = new Date()
    const monthsAgo = (now - d) / (1000 * 60 * 60 * 24 * 30)
    const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    return monthsAgo > 12 ? c.yellow(label + ' ⚠') : label
  })()

  const authorDisplay = entry.author ?? entry.vendor
    ?? (entry.githubUrl ? entry.githubUrl.replace('https://github.com/', '').split('/')[0] : null)
    ?? c.dim('-')

  const fields = [
    ['Slug',        c.primary(entry.slug ?? entry.name)],
    ['Type',        typeDisplay],
    ['Category',    entry.category ?? c.dim('-')],
    ['Author',      authorDisplay],
    ['Version',     entry.version ? `v${entry.version}` : c.dim('-')],
    ['Status',      entry.verificationStatus ?? c.dim('-')],
    ['Stars',       entry.stars != null ? `⭐ ${entry.stars.toLocaleString()}` : c.dim('-')],
    lastCommitDisplay ? ['Last commit', lastCommitDisplay]                          : null,
    entry.license   ? ['License',     entry.license]                                : null,
  ].filter(Boolean)

  fields.forEach(([label, value]) => {
    console.log(`  ${c.dim(label.padEnd(12))}  ${value}`)
  })

  if (entry.isArchived) {
    console.log()
    console.log(`  ${c.yellow('⚠  This repository is archived and no longer actively maintained.')}`)
  }

  if (entry.description) {
    console.log()
    console.log(`  ${entry.description}`)
  }

  if (entry.githubUrl) {
    console.log()
    console.log(`  ${c.dim('Repository')}  ${link(entry.githubUrl, entry.githubUrl)}`)
  }

  if (entry.installCommand?.startsWith('claude skill') || entry.installCommand?.startsWith('/plugin install')) {
    console.log()
    console.log(`  ${c.dim('Install')}      ${c.bold('cgcone install ' + (entry.slug ?? entry.name))}`)
    console.log(`  ${c.dim('Command')}      ${c.dim(entry.installCommand)}`)
  } else if (config) {
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
