-- ==========================================================================
-- 007 — Tekrar aralıkları ve hareket tipi
--
-- Motor tek bir hedef tekrar taşıyordu (örn. 3 × 10) ve hedefi tutturan
-- herkese HER SEANS ağırlık artırmasını söylüyordu. 10 kg'lık bir lateral
-- raise'e 2.5 kg eklemek %25'lik bir sıçramadır; gerçekte o hareket aylarca
-- aynı ağırlıkta kalıp tekrar ekleyerek ilerler.
--
-- Gerçek çift ilerleme bir tekrar ARALIĞIYLA çalışır: aralığın üst ucuna
-- kadar tekrar eklenir, ancak tüm setler üst uca ulaşınca ağırlık artar.
-- Böylece ilerlemenin yavaşlaması modelden kendiliğinden çıkar.
--
-- Ayrıca hareket tipi (bileşik/izolasyon) ve salonda yapılabilen en küçük
-- adım saklanıyor; artış artık sabit değil, yükün yüzdesi olarak hesaplanıyor.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- routine_exercises: tekrar aralığı
-- --------------------------------------------------------------------------
alter table public.routine_exercises
  add column if not exists min_reps integer,
  add column if not exists max_reps integer;

-- Mevcut kayıtlar: default_reps alt uç olur, üst uç +4 tekrar.
-- (8 -> 8-12 gibi; yaygın ve güvenli bir aralık.)
update public.routine_exercises
set min_reps = coalesce(min_reps, default_reps),
    max_reps = coalesce(max_reps, default_reps + 4)
where min_reps is null or max_reps is null;

alter table public.routine_exercises
  alter column min_reps set not null,
  alter column max_reps set not null;

alter table public.routine_exercises
  drop constraint if exists routine_exercises_reps_range;
alter table public.routine_exercises
  add constraint routine_exercises_reps_range
  check (min_reps >= 1 and max_reps >= min_reps and max_reps <= 100);

-- NOT: default_reps kolonu bilerek bırakıldı (eski kayıtların izi).
-- Uygulama artık yalnızca min_reps/max_reps okuyor ve yazıyor.

-- --------------------------------------------------------------------------
-- custom_exercises: hareket tipi ve en küçük adım
-- --------------------------------------------------------------------------
alter table public.custom_exercises
  add column if not exists exercise_type text,
  add column if not exists min_step numeric;

-- 005'te girilen "increment" değeri en küçük adım olarak devralınıyor.
update public.custom_exercises
set exercise_type = coalesce(exercise_type, 'compound'),
    min_step = coalesce(min_step, increment)
where exercise_type is null or min_step is null;

alter table public.custom_exercises
  alter column exercise_type set not null,
  alter column min_step set not null;

alter table public.custom_exercises
  drop constraint if exists custom_exercises_type_valid;
alter table public.custom_exercises
  add constraint custom_exercises_type_valid
  check (exercise_type in ('compound', 'isolation'));

alter table public.custom_exercises
  drop constraint if exists custom_exercises_min_step_valid;
alter table public.custom_exercises
  add constraint custom_exercises_min_step_valid
  check (min_step in (1.25, 2.5, 5));
