-- ==========================================================================
-- 006 — Geri bildirim ve hata raporları
--
-- Beta testi için. İki şeyi aynı tabloda topluyor:
--   'feedback' : kullanıcının uygulamadan bildirdiği sorun/öneri
--   'error'    : istemci tarafında yakalanan hata (otomatik)
--
-- Beta testçilerinin yaşadığı sorunların çoğu "hata" değil kafa karışıklığı
-- olacak ("bu kilo saçma geldi", "burayı anlamadım"). Hata takip araçları
-- bunları göremez; bu yüzden ikisini birlikte topluyoruz.
-- ==========================================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  kind text not null check (kind in ('feedback', 'error')),
  message text not null,

  -- Hangi sayfadan geldiği, tarayıcı bilgisi, hata digest'i gibi bağlam.
  context jsonb,

  -- Sen okuduktan sonra işaretlemek için.
  resolved_at timestamptz,

  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Kullanıcı yalnızca kendi kaydını yazabilir ve görebilir.
-- Yönetici erişimi Supabase panelinden (service role) yapılır.
drop policy if exists "feedback_owner_insert" on public.feedback;
create policy "feedback_owner_insert" on public.feedback
  for insert with check (auth.uid() = user_id);

drop policy if exists "feedback_owner_select" on public.feedback;
create policy "feedback_owner_select" on public.feedback
  for select using (auth.uid() = user_id);

create index if not exists feedback_unresolved_idx
  on public.feedback (created_at desc) where resolved_at is null;
