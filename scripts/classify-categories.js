'use strict'
/**
 * Phase 4C — Category Classification
 *
 * Scores each MCP entry against keyword arrays and assigns the best-fit category.
 * Only re-classifies entries currently sitting in "general".
 * Entries already in a specific category are left untouched.
 *
 * Usage:
 *   node scripts/classify-categories.js           # live run
 *   DRY_RUN=1 node scripts/classify-categories.js # preview only
 */

const fs   = require('fs')
const path = require('path')

const REGISTRY_PATH = path.join(__dirname, '..', 'public', 'registry.json')
const DRY_RUN       = process.env.DRY_RUN === '1'

// ── Category definitions ───────────────────────────────────────────────────────
// Each category has a list of keyword signals.
// Keywords are matched (case-insensitive) against: slug, name, description, tags

const CATEGORIES = {
  'developer-tools': [
    'ide', 'vscode', 'cursor', 'neovim', 'vim', 'jetbrains', 'intellij',
    'debug', 'debugger', 'linter', 'lint', 'formatter', 'format',
    'test', 'testing', 'unit test', 'pytest', 'jest', 'vitest',
    'ci', 'cd', 'pipeline', 'build', 'compile', 'compiler',
    'git', 'github', 'gitlab', 'bitbucket', 'version control',
    'code review', 'pull request', 'diff', 'patch',
    'terminal', 'shell', 'bash', 'zsh', 'cli tool',
    'package manager', 'dependency', 'npm', 'pip', 'cargo', 'gradle',
    'sdk', 'code generation', 'scaffolding', 'boilerplate',
    'refactor', 'static analysis', 'coverage', 'profiler',
    'reverse engineering', 'ida pro', 'ghidra', 'disassembler',
    'xcode', 'android studio', 'webpack', 'vite', 'esbuild',
    'monorepo', 'workspace', 'nx', 'turborepo',
  ],
  'database': [
    'database', 'sql', 'mysql', 'postgres', 'postgresql', 'sqlite',
    'mongodb', 'redis', 'cassandra', 'dynamodb', 'firestore',
    'supabase', 'planetscale', 'cockroach', 'snowflake', 'bigquery',
    'elasticsearch', 'opensearch', 'vector database', 'pinecone', 'weaviate',
    'qdrant', 'chroma', 'milvus', 'pgvector',
    'orm', 'prisma', 'drizzle', 'sequelize', 'typeorm',
    'query', 'schema', 'migration', 'table', 'collection',
    'nosql', 'graph database', 'neo4j', 'arangodb',
    'data warehouse', 'olap', 'oltp',
  ],
  'web-search': [
    'search', 'web search', 'google search', 'bing', 'brave search',
    'scrape', 'scraping', 'crawler', 'crawl', 'spider',
    'web content', 'html parse', 'xpath', 'css selector',
    'serp', 'seo', 'sitemap', 'url', 'web page',
    'fetch url', 'http client', 'requests', 'playwright fetch',
    'news', 'news aggregator', 'rss', 'feed',
    'perplexity', 'tavily', 'exa', 'serper',
  ],
  'ai-agents': [
    'agent', 'agents', 'agentic', 'multi-agent', 'autonomous',
    'orchestration', 'orchestrator', 'workflow automation',
    'langgraph', 'langchain', 'autogen', 'crewai', 'swarm',
    'mcp client', 'mcp server framework', 'agent framework',
    'reasoning', 'planning', 'task decomposition',
    'rag', 'retrieval augmented', 'vector search', 'embedding',
    'llm', 'language model', 'openai', 'anthropic', 'gemini', 'mistral',
    'prompt', 'chain of thought', 'tool calling', 'function calling',
    'n8n', 'trigger.dev', 'activepieces', 'make.com', 'zapier',
  ],
  'file-system': [
    'file', 'files', 'file system', 'filesystem', 'directory', 'folder',
    'storage', 'upload', 'download', 'blob', 's3', 'object storage',
    'pdf', 'document', 'docx', 'xlsx', 'csv', 'json file', 'xml',
    'markdown', 'text file', 'read file', 'write file',
    'dropbox', 'google drive', 'onedrive', 'box',
    'archive', 'zip', 'tar', 'compress',
    'local file', 'disk', 'path',
  ],
  'cloud-infrastructure': [
    'aws', 'amazon web services', 'ec2', 'lambda', 'ecs', 'eks', 's3',
    'gcp', 'google cloud', 'gke', 'cloud run', 'firebase',
    'azure', 'microsoft azure', 'aks',
    'kubernetes', 'k8s', 'helm', 'terraform', 'ansible', 'pulumi',
    'docker', 'container', 'pod', 'deployment', 'devops',
    'cloudflare', 'vercel', 'netlify', 'heroku', 'railway',
    'infrastructure', 'iaas', 'paas', 'serverless',
    'cdn', 'load balancer', 'vpc', 'subnet', 'dns',
    'monitoring', 'observability', 'grafana', 'prometheus', 'datadog',
    'logs', 'logging', 'sentry', 'alerting',
  ],
  'browser-automation': [
    'browser', 'playwright', 'puppeteer', 'selenium', 'cypress',
    'headless', 'chromium', 'firefox', 'webkit',
    'web automation', 'click', 'form fill', 'screenshot',
    'e2e', 'end-to-end', 'ui test', 'visual testing',
    'browser extension', 'chrome extension',
  ],
  'api-integration': [
    'api', 'rest api', 'graphql api', 'webhook', 'oauth',
    'stripe', 'twilio', 'sendgrid', 'mailchimp', 'hubspot',
    'salesforce', 'zendesk', 'freshdesk', 'intercom',
    'jira', 'linear', 'asana', 'notion', 'airtable', 'trello',
    'shopify', 'woocommerce', 'paypal', 'square',
    'integration', 'connector', 'adapter', 'bridge', 'proxy',
    'openapi', 'swagger', 'postman', 'api gateway',
    'third-party', 'saas', 'platform api',
  ],
  'productivity': [
    'productivity', 'task', 'todo', 'calendar', 'schedule', 'reminder',
    'note', 'notes', 'notebook', 'obsidian', 'notion notes',
    'time tracking', 'pomodoro', 'focus',
    'meeting', 'zoom', 'google meet', 'calendar event',
    'bookmark', 'reading list', 'raindrop',
    'clipboard', 'snippet', 'template',
  ],
  'communication': [
    'email', 'gmail', 'outlook', 'smtp', 'imap',
    'slack', 'discord', 'telegram', 'whatsapp', 'signal',
    'message', 'messaging', 'chat', 'notification',
    'sms', 'twilio sms', 'push notification',
    'teams', 'microsoft teams',
  ],
  'security': [
    'security', 'auth', 'authentication', 'authorization', 'oauth',
    'jwt', 'token', 'secret', 'credential', 'vault', 'hashicorp',
    'encryption', 'decrypt', 'ssl', 'tls', 'certificate',
    'pentest', 'penetration testing', 'vulnerability', 'cve',
    'firewall', 'zero trust', 'rbac', 'access control',
    'scan', 'audit', 'compliance', 'soc2',
    'password', 'mfa', '2fa', 'sso', 'saml',
  ],
  'data-analytics': [
    'analytics', 'analysis', 'data analysis', 'data science',
    'pandas', 'numpy', 'jupyter', 'notebook',
    'visualization', 'chart', 'graph', 'dashboard', 'report',
    'bi', 'business intelligence', 'tableau', 'power bi', 'looker', 'metabase',
    'etl', 'pipeline', 'data pipeline', 'airflow', 'dbt',
    'statistics', 'ml', 'machine learning', 'model training',
    'feature engineering', 'dataset', 'dataframe',
  ],
  'finance': [
    'finance', 'financial', 'trading', 'stock', 'crypto', 'blockchain',
    'defi', 'wallet', 'bitcoin', 'ethereum', 'web3',
    'payment', 'invoice', 'billing', 'accounting', 'bookkeeping',
    'tax', 'budget', 'expense', 'revenue',
    'market data', 'price', 'ticker', 'portfolio',
    'forex', 'options', 'futures',
  ],
  'design': [
    'design', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
    'ui', 'ux', 'user interface', 'user experience',
    'prototype', 'wireframe', 'mockup',
    'component', 'design system', 'tailwind', 'css',
    'icon', 'svg', 'image generation', 'dall-e', 'stable diffusion',
    'canvas', 'drawing', 'animation', 'motion',
    'color', 'typography', 'font',
    '3d', 'blender', 'three.js', 'spline',
    'shadcn', 'radix', 'headless ui',
  ],
  'documentation': [
    'documentation', 'docs', 'readme', 'wiki', 'knowledge base',
    'confluence', 'gitbook', 'docusaurus', 'mkdocs',
    'api docs', 'openapi spec', 'schema doc',
    'manual', 'guide', 'tutorial', 'reference',
    'context7', 'library docs', 'sdk docs',
  ],
  'media': [
    'audio', 'video', 'music', 'podcast', 'spotify', 'youtube',
    'image', 'photo', 'gallery', 'camera',
    'streaming', 'media player', 'transcribe', 'transcription',
    'text-to-speech', 'tts', 'speech-to-text', 'stt', 'whisper',
    'ffmpeg', 'media processing', 'encode',
  ],
  'gaming': [
    'game', 'gaming', 'unity', 'unreal', 'godot', 'roblox',
    'minecraft', 'steam', 'xbox', 'playstation',
    'level design', 'sprite', 'tilemap',
  ],
  'mobile': [
    'mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native',
    'capacitor', 'expo', 'app store', 'play store',
    'push notification', 'deep link',
  ],
}

