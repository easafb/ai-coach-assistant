-- ==========================================================================
-- 011 — KRİTİK: korumasız tabloları kapat
--
-- Supabase Advisor üç tabloda RLS'in kapalı olduğunu bildirdi:
--   public.workouts  (12 satır: user_id, workout_date, status, ai_advice)
--   public.exercises (boş)
--   public.profiles  (boş)
--
-- Doğrulandı: anon anahtarla üçü de hem OKUNABİLİYOR hem YAZILABİLİYOR.
-- O anahtar tarayıcı paketinde herkese açık olduğu için bu, verinin
-- internete açık olması demek.
--
-- Üçü de projenin ilk iskeletinden kalma ve uygulama kodunda HİÇ
-- kullanılmıyor (workouts, silinen saveAIWorkout fonksiyonunundu).
--
-- ADIM 1 burada: RLS'i aç. Politika tanımlamıyoruz; RLS açık + politika yok
-- demek "hiç kimse erişemez" demek. Veri silinmiyor, sadece kapatılıyor.
-- ==========================================================================

alter table public.workouts  enable row level security;
alter table public.exercises enable row level security;
alter table public.profiles  enable row level security;

-- Bilerek hiçbir policy eklenmedi: bu tablolara erişmesi gereken kod yok.

-- --------------------------------------------------------------------------
-- ADIM 2 (isteğe bağlı, sonra): tabloları tamamen kaldır.
--
-- RLS açıldıktan sonra acil risk bitiyor. Tabloları silmek de istersen önce
-- içlerinde ne olduğuna bak:
--
--   select * from public.workouts;
--
-- İşine yarar bir şey yoksa:
--
--   drop table if exists public.workouts;
--   drop table if exists public.exercises;
--   drop table if exists public.profiles;
--
-- NOT: workouts içindeki 12 satır Nisan 2026'daki ilk sürümün AI tavsiye
-- kayıtları. Yeni uygulama bu veriyi hiç okumuyor.
-- --------------------------------------------------------------------------
