-- cgcone Supabase Schema
-- Run this in the Supabase SQL editor to create all tables.

-- ── mcp_servers ───────────────────────────────────────────────────────────────
create table if not exists mcp_servers (
  slug                text primary key,
  name                text,
  display_name        text,
  description         text,
  category            text,
  tags                text[],
  server_type         text,
  source_registry     text,
  github_url          text,
  docker_url          text,
  npm_url             text,
  documentation_url   text,
  vendor              text,
  stars               integer,
  is_archived         boolean default false,
  last_commit         timestamptz,
  verification_status text,
  install_config      jsonb,
  packages            jsonb,
  env_vars            jsonb,
  last_indexed_at     timestamptz,
  updated_at          timestamptz default now()
);

create index if not exists mcp_servers_category_idx  on mcp_servers (category);
create index if not exists mcp_servers_stars_idx     on mcp_servers (stars desc nulls last);
create index if not exists mcp_servers_archived_idx  on mcp_servers (is_archived);
create index if not exists mcp_servers_source_idx    on mcp_servers (source_registry);
create index if not exists mcp_servers_fts_idx       on mcp_servers using gin (
  to_tsvector('english', coalesce(display_name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(slug,''))
);

-- ── skills ────────────────────────────────────────────────────────────────────
create table if not exists skills (
  slug            text primary key,
  name            text,
  category        text,
  description     text,
  allowed_tools   text[],
  model           text,
  tags            text[],
  stars           integer,
  github_url      text,
  install_command text,
  source_registry text,
  content         text,
  last_indexed_at timestamptz,
  updated_at      timestamptz default now()
);

create index if not exists skills_category_idx on skills (category);
create index if not exists skills_stars_idx    on skills (stars desc nulls last);

-- ── plugins ───────────────────────────────────────────────────────────────────
create table if not exists plugins (
  slug            text primary key,
  name            text,
  description     text,
  version         text,
  author          text,
  author_url      text,
  repository      text,
  license         text,
  keywords        text[],
  category        text,
  stars           integer,
  install_command text,
  last_indexed_at timestamptz,
  updated_at      timestamptz default now()
);

create index if not exists plugins_category_idx on plugins (category);
create index if not exists plugins_stars_idx    on plugins (stars desc nulls last);

-- ── registry_meta ─────────────────────────────────────────────────────────────
create table if not exists registry_meta (
  id           integer primary key default 1,
  generated_at timestamptz,
  mcp_count    integer,
  skill_count  integer,
  plugin_count integer,
  updated_at   timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Enable RLS but allow anon SELECT (read-only public access)
alter table mcp_servers    enable row level security;
alter table skills         enable row level security;
alter table plugins        enable row level security;
alter table registry_meta  enable row level security;

create policy "public read mcp_servers"   on mcp_servers    for select using (true);
create policy "public read skills"        on skills         for select using (true);
create policy "public read plugins"       on plugins        for select using (true);
create policy "public read registry_meta" on registry_meta  for select using (true);