// ── Scoring ────────────────────────────────────────────────────────────────────

function buildSearchText(entry) {
  const parts = [
    entry.slug ?? '',
    entry.name ?? '',
    entry.displayName ?? '',
    entry.description ?? '',
    ...(entry.tags ?? []),
  ]
  return parts.join(' ').toLowerCase()
}

function scoreEntry(text, keywords) {
  let score = 0
  for (const kw of keywords) {
    if (text.includes(kw)) score++
  }
  return score
}

function classify(entry) {
  const text = buildSearchText(entry)
  let bestCat = null
  let bestScore = 0

  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    const score = scoreEntry(text, keywords)
    if (score > bestScore) {
      bestScore = score
      bestCat = cat
    }
  }

  return bestScore >= 1 ? bestCat : null
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))

  const generalEntries = registry.mcpServers.filter(s => s.category === 'general')
  console.log(`Entries in 'general': ${generalEntries.length} / ${registry.mcpServers.length}`)

  const changes = []
  let reclassified = 0
  let unclassified = 0

  for (const entry of generalEntries) {
    const newCat = classify(entry)
    if (newCat && newCat !== 'general') {
      changes.push({ slug: entry.slug, from: 'general', to: newCat })
      entry.category = newCat
      reclassified++
    } else {
      unclassified++
    }
  }

  // Stats
  const catCounts = {}
  registry.mcpServers.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1 })
  const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1])

  console.log(`\nReclassified: ${reclassified}`)
  console.log(`Still general: ${unclassified}`)
  console.log('\nCategory distribution after:')
  sorted.forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`))

  if (DRY_RUN) {
    console.log('\nDRY_RUN — no write')
    console.log('\nSample changes:')
    changes.slice(0, 20).forEach(c => console.log(`  ${c.slug}: ${c.from} -> ${c.to}`))
    return
  }

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n')
  console.log(`\nWritten to ${REGISTRY_PATH}`)
}

main()
