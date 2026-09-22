-- ==========================================================================
-- 012 — Artık tabloları kaldır  (YIKICI — geri alınamaz)
--
-- ÖNCE 011'i ÇALIŞTIR. O, RLS'i açarak acil riski kapatıyor ve veri
-- silmiyor. Bu dosya ise tabloları tamamen kaldırıyor.
--
-- İçerikleri Supabase Table Editor'da incelendi:
--   public.profiles   0 kayıt
--   public.exercises  0 kayıt
--   public.workouts   12 kayıt — Nisan/Mayıs 2026, hepsi status='pending',
--                     ai_advice alanları eski sürümün çıktıları. Bir satırda
--                     "Coach.ai is thinking deeply right now" yazıyor; o,
--                     tavsiye değil eski HATA MESAJIYDI.
--
-- Üçü de uygulama kodunda hiç kullanılmıyor ve yeni sürüm bu veriyi hiç
-- okumuyor. Saklamanın bir faydası yok.
-- ==========================================================================

-- Silme sırası yabancı anahtar bağımlılığına göre:
-- exercises.workout_id -> workouts.id olduğu için önce exercises.
drop table if exists public.exercises;
drop table if exists public.workouts;
drop table if exists public.profiles;

-- --------------------------------------------------------------------------
-- Çalıştırmadan önce son bir bakmak istersen:
--
--   select user_id, workout_date, status, left(ai_advice, 60) as tavsiye
--   from public.workouts
--   order by workout_date;
--
-- Yedeklemek istersen Table Editor'da tablonun sağ üstündeki menüden
-- "Export as CSV" ile indirebilirsin.
-- --------------------------------------------------------------------------
