import chalk from 'chalk'
import ora from 'ora'

export const c = {
  primary: chalk.hex('#c96a50'),
  dim:     chalk.dim,
  bold:    chalk.bold,
  green:   chalk.green,
  red:     chalk.red,
  yellow:  chalk.yellow,
  blue:    chalk.blue,
  cyan:    chalk.cyan,
  gray:    chalk.gray,
}

export function log(...args)     { console.log(...args) }
export function success(msg)     { console.log(c.green('✓'), msg) }
export function error(msg)       { console.error(c.red('✗'), msg) }
export function warn(msg)        { console.warn(c.yellow('⚠'), msg) }
export function info(msg)        { console.log(c.blue('ℹ'), msg) }
export function section(title)   { console.log('\n' + c.bold(title)) }

export function spinner(text) {
  return ora({ text, color: 'yellow' })
}

// Strip ANSI escape codes to get the visible character count for column sizing.
const ANSI_RE = /\x1b\[[0-9;]*m/g
function visibleLen(str) { return String(str).replace(ANSI_RE, '').length }
function padVisible(str, width) {
  return String(str) + ' '.repeat(Math.max(0, width - visibleLen(str)))
}

export function table(rows, cols) {
  if (!rows.length) return

  const widths = cols.map((col, i) =>
    Math.max(col.length, ...rows.map(r => visibleLen(r[i] ?? '')))
  )

  const header = cols.map((col, i) => c.bold(col.padEnd(widths[i]))).join('  ')
  const divider = widths.map(w => '─'.repeat(w)).join('  ')

  console.log(header)
  console.log(c.dim(divider))
  rows.forEach(row => {
    console.log(row.map((cell, i) => padVisible(cell ?? '', widths[i])).join('  '))
  })
}

export function badge(status) {
  switch (status) {
    case 'verified':    return chalk.bgGreen.black(' VERIFIED ')
    case 'community':   return chalk.bgBlue.white(' COMMUNITY ')
    case 'experimental': return chalk.bgYellow.black(' EXPERIMENTAL ')
    default:            return chalk.bgGray.white(` ${status?.toUpperCase() ?? 'UNKNOWN'} `)
  }
}
