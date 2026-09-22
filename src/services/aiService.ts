"use server";

import { requireUser } from "@/lib/dal";
import { getConsent, isConsentValid } from "@/lib/consent";
import { track } from "@/lib/events";
import { checkAiRateLimit, recordAiRequest } from "@/lib/rateLimit";
import {
  getUserExerciseNames,
  getExerciseResolver,
  getTrainingSummary,
} from "@/lib/queries";
import { validateAdjustments, type Adjustment, type RawAdjustment } from "@/lib/adjustments";
import { EXERCISE_CATALOG } from "@/lib/exercises";
import type { ActionResult } from "@/types";

const MODEL = "gemini-2.5-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const FALLBACK = "Coach.ai şu an yanıt veremiyor. Birazdan tekrar dene.";

export interface CoachPlan {
  summary: string;
  adjustments: Adjustment[];
  seekMedicalAttention: boolean;
}

const SYSTEM_INSTRUCTION = `Sen Coach.ai adlı profesyonel bir fitness asistanısın.

Kullanıcı sana iki türlü mesaj yazabilir; hangisi olduğunu anlayıp ona göre
davran:

A) SORU — antrenmanı hakkında bilgi istiyor.
   "Bu hafta ne kadar kaldırdım?", "Bench'te en iyim kaç?", "Kaç gün gittim?"
   Bu durumda sana verilen ANTRENMAN ÖZETİ'ni kullanarak "summary" alanında
   cevap ver ve "adjustments" alanını BOŞ bırak. Programını değiştirme.

B) DURUM BİLDİRİMİ — nasıl hissettiğini anlatıyor.
   Ağrı, bitkinlik, kötü uyku, sakatlık. Bu durumda programında hangi
   hareketlerin değişmesi gerektiğine karar ver.

Mesaj ikisini birden içerebilir; o zaman ikisini de yap.

SAYILAR
- Yalnızca sana verilen ANTRENMAN ÖZETİ'ndeki rakamları kullan.
- YALNIZCA sorulan şeyi cevapla. Sorulmayan istatistiği kendiliğinden ekleme.
  Kullanıcı "bu hafta kaç antrenman yaptım?" diye sorduysa sadece antrenman
  sayısını söyle; hacim, rekor veya başka hareketleri anlatma.
- Kullanıcı sadece bir durum bildiriyorsa (soru sormuyorsa) hiç istatistik
  verme; doğrudan ne değiştirdiğini anlat.
- ASLA hesap yapma, tahmin etme, rakam uydurma. Özet'te olmayan bir bilgi
  sorulursa "Bu bilgi elimde yok" de.
- Kullanıcının hiç antrenman verisi yoksa bunu açıkça söyle.

HAREKET SEÇİMİ (yalnızca B durumunda)
- Yalnızca sana verilen egzersiz listesindeki hareketleri kullan. Listede
  olmayan bir hareket adı uydurma.
- Her hareket için üç eylemden birini seç:
  * "reduce_load" — hareket yapılabilir ama yük hafifletilmeli
  * "swap" — hareket ağrıyı tetikliyor, aynı kas grubundan başka bir
    hareketle değiştirilmeli
  * "skip" — bu hareket bugün hiç yapılmamalı
- "swap" seçersen "substitute" alanına sana verilen katalogdan AYNI kas
  grubundaki bir hareket yaz.
- ASLA ağırlık, kilo, set veya tekrar sayısı ÖNERME. Bunları sistem hesaplar.
  (Geçmiş verisini aktarırken rakam söyleyebilirsin; yasak olan yeni hedef
  belirlemek.)
- Sadece gerçekten etkilenen hareketleri listele. Boş liste döndürmek
  tamamen geçerli bir yanıttır.

DİL
- Kullanıcıya daima SEN diye hitap et. "siz", "yapmalısınız" kullanma.
- "reason" alanını kullanıcıya hitaben, tek cümle ve en fazla 20 kelime yaz.
- "reason" alanını kullanıcının ağzından yazma. "Omzumda ağrı var" YANLIŞ,
  "Omzundaki ağrı geçene kadar" DOĞRU.
- "summary" alanı Türkçe ve EN FAZLA İKİ CÜMLE olmalı. Soru tek ise tek
  cümleyle cevapla. Kısa tut; dolgu cümlesi ekleme.

TIBBİ UYARI
- Tıbbi teşhis koyma.
- "seekMedicalAttention" değerini YALNIZCA şu belirtilerde true yap:
  uyuşma veya karıncalanma, kola/bacağa yayılan ağrı, gözle görülür şişlik,
  eklemde kilitlenme veya boşalma hissi, düşme/çarpma gibi bir travma,
  ya da iki haftadan uzun süren geçmeyen ağrı.
- Ağırlık çalışanlarda kas ağrısı, tutulma, geçici keskin ağrı ve yorgunluk
  OLAĞANDIR. Bunlar tek başına true yapmak için yeterli DEĞİLDİR. Gereksiz
  uyarı, gerçek uyarının ciddiye alınmamasına yol açar.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    seekMedicalAttention: { type: "BOOLEAN" },
    adjustments: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          exercise: { type: "STRING" },
          action: { type: "STRING", enum: ["reduce_load", "swap", "skip"] },
          substitute: { type: "STRING" },
          reason: { type: "STRING" },
        },
        required: ["exercise", "action", "reason"],
      },
    },
  },
  required: ["summary", "adjustments", "seekMedicalAttention"],
} as const;

/**
 * Kullanıcının bildirdiği duruma göre programda yapılacak ayarlamaları üretir.
 *
 * Modelin çıktısına güvenilmez: dönen her öneri kullanıcının gerçek
 * egzersizlerine ve katalog kas gruplarına karşı doğrulanır
 * (lib/adjustments.validateAdjustments). Model sayı üretemez; hafifletme
 * oranı kodda sabittir.
 */
export async function requestCoachPlan(
  feedback: string
): Promise<ActionResult<CoachPlan>> {
  // Bu bir Server Action, yani public endpoint. Auth kontrolü zorunlu.
  const user = await requireUser();

  // KVKK md. 6: kullanıcının yazdığı ağrı/sakatlık bildirimi özel nitelikli
  // kişisel veri. Açık rıza yoksa işlenemez — bu, sayfa yönlendirmesine
  // güvenilecek bir şey değil, uç noktanın kendisinde durdurulmalı.
  const consent = await getConsent(user.id);
  if (!isConsentValid(consent)) {
    return {
      ok: false,
      error: "Koç özelliğini kullanmak için açık rıza onayı vermen gerekiyor.",
    };
  }

  // Limit sağlayıcıya gitmeden önce kontrol ediliyor: reddedilen istek
  // hiçbir maliyet üretmemeli.
  const limit = await checkAiRateLimit(user.id);
  if (!limit.allowed) {
    return {
      ok: false,
      error:
        limit.reason === "user"
          ? "Bugünlük koç hakkın doldu. Yarın tekrar deneyebilirsin."
          : "Coach.ai şu an çok yoğun. Lütfen daha sonra tekrar dene.",
    };
  }

  const trimmed = feedback.trim();
  if (trimmed.length < 10) {
    return { ok: false, error: "Durumunu biraz daha ayrıntılı anlat." };
  }
  if (trimmed.length > 1000) {
    return { ok: false, error: "Mesaj çok uzun." };
  }

  await track("coach_message_sent", { length: trimmed.length });

  const [userExercises, resolve, summary] = await Promise.all([
    getUserExerciseNames(),
    getExerciseResolver(),
    getTrainingSummary(),
  ]);
  if (userExercises.length === 0) {
    return {
      ok: false,
      error: "Önce bir rutin oluştur; ayarlama yapabilmem için programını görmem gerekiyor.",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY tanımlı değil.");
    return { ok: false, error: FALLBACK };
  }

  // Katalogdan yalnızca kullanıcının FİİLEN çalıştığı kas gruplarını
  // gönderiyoruz. Tam katalog (114 hareket) prompt'un en büyük parçasıydı;
  // model zaten yalnızca aynı gruptan ikame önerebildiği için diğer
  // grupları göndermenin faydası yok.
  const usedGroups = new Set(
    userExercises.map((name) => resolve(name)?.group).filter(Boolean)
  );
  const catalogByGroup = EXERCISE_CATALOG.reduce<Record<string, string[]>>(
    (acc, exercise) => {
      if (!usedGroups.has(exercise.group)) return acc;
      (acc[exercise.group] ??= []).push(exercise.name);
      return acc;
    },
    {}
  );

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  // Kas grubunu da veriyoruz: model hangi hareketin neyi
                  // çalıştırdığını bilmeden isabetli ikame öneremiyor.
                  `Kullanıcının programındaki hareketler: ${userExercises
                    .map((name) => {
                      const group = resolve(name)?.group;
                      return group ? `${name} (${group})` : `${name} (sınıflandırılmamış)`;
                    })
                    .join(", ")}`,
                  "",
                  `İkame seçebileceğin katalog (kas grubuna göre): ${JSON.stringify(catalogByGroup)}`,
                  "",
                  "ANTRENMAN ÖZETİ (yalnızca bu rakamları kullan):",
                  JSON.stringify({
                    buHafta: {
                      antrenmanSayisi: summary.thisWeek.sessions,
                      toplamHacimKg: summary.thisWeek.volume,
                    },
                    gecenHafta: {
                      antrenmanSayisi: summary.lastWeek.sessions,
                      toplamHacimKg: summary.lastWeek.volume,
                    },
                    kayitliToplamAntrenman: summary.totalSessions,
                    hareketler: summary.exercises.map((e) => ({
                      ad: e.name,
                      sonCalismaAgirligiKg: e.lastWeight,
                      enIyiAgirlikKg: e.bestWeight,
                      kacSeansYapildi: e.sessionCount,
                      sonYapilma: e.lastPerformed.slice(0, 10),
                    })),
                  }),
                  "",
                  `Kullanıcının mesajı: "${trimmed}"`,
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.4,
          // Şema zaten kısa bir yanıt dayatıyor; bu, beklenmedik bir
          // uzun üretimde maliyeti sınırlayan ikinci tavan.
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        return { ok: false, error: "Coach.ai şu an yoğun. Birkaç saniye sonra dene." };
      }
      console.error(`Gemini isteği başarısız: ${response.status}`);
      return { ok: false, error: FALLBACK };
    }

    const data = await response.json();

    // Maliyet takibi ve limit sayımı. Başarısız olursa isteği bozmuyoruz.
    await recordAiRequest(user.id, {
      promptTokens: data?.usageMetadata?.promptTokenCount,
      outputTokens: data?.usageMetadata?.candidatesTokenCount,
    });

    const text: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") return { ok: false, error: FALLBACK };

    const parsed = JSON.parse(text) as {
      summary?: unknown;
      adjustments?: unknown;
      seekMedicalAttention?: unknown;
    };

    const rawAdjustments: RawAdjustment[] = Array.isArray(parsed.adjustments)
      ? (parsed.adjustments as RawAdjustment[])
      : [];

    return {
      ok: true,
      data: {
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim().slice(0, 400)
            : "Programını gözden geçirdim.",
        adjustments: validateAdjustments(rawAdjustments, userExercises, resolve),
        seekMedicalAttention: parsed.seekMedicalAttention === true,
      },
    };
  } catch (error) {
    console.error(
      "Coach.ai servis hatası:",
      error instanceof Error ? error.message : error
    );
    return { ok: false, error: FALLBACK };
  }
}
