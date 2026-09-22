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


-- --------------------------------------------------------------------------
-- 7. YARIM KALAN SEANSLAR
--
-- Uygulama arkadan kapatıldığında seans end_time = null kalıyor. Geçmiş,
-- hacim ve ilerleme motoru bitmemiş seansları filtrelediği için içlerindeki
-- setler hiçbir yerde görünmüyor.
--
-- Artık startWorkoutAction 6 saatten yeni olanlara DEVAM EDİYOR, eskimiş
-- olanları da o rutin bir daha başlatıldığında kapatıyor. Bu sorgu, hiç
-- tekrar açılmayan rutinlerde kalanları gösterir.
-- --------------------------------------------------------------------------
select
  s.id,
  s.routine_name,
  s.start_time,
  round(extract(epoch from (now() - s.start_time)) / 3600) as kac_saat_once,
  count(l.id) as kayitli_set,
  coalesce(sum(l.weight * l.reps), 0) as gorunmeyen_hacim
from public.workout_sessions s
left join public.set_logs l on l.session_id = s.id
where s.end_time is null
group by s.id, s.routine_name, s.start_time
order by s.start_time desc;

-- Elle kapatmak istersen (hacim setlerden hesaplanır):
--
--   update public.workout_sessions s
--   set end_time = now(),
--       total_volume = coalesce((
--         select sum(l.weight * l.reps) from public.set_logs l
--         where l.session_id = s.id
--       ), 0)
--   where s.end_time is null
--     and s.start_time < now() - interval '12 hours';


-- ==========================================================================
-- 8. UYUM ORANI — motorun güvenilirliğinin tek ölçülebilir göstergesi
--
-- Motor bir ağırlık öneriyor, arayüz input'a dolduruyor, kullanıcı kabul
-- ediyor ya da üstüne yazıyor. Uyum oranı = kabul edilen / toplam.
--
-- 014'ten ÖNCEKİ kayıtlarda prescribed_weight yok; onlar hesap dışı.
-- Bu yüzden ilk günlerde az veri görürsün, zamanla birikir.
-- ==========================================================================

-- Karar tipine göre ayrı ayrı. Bu ayrım kritik: deload önerisine uyulmaması
-- ile add-weight önerisine uyulmaması TAMAMEN farklı şeyler anlatır.
-- Deload'a uyulmuyorsa kullanıcı motoru değil egosunu dinliyordur.
select
  decision                                              as karar,
  count(*)                                              as set_sayisi,
  count(*) filter (where weight = prescribed_weight)    as uyulan,
  round(
    100.0 * count(*) filter (where weight = prescribed_weight) / count(*), 1
  )                                                     as uyum_yuzdesi,
  round(avg(weight - prescribed_weight), 2)             as ortalama_sapma_kg
from public.set_logs
where prescribed_weight is not null
  and decision is not null
  and decision <> 'first-time'
group by decision
order by set_sayisi desc;


-- Genel uyum oranı (karar tablosundaki eşiklerle karşılaştırılacak sayı)
select
  count(*)                                           as toplam_set,
  count(*) filter (where weight = prescribed_weight) as uyulan,
  round(
    100.0 * count(*) filter (where weight = prescribed_weight) / nullif(count(*), 0), 1
  )                                                  as uyum_yuzdesi
from public.set_logs
where prescribed_weight is not null and decision <> 'first-time';


-- Tekrar hedefine uyum (ağırlıktan ayrı ölçülür)
select
  count(*)                                        as toplam_set,
  count(*) filter (where reps >= prescribed_reps) as hedefe_ulasan,
  round(
    100.0 * count(*) filter (where reps >= prescribed_reps) / nullif(count(*), 0), 1
  )                                               as yuzde
from public.set_logs
where prescribed_reps is not null;


-- Koç devreye girdiğinde ne oluyor? (en yüksek değerli an)
select
  adjustment_action                                  as eylem,
  count(*)                                           as set_sayisi,
  count(distinct adjustment_reason)                  as farkli_gerekce,
  count(*) filter (where weight = prescribed_weight) as uyulan
from public.set_logs
where adjustment_action is not null
group by adjustment_action;


-- ==========================================================================
-- 9. HUNİ — olay tablosundan çıkan dört sayı
-- ==========================================================================

