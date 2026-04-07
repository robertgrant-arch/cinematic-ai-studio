-- Cinematic AI Studio Database Schema
-- Run this in your Supabase SQL Editor
-- Updated: Aligned with application code

-- Projects (campaigns)
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  brief text,
  product_name text,
  product_description text,
  target_audience text,
  tone text default 'cinematic',
  duration_seconds integer default 30,
  platforms text[] default '{"16:9"}',
  status text default 'draft',
  brand_kit jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Research packs
create table if not exists public.research_packs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  competitor_analysis jsonb default '{}',
  market_insights jsonb default '{}',
  hook_suggestions text[],
  style_references text[],
  created_at timestamptz default now()
);

-- Storyboards
create table if not exists public.storyboards (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  version integer default 1,
  script text,
  scenes jsonb default '[]',
  created_at timestamptz default now()
);

-- Shots (aligned with app code)
create table if not exists public.shots (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  storyboard_id uuid references public.storyboards(id) on delete cascade,
  order_index integer not null default 0,
  shot_type text not null default 'Hero Product Reveal',
  prompt text default '',
  negative_prompt text,
  duration integer default 5,
  camera_movement text default 'Static Lock',
  video_url text,
  thumbnail_url text,
  reference_image_url text,
  model text default 'kling',
  model_params jsonb default '{}',
  status text default 'draft',
  approval_status text default 'pending',
  fal_request_id text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Generation jobs
create table if not exists public.generation_jobs (
  id uuid default gen_random_uuid() primary key,
  shot_id uuid references public.shots(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade not null,
  provider text default 'fal',
  model text not null,
  input_params jsonb not null,
  status text default 'queued',
  result jsonb,
  error text,
  cost_cents integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Exports
create table if not exists public.exports (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  format text default '16:9',
  resolution text default '1080p',
  include_captions boolean default false,
  include_music boolean default false,
  output_url text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.projects enable row level security;
alter table public.research_packs enable row level security;
alter table public.storyboards enable row level security;
alter table public.shots enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.exports enable row level security;

-- Policies
create policy "Users can manage own projects" on public.projects
  for all using (auth.uid() = user_id);

create policy "Users can manage own research" on public.research_packs
  for all using (project_id in (select id from public.projects where user_id = auth.uid()));

create policy "Users can manage own storyboards" on public.storyboards
  for all using (project_id in (select id from public.projects where user_id = auth.uid()));

create policy "Users can manage own shots" on public.shots
  for all using (project_id in (select id from public.projects where user_id = auth.uid()));

create policy "Users can manage own jobs" on public.generation_jobs
  for all using (project_id in (select id from public.projects where user_id = auth.uid()));

create policy "Users can manage own exports" on public.exports
  for all using (project_id in (select id from public.projects where user_id = auth.uid()));

-- Migration helper: If you already have the old schema, run these ALTER statements instead
-- ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS order_index integer default 0;
-- ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS shot_type text default 'Hero Product Reveal';
-- ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS duration integer default 5;
-- ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS camera_movement text default 'Static Lock';
-- ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS video_url text;
-- ALTER TABLE public.shots ADD COLUMN IF NOT EXISTS approval_status text default 'pending';
-- ALTER TABLE public.shots ALTER COLUMN storyboard_id DROP NOT NULL;
-- ALTER TABLE public.shots ALTER COLUMN prompt DROP NOT NULL;
-- ALTER TABLE public.generation_jobs ALTER COLUMN shot_id DROP NOT NULL;
