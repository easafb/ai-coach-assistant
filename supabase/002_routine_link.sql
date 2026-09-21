-- ==========================================================================
-- 002 — workout_sessions.routine_id
--
-- Oturumlar rutini yalnızca isimle (routine_name) saklıyordu. Adaptif ilerleme
-- motorunun tüm girdisi "bu rutini en son ne zaman yaptım, ne kaldırdım"
-- sorusu olduğu için bu bağlantının sağlam olması gerekiyor: isim eşleştirme
-- rutin yeniden adlandırılınca geçmişi koparıyor, aynı adlı iki rutin de
-- birbirine karışıyor.
--
-- routine_name kolonu bilerek duruyor: rutin silinse bile geçmiş ekranında
-- antrenmanın adı görünmeye devam etsin diye (on delete set null).
-- ==========================================================================

alter table public.workout_sessions
  add column if not exists routine_id uuid
  references public.routines(id) on delete set null;

-- Mevcut kayıtları isimden eşleştirip dolduruyoruz.
-- NOT: Aynı kullanıcıda aynı ada sahip birden fazla rutin varsa eşleşme
-- keyfi olur. Geçmiş veri için kabul edilebilir; bundan sonrası ID ile yazılıyor.
update public.workout_sessions s
set routine_id = r.id
from public.routines r
where s.routine_id is null
  and r.user_id = s.user_id
  and r.name = s.routine_name;

create index if not exists workout_sessions_routine_id_idx
  on public.workout_sessions (routine_id);

-- Egzersiz geçmişi sorgusu set_logs'u session listesine göre tarıyor.
create index if not exists set_logs_session_exercise_idx
  on public.set_logs (session_id, exercise_name);
