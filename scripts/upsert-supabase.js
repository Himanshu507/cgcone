'use strict'
/**
 * Phase 3A — Upsert registry.json into Supabase
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/upsert-supabase.js
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL      (in .env.local or env)
 *   SUPABASE_SERVICE_ROLE_KEY     (service role key — never commit)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const REGISTRY_PATH = path.join(__dirname, '..', 'public', 'registry.json')
const BATCH_SIZE    = 200

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
const key     = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
})

function toSnake(s) {
  return s == null ? undefined : s
}

function mapMCPServer(s) {
  return {
    slug:                s.slug,
    name:                s.name ?? s.slug,
    display_name:        s.displayName ?? s.name ?? s.slug,
    description:         s.description ?? '',
    category:            s.category ?? 'general',
    tags:                s.tags ?? [],
    server_type:         s.serverType ?? null,
    source_registry:     s.sourceRegistry ?? null,
    github_url:          s.githubUrl ?? null,
    docker_url:          s.dockerUrl ?? null,
    npm_url:             s.npmUrl ?? null,
    documentation_url:   s.documentationUrl ?? null,
    vendor:              s.vendor ?? null,
    stars:               s.stars ?? null,
    is_archived:         s.isArchived ?? false,
    last_commit:         s.lastCommit ?? null,
    verification_status: s.verificationStatus ?? null,
    install_config:      s.installConfig ?? null,
    packages:            s.packages?.length ? s.packages : null,
    env_vars:            s.envVars ?? null,
    last_indexed_at:     s.lastIndexedAt ?? null,
  }
}

function mapSkill(s) {
  return {
    slug:            s.slug,
    name:            s.name ?? s.slug,
    category:        s.category ?? 'general',
    description:     s.description ?? '',
    allowed_tools:   s.allowedTools ?? [],
    model:           s.model ?? null,
    tags:            s.tags ?? [],
    stars:           s.stars ?? null,
    github_url:      s.githubUrl ?? null,
    install_command: s.installCommand ?? null,
    source_registry: s.sourceRegistry ?? null,
    content:         s.content ?? null,
    last_indexed_at: s.lastIndexedAt ?? null,
  }
}

function mapPlugin(p) {
  const author = typeof p.author === 'string' ? p.author : p.author?.name ?? null
  return {
    slug:            p.slug,
    name:            p.name ?? p.slug,
    description:     p.description ?? '',
    version:         p.version ?? null,
    author:          author,
    author_url:      p.authorUrl ?? null,
    repository:      p.repository ?? null,
    license:         p.license ?? null,
    keywords:        p.keywords ?? [],
    category:        p.category ?? 'general',
    stars:           p.stars ?? null,
    install_command: p.installCommand ?? null,
    last_indexed_at: p.lastIndexedAt ?? null,
  }
}

async function upsertBatch(table, rows) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'slug' })
  if (error) throw new Error(`${table} upsert error: ${error.message}`)
}

async function upsertTable(table, allRows, mapFn) {
  const mapped = allRows.map(mapFn)
  const total = mapped.length
  let done = 0

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE)
    await upsertBatch(table, batch)
    done += batch.length
    process.stdout.write(`\r  ${table}: ${done}/${total}`)
  }
  console.log()
}

async function main() {
  console.log('cgcone → Supabase upsert\n')

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
  console.log(`Loaded: ${registry.mcpServers.length} MCPs, ${registry.plugins.length} plugins, ${registry.skills.length} skills`)
  console.log()

  await upsertTable('mcp_servers', registry.mcpServers, mapMCPServer)
  await upsertTable('skills',      registry.skills,     mapSkill)
  await upsertTable('plugins',     registry.plugins,    mapPlugin)

  // Update registry_meta
  const { error } = await supabase
    .from('registry_meta')
    .upsert({
      id:           1,
      generated_at: registry.generatedAt ?? new Date().toISOString(),
      mcp_count:    registry.mcpServers.length,
      skill_count:  registry.skills.length,
      plugin_count: registry.plugins.length,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'id' })

  if (error) console.error('registry_meta error:', error.message)

  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
