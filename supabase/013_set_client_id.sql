-- ==========================================================================
-- 013 — Set kayıtlarına istemci kimliği (çevrimdışı kuyruk için)
--
-- Çevrimdışı set kaydında en kritik sorun ÇİFT KAYIT:
--
--   Set sunucuya ulaşır -> veritabanına yazılır -> CEVAP DÖNERKEN BAĞLANTI
--   KOPAR -> istemci "gönderilemedi" sanır -> tekrar gönderir -> aynı set
--   iki kez kaydedilir.
--
-- Çözüm: her set için istemcide bir kimlik üretmek ve veritabanında o
-- kimliği benzersiz yapmak. İkinci gönderim çakışır, uygulama bunu
-- "zaten kaydedilmiş" olarak yorumlar ve sessizce başarılı sayar.
--
-- Kolon nullable: bu özellikten önce yazılmış kayıtlarda yok. Postgres
-- benzersiz indekslerde birden fazla NULL'a izin verdiği için sorun çıkmaz.
-- ==========================================================================

alter table public.set_logs
  add column if not exists client_id uuid;

create unique index if not exists set_logs_client_id_key
  on public.set_logs (client_id)
  where client_id is not null;
