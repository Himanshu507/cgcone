import 'server-only'
import { marked } from 'marked'

export interface TocItem {
  level: 2 | 3
  text: string
  id: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

function headingId(text: string): string {
  return stripHtml(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '')
}

function resolveHref(href: string, owner: string, repo: string, isImage = false): string {
  if (
    !href ||
    href.startsWith('http') ||
    href.startsWith('//') ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('data:')
  ) {
    return href
  }
  const path = href.startsWith('./') ? href.slice(2) : href.startsWith('/') ? href.slice(1) : href
  if (isImage || /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|avif)(\?.*)?$/i.test(path)) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`
  }
  return `https://github.com/${owner}/${repo}/blob/HEAD/${path}`
}

export function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const items: TocItem[] = []
  let match
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3
    const rawText = match[2].replace(/[*_`[\]()]/g, '').trim()
    items.push({ level, text: rawText, id: headingId(rawText) })
  }
  return items
}

export function renderMarkdown(content: string, repoUrl?: string): string {
  let owner = ''
  let repo = ''
  if (repoUrl) {
    const m = repoUrl.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
    if (m) {
      owner = m[1]
      repo = m[2].replace(/\.git$/, '')
    }
  }

  const renderer = new marked.Renderer()

  renderer.heading = function (text: string, level: number) {
    const id = headingId(text)
    return `<h${level} id="${id}">${text}</h${level}>\n`
  }

  renderer.link = function (href: string | null, title: string | null, text: string) {
    if (!href) return text
    const resolved = owner && repo ? resolveHref(href, owner, repo) : href
    const isExternal = resolved.startsWith('http') || resolved.startsWith('//')
    return `<a href="${resolved}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}${title ? ` title="${title}"` : ''}>${text}</a>`
  }

  renderer.image = function (href: string | null, title: string | null, text: string) {
    if (!href) return ''
    const src = owner && repo ? resolveHref(href, owner, repo, true) : href
    return `<img src="${src}" alt="${text}"${title ? ` title="${title}"` : ''} loading="lazy" />\n`
  }

  const html = marked.parse(content, { renderer, gfm: true, breaks: false }) as string
  return sanitize(html)
}

function sanitize(html: string): string {
  return html
    .replace(/<(script|iframe|object|embed|form|meta|base)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|form|meta|base)[^>]*\/?>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .replace(/href='javascript:[^']*'/gi, "href='#'")
}
