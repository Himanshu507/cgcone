const { searchCode, batchFetchStars, sleep } = require('./lib/github')

const MIN_STARS = 5

/**
 * Parse YAML frontmatter from SKILL.md content.
 * Handles: string values, quoted strings, booleans, numbers, inline arrays.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null

  const raw  = match[1]
  const data = {}

  for (const line of raw.split('\n')) {
    const kv = line.match(/^([a-zA-Z_-]+)\s*:\s*(.*)$/)
    if (!kv) continue

    const key = kv[1].trim()
    let val   = kv[2].trim()

    // Strip surrounding quotes
    if (/^["'].*["']$/.test(val)) val = val.slice(1, -1)
    else if (val === 'true')  val = true
    else if (val === 'false') val = false
    else if (!isNaN(val) && val !== '') val = Number(val)
    // Inline array: [a, b, c]
    else if (/^\[.*\]$/.test(val)) {
      val = val.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    }

    data[key] = val
  }

  return data
}

/**
 * Fetch all skills from GitHub via Code Search for SKILL.md files.
 */
async function fetchGitHubSkills() {
  console.log('  Searching GitHub for SKILL.md files...')

  const codeResults = await searchCode('filename:SKILL.md path:.claude/skills', { maxPages: 10 })
  console.log(`  Found ${codeResults.length} SKILL.md files`)

  // Group by repo and fetch star counts
  const repoNames = [...new Set(codeResults.map(r => r.repo))]
  const starMap   = await batchFetchStars(repoNames)

  const skills     = []
  let done = 0

  for (const result of codeResults) {
    done++
    process.stdout.write(`\r  Processing skills: ${done}/${codeResults.length}`)

    const stars = starMap.get(result.repo) ?? 0
    if (stars < MIN_STARS) continue

    // Extract skill name from path: .claude/skills/SKILL.md or .claude/skills/name/SKILL.md
    const pathParts = result.path.split('/')
    const skillDir  = pathParts.length > 3 ? pathParts[pathParts.length - 2] : null

    // Fetch SKILL.md content
    const [owner, repo] = result.repo.split('/')
    let frontmatter = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${result.repo}/${result.repoObj.default_branch ?? 'main'}/${result.path}`)
        if (rawRes.ok) {
          const text = await rawRes.text()
          frontmatter = parseFrontmatter(text)
        }
        break
      } catch {
        if (attempt < 2) await sleep(1500)
      }
    }

    if (!frontmatter?.name && !skillDir) continue

    const skillName = frontmatter?.name ?? skillDir
    const skillId   = `${owner}-${repo}/${skillName}`.toLowerCase().replace(/[^a-z0-9/]+/g, '-')

    const slug = skillId.replace('/', '--')

    skills.push({
      id:             skillId,
      slug,
      name:           skillName,
      displayName:    skillName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description:    frontmatter?.description ?? `${skillName} skill for Claude Code`,
      license:        frontmatter?.license ?? null,
      tags:           Array.isArray(frontmatter?.tags) ? frontmatter.tags : [],
      repo:           result.repo,
      repoSlug:       result.repo.replace('/', '-').toLowerCase(),
      path:           result.path,
      stars,
      githubUrl:      `https://github.com/${result.repo}`,
      installCommand: `claude skill add ${result.repo}:${skillName}`,
      sourceRegistry: 'github',
      verificationStatus: 'community',
      lastIndexedAt:  new Date().toISOString(),
    })

    await sleep(100)
  }

  console.log(`\n  Skills: ${skills.length} entries (from ${MIN_STARS}+ star repos)`)
  return skills
}

module.exports = { fetchGitHubSkills }
