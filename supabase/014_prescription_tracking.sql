-- ==========================================================================
-- 014 — Motorun ne önerdiğini kaydet
--
-- Motor her set için bir ağırlık öneriyor, arayüz bunu input'a dolduruyor,
-- kullanıcı kabul ediyor ya da üstüne yazıyor. Ama KAYDEDİLEN TEK ŞEY
-- kullanıcının girdiği ağırlıktı.
--
-- Sonuç: motorun doğru çalışıp çalışmadığı ÖLÇÜLEMİYORDU. Uyum oranı
-- (önerilen = girilen) hesaplanamıyordu ve geçen her seans geri
-- kazanılamayacak veri demekti.
--
-- Kolonlar nullable: bu özellikten önceki kayıtlarda yok ve çevrimdışı
-- kuyruktan gelen eski girdilerde de olmayabilir.
-- ==========================================================================

alter table public.set_logs
  -- Uyum oranının paydası. first-time kararında motor ağırlık önermiyor, null.
  add column if not exists prescribed_weight numeric,
  -- Tekrar hedefine uyum ayrı ölçülür.
  add column if not exists prescribed_reps integer,
  -- first-time | add-weight | add-reps | repeat | deload
  add column if not exists decision text,
  -- Koç devreye girdiyse: reduce_load | swap | skip
  add column if not exists adjustment_action text,
  -- Kullanıcının belirttiği kısıt ("omzum ağrıyor")
  add column if not exists adjustment_reason text;

create index if not exists set_logs_decision_idx
  on public.set_logs (decision)
  where decision is not null;
