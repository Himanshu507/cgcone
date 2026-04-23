import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: false })

function sanitize(html: string): string {
  return html
    .replace(/<(script|iframe|object|embed|form|meta|base)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|form|meta|base)[^>]*\/?>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, 'href="#"')
    .replace(/href='javascript:[^']*'/gi, "href='#'")
}

export function renderMarkdown(content: string): string {
  const html = marked.parse(content) as string
  return sanitize(html)
}
