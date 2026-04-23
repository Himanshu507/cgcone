const GITHUB_API = 'https://api.github.com'

function githubHeaders() {
  const h = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'cgcone-sync',
  }
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

async function fetchGitHubPlugins() {
  const plugins = []
  try {
    const res = await fetch(
      `${GITHUB_API}/search/repositories?q=topic:claude-code-plugin&per_page=100&sort=stars`,
      { headers: githubHeaders() }
    )
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const data = await res.json()
    for (const repo of data.items || []) {
      plugins.push({
        name: repo.name,
        slug: repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: repo.description || '',
        version: '1.0.0',
        author: repo.owner.login,
        authorUrl: repo.owner.html_url,
        repository: repo.html_url,
        keywords: repo.topics || [],
        category: 'community',
        stars: repo.stargazers_count,
        lastIndexedAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.warn('GitHub plugin fetch failed:', err.message)
  }
  return plugins
}

module.exports = { fetchGitHubPlugins }
