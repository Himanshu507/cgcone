const README_MAX_CHARS = 12000

export async function fetchGitHubReadme(
  githubUrl: string
): Promise<{ content: string; truncated: boolean } | null> {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/?#\s]+)/)
  if (!match) return null

  const [, owner, repo] = match
  const token = process.env.GITHUB_TOKEN

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: 'application/vnd.github.raw+json',
          'User-Agent': 'cgcone-registry/1.0',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: 86400 }, // cache 24h
      }
    )

    if (!res.ok) return null

    const text = await res.text()
    const truncated = text.length > README_MAX_CHARS
    return {
      content: truncated ? text.slice(0, README_MAX_CHARS) : text,
      truncated,
    }
  } catch {
    return null
  }
}
