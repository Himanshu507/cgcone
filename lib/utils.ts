import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
  return num.toString()
}

/**
 * Extracts a URL string from registry fields that may be a plain string,
 * an object like { url: "..." }, or null/undefined/{}.
 * Returns undefined when no valid URL is found.
 */
export function resolveUrl(val: unknown): string | undefined {
  if (!val) return undefined
  if (typeof val === 'string') return val || undefined
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    const url = obj.url ?? obj.href ?? obj.link ?? obj.repository ?? obj.source_url
    if (typeof url === 'string' && url) return url
  }
  return undefined
}
