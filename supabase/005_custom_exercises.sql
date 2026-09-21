-- ==========================================================================
-- 005 — Kullanıcıya özel egzersizler
--
-- Serbest metinle girilen hareketler (örn. "AAA") sistemde sınıflandırılmamış
-- kalıyordu. Sonuçları: artış adımı körlemesine 2.5 kg'a düşüyor, AI ikame
-- öneremiyor (kas grubu bilinmediği için güvenlik doğrulaması reddediyor) ve
-- kas grubu bazlı analitik imkânsız hale geliyor.
--
-- Çözüm serbest metni yasaklamak DEĞİL: 52 hareketlik katalog gerçek salonlara
-- yetmez, ekipmana özgü hareketi ekleyemeyen kullanıcı veri girişi ekranında
-- tıkanır. Bunun yerine sınıflandırma zorunlu: kullanıcı istediği adı girer
-- ama kas grubunu ve artış adımını seçer. Kayıt buraya düşer ve katalogdaki
-- hareketlerle tamamen eşit davranır.
-- ==========================================================================

create table if not exists public.custom_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Normalize edilmiş ad: eşleşme büyük/küçük harf ve Türkçe karakterden bağımsız.
  exercise_key text not null,
  exercise_name text not null,

  muscle_group text not null check (
    muscle_group in ('göğüs', 'sırt', 'omuz', 'kol', 'bacak', 'karın')
  ),
  increment numeric not null check (increment > 0 and increment <= 25),

  created_at timestamptz not null default now(),

  unique (user_id, exercise_key)
);

alter table public.custom_exercises enable row level security;

drop policy if exists "custom_exercises_owner_all" on public.custom_exercises;
create policy "custom_exercises_owner_all" on public.custom_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists custom_exercises_user_idx
  on public.custom_exercises (user_id);
