-- ==========================================================================
-- 004 — Egzersiz ayarlamaları
--
-- Kullanıcı bir durum bildirdiğinde (ağrı, bitkinlik) programın nasıl
-- esneyeceğini saklar. Ayarlama RUTİNE değil EGZERSİZE bağlı: omuz ağrısı
-- bench press'i her programda etkilemeli, yalnızca "Push"ta değil.
--
-- Tabloda bilerek hiçbir ağırlık/sayı alanı yok. Hafifletme oranı kodda
-- sabit (lib/adjustments.ts REDUCE_LOAD_FACTOR). Böylece modelin ürettiği
-- bir sayı hiçbir zaman doğrudan kullanıcının kaldıracağı kiloya dönüşemez.
-- ==========================================================================

create table if not exists public.exercise_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Normalize edilmiş ad: eşleşme büyük/küçük harf ve Türkçe karakterden bağımsız.
  exercise_key text not null,
  -- Kullanıcıya gösterilen kanonik ad.
  exercise_name text not null,

  action text not null check (action in ('reduce_load', 'swap', 'skip')),
  substitute_name text,
  reason text not null,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null,

  -- Egzersiz başına tek aktif ayarlama; yenisi eskisini değiştirir.
  unique (user_id, exercise_key),

  -- swap ise ikame zorunlu, değilse olmamalı.
  constraint substitute_only_for_swap check (
    (action = 'swap' and substitute_name is not null)
    or (action <> 'swap' and substitute_name is null)
  )
);

alter table public.exercise_adjustments enable row level security;

drop policy if exists "exercise_adjustments_owner_all" on public.exercise_adjustments;
create policy "exercise_adjustments_owner_all" on public.exercise_adjustments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists exercise_adjustments_user_active_idx
  on public.exercise_adjustments (user_id, expires_at);