-- 9a. KAYIT -> İLK TAMAMLANMIŞ ANTRENMAN
-- Eşik: %70 üzeri giriş akışı sağlam, altıysa sorun üründe değil ilk
-- 60 saniyede.
with kayit as (
  select distinct user_id from public.events where name = 'signup_completed'
),
rutin as (
  select distinct user_id from public.events where name = 'routine_created'
),
basladi as (
  select distinct user_id from public.events where name = 'workout_started'
),
bitirdi as (
  select distinct user_id from public.events where name = 'workout_completed'
)
select
  (select count(*) from kayit)     as kaydolan,
  (select count(*) from rutin)     as rutin_olusturan,
  (select count(*) from basladi)   as antrenman_baslatan,
  (select count(*) from bitirdi)   as antrenman_bitiren,
  round(100.0 * (select count(*) from bitirdi)
        / nullif((select count(*) from kayit), 0), 1) as kayit_to_antrenman_yuzde;


-- 9b. İLK ANTRENMANA KADAR GEÇEN SÜRE
-- 24 saati geçenler büyük ihtimalle hiç gelmez.
select
  round(extract(epoch from (ilk_antrenman - kayit)) / 3600, 1) as saat,
  count(*) as kullanici
from (
  select
    e.user_id,
    min(e.created_at) filter (where e.name = 'signup_completed')  as kayit,
    min(e.created_at) filter (where e.name = 'workout_completed') as ilk_antrenman
  from public.events e
  group by e.user_id
) t
where kayit is not null and ilk_antrenman is not null
group by 1
order by 1;


-- 9c. HAFTADA 2+ SEANS YAPAN KULLANICI — takip edilecek tek kuzey yıldızı
select
  date_trunc('week', created_at)::date as hafta,
  count(*) filter (where seans >= 2)   as haftada_2_artı_yapan,
  count(*)                             as aktif_kullanici
from (
  select user_id, date_trunc('week', created_at) as created_at, count(*) as seans
  from public.events
  where name = 'workout_completed'
  group by user_id, date_trunc('week', created_at)
) t
group by 1
order by 1 desc;


-- 9d. KOÇ AÇILMA SIKLIĞI (kullanıcı/hafta)
-- 1'in altındaysa koç tek başına satılmaz, pakete girer.
select
  date_trunc('week', created_at)::date                  as hafta,
  count(*) filter (where name = 'coach_opened')         as acilma,
  count(*) filter (where name = 'coach_message_sent')   as mesaj,
  count(distinct user_id)                               as kullanici,
  round(count(*) filter (where name = 'coach_opened')::numeric
        / nullif(count(distinct user_id), 0), 2)        as kullanici_basina_acilma
from public.events
where name in ('coach_opened', 'coach_message_sent')
group by 1
order by 1 desc;


-- 9e. SEANS İÇİ SÜRTÜNME: terk edilen / tamamlanan
select
  count(*) filter (where name = 'workout_completed') as tamamlanan,
  count(*) filter (where name = 'workout_abandoned') as terk_edilen,
  count(*) filter (where name = 'workout_resumed')   as devam_edilen
from public.events;


-- ==========================================================================
-- 10. ANKET (017)
-- ==========================================================================

-- 10a. Cevaplama oranı. Geçen çoksa anket fazla uzun ya da yanlış yerde.
select
  count(*) filter (where answered_at is not null)  as cevaplayan,
  count(*) filter (where dismissed_at is not null
                   and answered_at is null)        as gecen
from public.user_profiles;


-- 10b. HANGİ KANAL GERİ DÖNEN KULLANICI GETİRİYOR?
-- "30 kişiyi nereden bulacağım" sorusunun cevabı burada: kanal başına kaç
-- kişi geldi ve kaçı ikinci antrenmana döndü.
with seans as (
  select user_id, count(*) as tamamlanan
  from public.events
  where name = 'workout_completed'
  group by user_id
)
select
  p.source                                              as kanal,
  count(*)                                              as kisi,
  count(*) filter (where coalesce(s.tamamlanan, 0) >= 2) as ikinciye_donen
from public.user_profiles p
left join seans s using (user_id)
where p.answered_at is not null
group by p.source
order by kisi desc;


-- 10c. Hedef ve deneyim dağılımı. Motor yeni başlayanlar için mi,
-- deneyimliler için mi daha değerli? Tutma oranıyla birlikte oku.
select goal as hedef, experience as deneyim, count(*) as kisi
from public.user_profiles
where answered_at is not null
group by 1, 2
order by kisi desc;
