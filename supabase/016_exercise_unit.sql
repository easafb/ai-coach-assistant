-- ==========================================================================
-- 016 — Hareket birimi (tekrar / saniye)
--
-- Plank gibi izometrik duruşlar tekrarla değil SÜREYLE ölçülür. Şablonda
-- "Plank 3 x 1-5 tekrar" yazıyordu; bu anlamsız bir hedef ve kullanıcı ne
-- gireceğini bilemiyordu.
--
-- Katalogdaki hareketlerin birimi kodda tanımlı; bu kolon yalnızca
-- kullanıcının kendi eklediği hareketler için.
-- ==========================================================================

alter table public.custom_exercises
  add column if not exists unit text not null default 'reps';

alter table public.custom_exercises
  drop constraint if exists custom_exercises_unit_valid;
alter table public.custom_exercises
  add constraint custom_exercises_unit_valid
  check (unit in ('reps', 'seconds'));
