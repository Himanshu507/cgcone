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

// OSC 8 terminal hyperlink — wraps text so it opens url on click.
// Falls back silently on terminals that don't support it (plain text renders fine).
export function link(text, url) {
  if (!url) return text
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`
}

// Strip ANSI + OSC 8 escape codes to get visible character count for column sizing.
const ANSI_RE = /\x1b\[[0-9;]*m|\x1b]8;;[^\x1b]*\x1b\\|\x1b]8;;\x1b\\/g
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

export function badge(status, url) {
  let b
  switch (status) {
    case 'verified':     b = chalk.bgGreen.black(' VERIFIED ');     break
    case 'community':    b = chalk.bgBlue.white(' COMMUNITY ');     break
    case 'experimental': b = chalk.bgYellow.black(' EXPERIMENTAL '); break
    default:             b = chalk.bgGray.white(` ${status?.toUpperCase() ?? 'UNKNOWN'} `)
  }
  return url ? link(b, url) : b
}

export function typeBadge(type) {
  switch (type) {
    case 'npm':    return chalk.hex('#cb3837').bold('npm')
    case 'uvx':    return chalk.hex('#2196f3').bold('uvx')
    case 'docker': return chalk.hex('#2496ed').bold('docker')
    case 'remote': return chalk.hex('#9c27b0').bold('remote')
    case 'skill':  return chalk.hex('#4caf50').bold('skill')
    case 'plugin': return chalk.hex('#ff9800').bold('plugin')
    default:       return chalk.dim(type ?? '?')
  }
}
