// ==========================================================================
// AYARLAMALAR (Adjustments)
//
// Kullanıcı niteliksel bir durum bildirdiğinde (ağrı, bitkinlik, kötü uyku)
// programın nasıl esneyeceğini tanımlar.
//
// TASARIM İLKESİ: AI eylem seçer, sayıyı kod hesaplar.
// Model "hafiflet" diyebilir ama "80 kg yap" diyemez. Ağırlık her zaman
// buradaki sabit oranla türetilir. Böylece halüsinasyon kaynaklı bir ağırlık
// sıçraması fiziksel olarak mümkün değil — sakatlık riski modele emanet edilmiyor.
//
// İkinci koruma: modelin önerdiği her egzersiz adı kullanıcının gerçek
// egzersizlerine, her ikame de katalogda AYNI kas grubundaki bir harekete
// karşılık gelmek zorunda. Eşleşmeyen öneri sessizce atılır.
// ==========================================================================

import { normalizeExerciseName, type Prescription } from "./progression.ts";
import {
  catalogResolver,
  type ExerciseResolver,
  type ExerciseType,
  type ExerciseUnit,
} from "./exercises.ts";

export type AdjustmentAction = "reduce_load" | "swap" | "skip";

export interface Adjustment {
  exerciseKey: string;
  exerciseName: string;
  action: AdjustmentAction;
  /** Yalnızca action === "swap" için doludur. */
  substituteName: string | null;
  reason: string;
  expiresAt: string;
}

/** Hafifletme oranı. Modelin değil, kodun kararı. */
export const REDUCE_LOAD_FACTOR = 0.8;

/** Bir ayarlama kaç gün sonra kendiliğinden düşer. */
export const ADJUSTMENT_TTL_DAYS = 14;

/** Modelden gelen ham öneri; hiçbir alanına güvenilmez. */
export interface RawAdjustment {
  exercise?: unknown;
  action?: unknown;
  substitute?: unknown;
  reason?: unknown;
}

const VALID_ACTIONS: AdjustmentAction[] = ["reduce_load", "swap", "skip"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Modelin önerilerini kullanıcının gerçek egzersizlerine karşı doğrular.
 * Doğrulanamayan her öneri atılır — model uydurmuş olabilir.
 *
 * @param userExercises Kullanıcının rutinlerinde fiilen geçen egzersiz adları.
 * @param resolve Katalog + kullanıcı hareketlerini çözen işlev. Enjekte
 *   edilir ki bu modül saf ve test edilebilir kalsın.
 */
export function validateAdjustments(
  raw: RawAdjustment[],
  userExercises: string[],
  resolve: ExerciseResolver = catalogResolver,
  now: Date = new Date()
): Adjustment[] {
  const byKey = new Map(
    userExercises.map((name) => [normalizeExerciseName(name), name])
  );

  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + ADJUSTMENT_TTL_DAYS);

  const seen = new Set<string>();
  const result: Adjustment[] = [];

  for (const item of raw) {
    if (!isNonEmptyString(item.exercise) || !isNonEmptyString(item.reason)) continue;

    const key = normalizeExerciseName(item.exercise);
    const exerciseName = byKey.get(key);
    // Model kullanıcıda olmayan bir hareket uydurduysa at.
    if (!exerciseName) continue;
    // Aynı hareket için ilk öneri geçerli; tekrarları at.
    if (seen.has(key)) continue;

    const action = item.action as AdjustmentAction;
    if (!VALID_ACTIONS.includes(action)) continue;

    let substituteName: string | null = null;

    if (action === "swap") {
      if (!isNonEmptyString(item.substitute)) continue;

      const substitute = resolve(item.substitute);
      const original = resolve(exerciseName);

      // İkame katalogda olmalı ve aynı kas grubunu çalıştırmalı.
      // Aksi halde model "squat yerine biceps curl" diyebilir.
      if (!substitute || !original || substitute.group !== original.group) continue;
      if (normalizeExerciseName(substitute.name) === key) continue;

      substituteName = substitute.name;
    }

    seen.add(key);
    result.push({
      exerciseKey: key,
      exerciseName,
      action,
      substituteName,
      reason: item.reason.trim().slice(0, 300),
      expiresAt: expiresAt.toISOString(),
    });
  }

  return result;
}

