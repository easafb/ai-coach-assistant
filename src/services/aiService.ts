"use server";

import { requireUser } from "@/lib/dal";
import type { ActionResult } from "@/types";

const MODEL = "gemini-2.5-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const FALLBACK =
  "Coach.ai şu an yanıt veremiyor. Formuna odaklan ve güvenli çalış — birazdan tekrar dene.";

interface CoachAdvice {
  advice: string;
}

export async function getCoachAdvice(
  feedback: string
): Promise<ActionResult<CoachAdvice>> {
  // Bu bir Server Action, yani public bir endpoint. Eski halinde hiç auth
  // kontrolü yoktu; oturumu olmayan biri Gemini kotasını sınırsız harcayabilirdi.
  await requireUser();

  const trimmed = feedback.trim();
  if (trimmed.length < 3) return { ok: false, error: "Lütfen durumunu biraz anlat." };
  if (trimmed.length > 1000) return { ok: false, error: "Mesaj çok uzun." };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY tanımlı değil.");
    return { ok: false, error: FALLBACK };
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        // Anahtarı URL yerine header'da yolluyoruz: URL'ler loglara ve
        // proxy kayıtlarına düşer, header'lar genelde düşmez.
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "Sen Coach.ai adlı profesyonel bir fitness asistanısın. " +
                "Türkçe, tek cümlelik, somut ve uygulanabilir tavsiye ver. " +
                "Tıbbi teşhis koyma; ciddi ağrı tarif edilirse kullanıcıyı bir " +
                "sağlık profesyoneline yönlendir.",
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: trimmed }] }],
        // Yapılandırılmış çıktı: modelin JSON döndüreceğini garantiliyor.
        // Eski koddaki ```json fence'lerini regex ile temizleme hack'i böylece gereksizleşiyor.
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { advice: { type: "STRING" } },
            required: ["advice"],
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 503) {
        return { ok: false, error: "Coach.ai şu an yoğun. Birkaç saniye sonra dene." };
      }
      // Sağlayıcı yanıtının tamamını loglamıyoruz; kullanıcı verisi içerebilir.
      console.error(`Gemini isteği başarısız: ${response.status}`);
      return { ok: false, error: FALLBACK };
    }

    const data = await response.json();
    const text: unknown =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") return { ok: false, error: FALLBACK };

    const parsed = JSON.parse(text) as Partial<CoachAdvice>;
    if (typeof parsed.advice !== "string" || !parsed.advice.trim()) {
      return { ok: false, error: FALLBACK };
    }

    return { ok: true, data: { advice: parsed.advice.trim() } };
  } catch (error) {
    console.error("Coach.ai servis hatası:", error instanceof Error ? error.message : error);
    return { ok: false, error: FALLBACK };
  }
}
