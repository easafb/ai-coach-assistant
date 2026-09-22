-- ==========================================================================
-- 015 — Huni olayları
--
-- Kullanıcının nerede düştüğü ölçülemiyordu. Ayrı bir analitik aracı
-- kurmuyoruz: tek tablo, sorgular SQL. Veri zaten kendi veritabanımızda,
-- üçüncü tarafa kullanıcı davranışı göndermeye de gerek yok (KVKK açısından
-- da sade kalıyor).
--
-- metadata jsonb: olaya özgü ek bilgi (hangi rutin, kaç set, vb). Şemayı
-- her yeni olay için değiştirmek zorunda kalmamak için.
-- ==========================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  metadata jsonb,

  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Kullanıcı yalnızca kendi olaylarını yazabilir ve görebilir.
-- Toplu analiz Supabase panelinden (service role) yapılıyor.
drop policy if exists "events_owner_insert" on public.events;
create policy "events_owner_insert" on public.events
  for insert with check (auth.uid() = user_id);

drop policy if exists "events_owner_select" on public.events;
create policy "events_owner_select" on public.events
  for select using (auth.uid() = user_id);

create index if not exists events_name_created_idx
  on public.events (name, created_at desc);

create index if not exists events_user_created_idx
  on public.events (user_id, created_at);