export interface AdjustedPrescription extends Prescription {
  /** Bu egzersiz bugün atlanmalı mı? */
  skipped: boolean;
  /** Ayarlama nedeniyle değiştirilmiş egzersiz adı. */
  displayName: string;
  /** Uygulanan ayarlama; yoksa null. */
  adjustment: Adjustment | null;
}

/**
 * Bir reçeteye aktif ayarlamayı uygular.
 * Ağırlık hesabı burada, sabit oranla yapılır; ayarlamanın kendisinde sayı yoktur.
 */
export function applyAdjustment(
  exerciseName: string,
  prescription: Prescription,
  adjustment: Adjustment | null
): AdjustedPrescription {
  const base: AdjustedPrescription = {
    ...prescription,
    skipped: false,
    displayName: exerciseName,
    adjustment,
  };

  if (!adjustment) return base;

  switch (adjustment.action) {
    case "skip":
      return { ...base, skipped: true };

    case "swap":
      return {
        ...base,
        displayName: adjustment.substituteName ?? exerciseName,
        // İkame hareketin kendi geçmişi olmadığı için ağırlık önerilmiyor.
        weight: null,
        decision: "first-time",
        rationale: `${adjustment.reason} Bu hareketi ilk kez yapıyorsun; rahat ettiğin bir ağırlıkla başla.`,
      };

    case "reduce_load": {
      // 0 kg da "ağırlık yok" demek: azaltılacak yük yok. Bu kontrol
      // olmadan alt sınır (increment) devreye girip ağırlıksız harekete
      // 2.5 kg YÜKLÜYORDU — "hafiflet" diyen ayarlama yükü artırıyordu.
      if (prescription.weight == null || prescription.weight === 0) {
        return { ...base, rationale: `${adjustment.reason} Bugün hafif tut.` };
      }
      const reduced =
        Math.round((prescription.weight * REDUCE_LOAD_FACTOR) / 2.5) * 2.5;
      return {
        ...base,
        weight: Math.max(prescription.increment, reduced),
        decision: "deload",
        rationale: `${adjustment.reason} Bugün ${Math.max(prescription.increment, reduced)} kg ile çalış.`,
      };
    }
  }
}

/** Süresi dolmuş ayarlamaları eler. */
export function activeOnly(adjustments: Adjustment[], now: Date = new Date()): Adjustment[] {
  return adjustments.filter((a) => new Date(a.expiresAt).getTime() > now.getTime());
}

/** Antrenman ekranına gönderilen, ayarlaması uygulanmış plan satırı. */
export interface WorkoutPlanItem {
  exerciseId: string;
  /** Rutinde yazan özgün ad. */
  originalName: string;
  /** Fiilen yapılacak hareket (swap sonrası değişmiş olabilir). */
  performedName: string;
  targetSets: number;
  /** Tekrar aralığının uçları; arayüz hedefi bağlamıyla gösterebilsin diye. */
  minReps: number;
  maxReps: number;
  /**
   * Bileşik mi izolasyon mu. Dinlenme süresi buna göre belirleniyor:
   * bileşik hareketler daha uzun toparlanma gerektiriyor.
   */
  exerciseType: ExerciseType;
  /** Tekrarla mı süreyle mi ölçülüyor; arayüz etiketleri buna göre. */
  unit: ExerciseUnit;
  /** Ağırlıksız yapılabilen hareket: ağırlık alanı isteğe bağlı. */
  bodyweight: boolean;
  /**
   * Hareket katalogda ya da kullanıcının kendi kayıtlarında tanımlı mı?
   * Değilse artış adımı tahmine düşüyor ve AI ona ikame öneremiyor.
   */
  classified: boolean;
  prescription: AdjustedPrescription;
}
