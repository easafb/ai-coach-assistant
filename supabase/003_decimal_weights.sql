-- ==========================================================================
-- 003 — Ondalık ağırlıklar
--
-- total_volume integer olarak tanımlanmıştı. İlerleme motoru 2.5 kg'lık
-- artışlar önerdiği için ondalık ağırlıklar artık istisna değil kural, ve
-- INSERT "invalid input syntax for type integer" ile patlıyordu.
--
-- Precision BİLEREK belirtilmedi. İlk denemede numeric(6,2) kullanıldı ve
-- "numeric field overflow" ile patladı: Faz 0 öncesi test verilerinde ağırlık
-- doğrulaması yoktu, bu yüzden 10.000'den büyük değerler var. Precision'sız
-- numeric mevcut veri ne olursa olsun kabul eder, dolayısıyla bu migration
-- veriyi bozmadan ve tahmin gerektirmeden çalışır.
--
-- Makul sınırlar uygulama katmanında zorlanıyor (logSetAction: 0 < ağırlık
-- <= 1000, 1 <= tekrar <= 100). Eski veriyi silmediğimiz için veritabanına
-- CHECK constraint eklenmedi; temizledikten sonra eklemek isteyebilirsin.
-- ==========================================================================

alter table public.workout_sessions
  alter column total_volume type numeric
  using total_volume::numeric;

alter table public.set_logs
  alter column weight type numeric
  using weight::numeric;

-- --------------------------------------------------------------------------
-- TEŞHİS (isteğe bağlı): sınır dışı eski kayıtları görmek için
--
--   select id, session_id, exercise_name, weight, reps, created_at
--   from public.set_logs
--   where weight > 1000 or weight <= 0 or reps > 100 or reps < 1
--   order by weight desc;
--
-- Bunları temizlemek istersen (önce yukarıdaki sorguyla NE sildiğini gör):
--
--   delete from public.set_logs
--   where weight > 1000 or weight <= 0 or reps > 100 or reps < 1;
--
-- Silersen etkilenen antrenmanların total_volume değeri artık yanlış olur;
-- şu sorgu onları setlerden yeniden hesaplar:
--
--   update public.workout_sessions s
--   set total_volume = coalesce((
--     select sum(l.weight * l.reps) from public.set_logs l
--     where l.session_id = s.id
--   ), 0)
--   where s.end_time is not null;
-- --------------------------------------------------------------------------
