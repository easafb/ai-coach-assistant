-- ==========================================================================
-- 010 — Açık rıza kayıtları
--
-- KVKK md. 6 sağlık verisinin işlenmesini, md. 9 ise yurt dışına aktarımı
-- AÇIK RIZAYA bağlıyor. Uygulamada ikisi de yapılıyordu (Koç'a yazılan ağrı
-- bildirimleri + Supabase/Vercel/Google sunucuları) ama rıza alınmıyordu.
--
-- Onay kutusu tek başına yetmiyor: rıza KANITLANABİLİR olmalı. Kullanıcı
-- "onaylamadım" derse elde kayıt bulunmalı. Ayrıca metin güncellendiğinde
-- kimin hangi sürümü onayladığı bilinmeli; bu yüzden sürüm alanı var.
-- ==========================================================================

create table if not exists public.user_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Onaylanan aydınlatma metninin sürümü. Metin değişince bu artırılır ve
  -- eski sürümü onaylamış kullanıcılardan yeniden onay istenir.
  policy_version integer not null,

  -- KVKK md. 6: özel nitelikli (sağlık) veri işlenmesine açık rıza.
  health_data boolean not null,
  -- KVKK md. 9: yurt dışındaki sunuculara aktarıma açık rıza.
  cross_border boolean not null,

  consented_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_consents enable row level security;

drop policy if exists "user_consents_owner_all" on public.user_consents;
create policy "user_consents_owner_all" on public.user_consents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
