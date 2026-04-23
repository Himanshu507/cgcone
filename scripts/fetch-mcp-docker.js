const DOCKER_API = 'https://hub.docker.com/v2/repositories/mcp'

function slugify(str) {
  return `docker-${str.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

async function fetchDockerMCPs() {
  const servers = []
  let url = `${DOCKER_API}/?page_size=100`
  try {
    while (url) {
      const res = await fetch(url)
      if (!res.ok) break
      const data = await res.json()
      servers.push(...(data.results || []))
      url = data.next
      if (url) await new Promise(r => setTimeout(r, 300))
    }
  } catch (err) {
    console.warn('Docker MCP fetch failed:', err.message)
    return []
  }
  return servers.map(repo => ({
    name: repo.name,
    displayName: repo.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    slug: slugify(repo.name),
    description: repo.description || '',
    category: 'general',
    tags: [],
    serverType: 'stdio',
    sourceRegistry: 'docker',
    dockerUrl: `https://hub.docker.com/r/mcp/${repo.name}`,
    dockerPulls: repo.pull_count || 0,
    verificationStatus: 'community',
    lastIndexedAt: new Date().toISOString(),
  }))
}

module.exports = { fetchDockerMCPs }
