-- ==========================================================================
-- BETA ÖLÇÜM SORGULARI
--
-- Test edenlerin tek tek satırlarını gezmek yerine bunları çalıştır.
-- Hem daha faydalı hem daha saygılı: "Ahmet dün kaç kilo bench yaptı"
-- değil, "motor mantıklı kararlar üretiyor mu" sorusunu cevaplıyorlar.
--
-- NOT: Sağlık verisi özel nitelikli kişisel veridir. Test edenlere
-- verilerine yönetici olarak erişebildiğini önceden söylemiş ol.
-- ==========================================================================


-- --------------------------------------------------------------------------
-- 1. HUNİ: kaydolan -> antrenman yapan -> geri dönen
-- Beta'nın tek en önemli sayısı en alttaki. Motor değerini ancak ikinci
-- antrenmanda gösterebiliyor; oraya ulaşmayan kullanıcı ürünü hiç görmemiş.
-- --------------------------------------------------------------------------
select
  (select count(*) from auth.users)                                   as kayitli_kullanici,
  (select count(distinct user_id) from public.routines)               as rutin_olusturan,
  (select count(distinct user_id) from public.workout_sessions)       as antrenman_baslatan,
  (select count(distinct user_id) from public.workout_sessions
    where end_time is not null)                                       as antrenman_bitiren,
  (select count(*) from (
     select user_id from public.workout_sessions
     where end_time is not null
     group by user_id having count(*) >= 2
   ) t)                                                               as ikinci_kez_donen;


-- --------------------------------------------------------------------------
-- 2. YARIM KALAN ANTRENMANLAR
-- Yüksek oran bir sorun işareti: ya arayüz karıştırıyor ya bitirme patlıyor.
-- --------------------------------------------------------------------------
select
  count(*) filter (where end_time is null)  as yarim_kalan,
  count(*) filter (where end_time is not null) as tamamlanan,
  round(100.0 * count(*) filter (where end_time is null) / nullif(count(*), 0), 1)
    as yarim_kalma_yuzdesi
from public.workout_sessions;


-- --------------------------------------------------------------------------
-- 3. MOTOR MANTIKLI MI? Egzersiz bazında ağırlık seyri
-- İlerleme motoru kararları runtime'da hesaplanıyor, veritabanında durmuyor.
-- Bunun yerine gerçek ağırlık seyrine bakıyoruz: düzgün çalışıyorsa çoğu
-- satırda fark 0 (tekrar) ya da +2.5/+5 (artış) olmalı. Büyük sıçramalar
-- veya sürekli düşüş incelenmeli.
-- --------------------------------------------------------------------------
with seans_agirliklari as (
  select
    s.user_id,
    l.exercise_name,
    s.end_time,
    max(l.weight) as calisma_agirligi
  from public.set_logs l
  join public.workout_sessions s on s.id = l.session_id
  where s.end_time is not null
  group by s.user_id, l.exercise_name, s.end_time
)
select
  exercise_name,
  count(*)                                          as seans_sayisi,
  round(avg(calisma_agirligi), 1)                   as ortalama_agirlik,
  round(avg(calisma_agirligi - onceki), 2)          as ortalama_degisim,
  max(calisma_agirligi - onceki)                    as en_buyuk_sicrama
from (
  select *, lag(calisma_agirligi) over (
    partition by user_id, exercise_name order by end_time
  ) as onceki
  from seans_agirliklari
) t
where onceki is not null
group by exercise_name
order by seans_sayisi desc;


-- --------------------------------------------------------------------------
-- 4. AI KOÇU KULLANILIYOR MU?
-- --------------------------------------------------------------------------
select
  action,
  count(*)                        as adet,
  count(distinct user_id)         as kullanici,
  count(*) filter (where substitute_name is not null) as ikame_ile
from public.exercise_adjustments
group by action
order by adet desc;


-- --------------------------------------------------------------------------
-- 5. GERİ BİLDİRİM VE HATALAR (okunmamışlar önce)
-- --------------------------------------------------------------------------
select
  created_at,
  kind,
  message,
  context ->> 'pathname' as sayfa
from public.feedback
where resolved_at is null
order by created_at desc
limit 50;

-- Okuduktan sonra işaretlemek için:
--   update public.feedback set resolved_at = now() where id = '<id>';


-- --------------------------------------------------------------------------
-- 6. SINIFLANDIRILMAMIŞ HAREKETLER
-- Bunlar yanlış artış adımı alıyor ve AI onlara ikame öneremiyor.
-- Çok çıkıyorsa katalog yetersiz demektir — eksik hareketleri eklemeliyiz.
-- --------------------------------------------------------------------------
select
  re.exercise_name,
  count(distinct r.user_id) as kac_kullanicida
from public.routine_exercises re
join public.routines r on r.id = re.routine_id
where not exists (
  select 1 from public.custom_exercises ce
  where ce.user_id = r.user_id
    and ce.exercise_key = lower(trim(re.exercise_name))
)
group by re.exercise_name
order by kac_kullanicida desc;
