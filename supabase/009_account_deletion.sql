-- ==========================================================================
-- 009 — Hesap silme
--
-- KVKK md. 11 ve GDPR md. 17 kullanıcıya verilerinin silinmesini isteme
-- hakkı veriyor. Uygulamada bunun karşılığı yoktu.
--
-- auth.users satırını silmek normalde service_role gerektirir ve o anahtar
-- asla istemciye inmemeli. Çözüm SECURITY DEFINER bir fonksiyon: yetkiyi
-- fonksiyonun sahibinden alıyor ama SİLECEĞİ SATIRI auth.uid() ile kendisi
-- belirliyor, dışarıdan parametre almıyor. Yani bir kullanıcı bu fonksiyonla
-- yalnızca kendi hesabını silebilir; başkasının kimliğini geçiremez.
--
-- Cascade'e güvenmiyoruz: routines, workout_sessions ve set_logs tabloları
-- bu projeden önce oluşturulmuştu ve yabancı anahtar davranışları belirsiz.
-- Her tabloyu açıkça, bağımlılık sırasına göre siliyoruz.
-- ==========================================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
-- search_path sabitleniyor: SECURITY DEFINER fonksiyonlarda bunu yapmamak
-- şema ele geçirme saldırısına açık kapı bırakır.
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Oturum bulunamadı';
  end if;

  -- Önce yaprak tablolar (yabancı anahtarla üste bağlı olanlar).
  delete from public.set_logs
  where session_id in (
    select id from public.workout_sessions where user_id = uid
  );

  delete from public.routine_exercises
  where routine_id in (
    select id from public.routines where user_id = uid
  );

  -- Sonra doğrudan kullanıcıya bağlı olanlar.
  delete from public.workout_sessions where user_id = uid;
  delete from public.routines where user_id = uid;
  delete from public.exercise_adjustments where user_id = uid;
  delete from public.custom_exercises where user_id = uid;
  delete from public.feedback where user_id = uid;
  delete from public.ai_requests where user_id = uid;

  -- En son kimlik kaydı. Bu satır gidince oturum da geçersizleşiyor.
  delete from auth.users where id = uid;
end;
$$;

-- Fonksiyonu yalnızca giriş yapmış kullanıcılar çağırabilir.
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
