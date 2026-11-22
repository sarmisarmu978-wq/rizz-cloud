-- Jalankan seluruh SQL ini di Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.files (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 size bigint not null check (size > 0 and size <= 1073741824),
 mime_type text not null default 'application/octet-stream',
 storage_key text not null unique,
 share_token text unique,
 is_public boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.files enable row level security;
create policy "Owners can view their files" on public.files for select to authenticated using (auth.uid() = owner_id);
create policy "Owners can insert their files" on public.files for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update their files" on public.files for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owners can delete their files" on public.files for delete to authenticated using (auth.uid() = owner_id);
create index if not exists files_owner_created_idx on public.files(owner_id,created_at desc);
create index if not exists files_share_token_idx on public.files(share_token) where is_public = true;
-- Public metadata is intentionally not exposed through anon RLS.
-- Shared downloads are resolved only by the server-side /api/share route.