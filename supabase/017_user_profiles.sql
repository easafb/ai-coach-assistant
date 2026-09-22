-- ==========================================================================
-- 017 — Antrenman sonrası anket
--
-- Kullanıcının hedefini, deneyimini ve uygulamayı nereden duyduğunu
-- bilmiyorduk. Anket kayıt anında değil İLK ANTRENMANDAN SONRA soruluyor:
-- kayıttan ilk sete giden yolu uzatmıyor, kullanıcı değeri gördükten sonra
-- cevaplıyor.
--
-- Tablo adı bilerek "profiles" değil. Eski profiles tablosu RLS'i kapalı
-- olduğu için 012'de silindi; "create table if not exists profiles" yazsaydık
-- ve o silme bir ortamda uygulanmamış olsaydı, bu dosya eski ve açık tabloyu
-- sessizce kabul edip geçerdi. Yeni ad o ihtimali ortadan kaldırıyor.
--
-- Satır yoksa: henüz sorulmadı. answered_at doluysa cevaplandı,
-- dismissed_at doluysa "şimdi değil" dendi — ikisinde de bir daha sorulmaz.
-- ==========================================================================

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  goal text check (goal in ('muscle', 'strength', 'fat_loss', 'fitness')),
  experience text check (experience in ('beginner', 'intermediate', 'advanced')),
  source text check (source in ('friend', 'social', 'search', 'other')),

  answered_at timestamptz,
  dismissed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_owner_select" on public.user_profiles;
create policy "user_profiles_owner_select" on public.user_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "user_profiles_owner_insert" on public.user_profiles;
create policy "user_profiles_owner_insert" on public.user_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_profiles_owner_update" on public.user_profiles;
create policy "user_profiles_owner_update" on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Silme politikası yok: satır yalnızca hesapla birlikte (cascade) gidiyor.
