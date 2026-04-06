-- Cinematic AI Studio Database Schema
-- Run this in your Supabase SQL Editor

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

-- Shots
create table if not exists public.shots (
  id uuid default gen_random_uuid() primary key,
  storyboard_id uuid references public.storyboards(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  scene_index integer not null,
  prompt text not null,
  negative_prompt text,
  model text default 'fal-ai/veo3',
  model_params jsonb default '{}',
  duration_seconds numeric default 5,
  camera_motion text,
  reference_image_url text,
  status text default 'pending',
  output_url text,
  thumbnail_url text,
  fal_request_id text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Generation jobs
create table if not exists public.generation_jobs (
  id uuid default gen_random_uuid() primary key,
  shot_id uuid references public.shots(id) on delete cascade not null,
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
create policy "Users can manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can manage own research" on public.research_packs for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can manage own storyboards" on public.storyboards for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can manage own shots" on public.shots for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can manage own jobs" on public.generation_jobs for all using (project_id in (select id from public.projects where user_id = auth.uid()));
create policy "Users can manage own exports" on public.exports for all using (project_id in (select id from public.projects where user_id = auth.uid()));
