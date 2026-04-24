import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const DIR  = join(homedir(), '.cgcone')
const FILE = join(DIR, 'installed.json')

async function read() {
  try {
    const raw = await readFile(FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function write(data) {
  await mkdir(DIR, { recursive: true })
  await writeFile(FILE, JSON.stringify(data, null, 2), 'utf8')
}

export async function markInstalled(cliName, slug, meta = {}) {
  const store = await read()
  if (!store[cliName]) store[cliName] = {}
  store[cliName][slug] = { ...meta, installedAt: new Date().toISOString() }
  await write(store)
}

export async function markUninstalled(cliName, slug) {
  const store = await read()
  if (store[cliName]) {
    delete store[cliName][slug]
    if (!Object.keys(store[cliName]).length) delete store[cliName]
  }
  await write(store)
}

export async function getInstalled(cliName) {
  const store = await read()
  return store[cliName] ?? {}
}

export async function getAllInstalled() {
  return read()
}
