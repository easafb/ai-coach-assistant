-- ==========================================================================
-- VERİ TEMİZLİĞİ — TEK SEFERLİK, GERİ ALINAMAZ
--
-- Bu bir migration DEĞİLDİR. Şema değiştirmez, VERİ SİLER.
-- Geliştirme sırasında birikmiş test kayıtlarını (AAA, BBB, sınır dışı
-- ağırlıklar, sınıflandırılmamış hareketler) temizlemek için yazıldı.
--
-- SİLİNEN VERİ GERİ GETİRİLEMEZ. Gerçek kullanıcı verisi varsa çalıştırma.
--
-- Kullanıcı hesapları (auth.users) SİLİNMEZ. Giriş bilgilerin korunur,
-- yalnızca antrenman verisi sıfırlanır.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- ADIM 1 — ÖNCE BUNU ÇALIŞTIR: ne silineceğini gör
-- --------------------------------------------------------------------------
select 'set_logs'             as tablo, count(*) as silinecek from public.set_logs
union all select 'workout_sessions',    count(*) from public.workout_sessions
union all select 'routine_exercises',   count(*) from public.routine_exercises
union all select 'routines',            count(*) from public.routines
union all select 'exercise_adjustments', count(*) from public.exercise_adjustments
order by tablo;

-- --------------------------------------------------------------------------
-- ADIM 2 — Sayılar beklediğin gibiyse aşağıdaki bloğun yorumunu kaldır ve
-- çalıştır. Silme sırası yabancı anahtar bağımlılıklarına göre.
-- --------------------------------------------------------------------------

-- begin;
--
-- delete from public.set_logs;
-- delete from public.workout_sessions;
-- delete from public.routine_exercises;
-- delete from public.routines;
-- delete from public.exercise_adjustments;
--
-- -- 005 henüz çalıştırıldıysa ve içinde test kaydı varsa:
-- -- delete from public.custom_exercises;
--
-- commit;

-- --------------------------------------------------------------------------
-- ADIM 3 — Doğrulama: hepsi 0 dönmeli
-- --------------------------------------------------------------------------
-- select 'set_logs' as tablo, count(*) from public.set_logs
-- union all select 'workout_sessions', count(*) from public.workout_sessions
-- union all select 'routine_exercises', count(*) from public.routine_exercises
-- union all select 'routines', count(*) from public.routines
-- union all select 'exercise_adjustments', count(*) from public.exercise_adjustments;
