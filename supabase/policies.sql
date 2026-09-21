-- ==========================================================================
-- Coach.ai — Row Level Security politikaları
--
-- Uygulama kodu her sorguda user_id kontrolü yapıyor, ancak bu TEK savunma
-- hattı olmamalı: anon key tarayıcıya iniyor, dolayısıyla veritabanının kendisi
-- de kendini korumak zorunda. Bu dosyayı Supabase SQL Editor'da çalıştır ve
-- Table Editor'da her tablo için "RLS enabled" rozetini doğrula.
-- ==========================================================================

alter table public.routines            enable row level security;
alter table public.routine_exercises   enable row level security;
alter table public.workout_sessions    enable row level security;
alter table public.set_logs            enable row level security;

-- --------------------------------------------------------------------------
-- routines: doğrudan sahiplik
-- --------------------------------------------------------------------------
drop policy if exists "routines_owner_all" on public.routines;
create policy "routines_owner_all" on public.routines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- routine_exercises: sahiplik üst tablodan türetilir
-- --------------------------------------------------------------------------
drop policy if exists "routine_exercises_owner_all" on public.routine_exercises;
create policy "routine_exercises_owner_all" on public.routine_exercises
  for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- workout_sessions: doğrudan sahiplik
-- --------------------------------------------------------------------------
drop policy if exists "workout_sessions_owner_all" on public.workout_sessions;
create policy "workout_sessions_owner_all" on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- set_logs: sahiplik oturum üzerinden türetilir.
-- Uygulamadaki en kritik politika bu: eski kodda logSetAction hiç auth
-- kontrolü yapmıyordu, yani buradaki policy tek koruma katmanıydı.
-- --------------------------------------------------------------------------
drop policy if exists "set_logs_owner_all" on public.set_logs;
create policy "set_logs_owner_all" on public.set_logs
  for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = set_logs.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = set_logs.session_id
        and s.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- Performans: RLS alt sorguları ve listeleme sorguları bu indeksleri kullanır.
-- --------------------------------------------------------------------------
create index if not exists routines_user_id_idx           on public.routines (user_id);
create index if not exists routine_exercises_routine_idx  on public.routine_exercises (routine_id);
create index if not exists workout_sessions_user_id_idx   on public.workout_sessions (user_id);
create index if not exists set_logs_session_id_idx        on public.set_logs (session_id);

-- --------------------------------------------------------------------------
-- Artık kullanılmayan tablo: saveAIWorkout kaldırıldı, hiçbir yerden yazılmıyor.
-- İçinde veri yoksa silebilirsin:
--   drop table if exists public.workouts;
-- --------------------------------------------------------------------------
