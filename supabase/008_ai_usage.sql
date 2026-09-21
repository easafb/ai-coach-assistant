-- ==========================================================================
-- 008 — AI kullanım kaydı
--
-- Koç uç noktasında HİÇBİR limit yoktu. Normal kullanım ucuz (çağrı başına
-- ~2.750 token) ama tavan da yoktu: tek bir kötü niyetli kullanıcı, bir
-- döngü hatası veya betikle atılan istekler faturayı sınırsız şişirebilirdi.
--
-- Her istek buraya bir satır düşüyor. Sayım bu tablodan yapılıyor; ayrı bir
-- sayaç kolonu tutup artırmak yerine satır eklemek yarış koşulu yaratmıyor
-- ve maliyet analizi için kayıt da bırakıyor.
-- ==========================================================================

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Maliyet takibi için; sağlayıcı yanıtından geliyor.
  prompt_tokens integer,
  output_tokens integer,

  created_at timestamptz not null default now()
);

alter table public.ai_requests enable row level security;

-- Kullanıcı yalnızca kendi kayıtlarını görebilir ve yazabilir.
drop policy if exists "ai_requests_owner_insert" on public.ai_requests;
create policy "ai_requests_owner_insert" on public.ai_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "ai_requests_owner_select" on public.ai_requests;
create policy "ai_requests_owner_select" on public.ai_requests
  for select using (auth.uid() = user_id);

create index if not exists ai_requests_user_day_idx
  on public.ai_requests (user_id, created_at desc);

create index if not exists ai_requests_day_idx
  on public.ai_requests (created_at desc);

-- --------------------------------------------------------------------------
-- Maliyet takibi (istediğin zaman çalıştır):
--
--   select date_trunc('day', created_at)::date as gun,
--          count(*) as istek,
--          sum(prompt_tokens) as girdi_token,
--          sum(output_tokens) as cikti_token,
--          count(distinct user_id) as kullanici
--   from public.ai_requests
--   group by 1 order by 1 desc;
-- --------------------------------------------------------------------------
