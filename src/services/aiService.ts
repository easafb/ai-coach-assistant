"use server";

import { requireUser } from "@/lib/dal";
import { getUserExerciseNames } from "@/lib/queries";
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

Kullanıcı sana nasıl hissettiğini anlatır (ağrı, bitkinlik, uyku, stres).
Görevin, onun antrenman programında HANGİ HAREKETLERİN nasıl değişmesi
gerektiğine karar vermek.

HAREKET SEÇİMİ
- Yalnızca sana verilen egzersiz listesindeki hareketleri kullan. Listede
  olmayan bir hareket adı uydurma.
- Her hareket için üç eylemden birini seç:
  * "reduce_load" — hareket yapılabilir ama yük hafifletilmeli
  * "swap" — hareket ağrıyı tetikliyor, aynı kas grubundan başka bir
    hareketle değiştirilmeli
  * "skip" — bu hareket bugün hiç yapılmamalı
- "swap" seçersen "substitute" alanına sana verilen katalogdan AYNI kas
  grubundaki bir hareket yaz.
- ASLA ağırlık, kilo, set veya tekrar sayısı belirtme. Bunları sistem hesaplar.
- Sadece gerçekten etkilenen hareketleri listele. Şikayetle ilgisi olmayan
  hareketlere dokunma; boş liste döndürmek tamamen geçerli bir yanıttır.

DİL
- Kullanıcıya daima SEN diye hitap et. "siz", "yapmalısınız", "hissediyorsunuz"
  gibi ifadeler kullanma.
- "reason" alanını kullanıcıya hitaben, tek cümle ve en fazla 20 kelime yaz.
  Örnek: "Omzunu zorlamamak için bu hareketi bugün atlıyoruz."
- "reason" alanını kullanıcının ağzından yazma. "Omzumda ağrı var" YANLIŞ,
  "Omzundaki ağrı geçene kadar" DOĞRU.
- "summary" alanına Türkçe, en fazla iki cümlelik bir açıklama yaz.

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
  await requireUser();

  const trimmed = feedback.trim();
  if (trimmed.length < 10) {
    return { ok: false, error: "Durumunu biraz daha ayrıntılı anlat." };
  }
  if (trimmed.length > 1000) {
    return { ok: false, error: "Mesaj çok uzun." };
  }

  const userExercises = await getUserExerciseNames();
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

  // Katalogdan yalnızca kas grubu bilgisini veriyoruz: model ikameyi
  // doğru gruptan seçebilsin diye.
  const catalogByGroup = EXERCISE_CATALOG.reduce<Record<string, string[]>>(
    (acc, exercise) => {
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
                  `Kullanıcının programındaki hareketler: ${userExercises.join(", ")}`,
                  "",
                  `İkame seçebileceğin katalog (kas grubuna göre): ${JSON.stringify(catalogByGroup)}`,
                  "",
                  `Kullanıcının bildirdiği durum: "${trimmed}"`,
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.4,
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
        adjustments: validateAdjustments(rawAdjustments, userExercises),
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
