// ==========================================================================
// İLERLEME MOTORU (Çift İlerleme / Double Progression)
//
// Bilerek saf: veritabanı, ağ veya framework bağımlılığı yok. Ürünün
// satılabilir çekirdeği burası olduğu için karar mantığının test edilebilir
// ve denetlenebilir olması gerekiyor.
//
// ÇALIŞMA MANTIĞI — önce tekrar, sonra ağırlık:
//   Hedef bir tekrar ARALIĞIDIR (örn. 3 × 8-12).
//   Her seans aralığın üst ucuna doğru tekrar eklenmeye çalışılır.
//   Ancak TÜM setler üst uca ulaşınca ağırlık artar ve tekrar alt uca döner.
//
// Bu neden önemli: önceki sürüm tek bir hedef tekrar taşıyordu ve hedefi
// tutturan herkese HER SEANS ağırlık artırmasını söylüyordu. 10 kg'lık bir
// lateral raise'e 2.5 kg eklemek %25'lik bir sıçramadır — gerçekte o hareket
// aylarca aynı ağırlıkta kalıp tekrar ekleyerek ilerler. Aralık modelinde
// ilerlemenin yavaşlaması kendiliğinden ortaya çıkar; hiçbir eşik elle
// kodlanmaz.
//
// Ağırlık kararını kasten LLM'e vermiyoruz: maliyet, gecikme, tutarsızlık ve
// en önemlisi halüsinasyon kaynaklı ağırlık sıçramasının sakatlık riski.
// ==========================================================================

import type { ExerciseType } from "./exercises.ts";

export interface PerformedSet {
  weight: number;
  reps: number;
}

/** Tek bir egzersizin tek bir seanstaki performansı. */
export interface ExercisePerformance {
  sessionId: string;
  performedAt: string;
  sets: PerformedSet[];
}

export interface ExerciseTarget {
  name: string;
  targetSets: number;
  /** Tekrar aralığının alt ucu: ağırlık arttıktan sonra buradan başlanır. */
  minReps: number;
  /** Üst uç: tüm setler buraya ulaşınca ağırlık artar. */
  maxReps: number;
  /** Salonda yapılabilen en küçük artış. Katalogdan gelir. */
  minStep?: number;
  /** Bileşik hareketler izolasyonlardan hızlı ilerler. */
  type?: ExerciseType;
}

export type ProgressionDecision =
  | "first-time"
  | "add-weight"
  | "add-reps"
  | "repeat"
  | "deload";

export interface Prescription {
  /** null: bu egzersiz ilk kez yapılıyor, ağırlığı kullanıcı belirler. */
  weight: number | null;
  /** Bugün hedeflenecek tekrar sayısı. */
  reps: number;
  decision: ProgressionDecision;
  rationale: string;
  /** Bu ağırlıkta bir sonraki artışın miktarı (bilgi amaçlı). */
  increment: number;
}

/** Tekrar eklenemeyen kaç seanstan sonra deload uygulanır. */
const STALL_LIMIT = 3;

/** Deload oranı: çalışma ağırlığının %90'ı. */
const DELOAD_FACTOR = 0.9;

/**
 * Artış, mevcut yükün yüzdesi olarak hesaplanır.
 * Sabit bir kilo kullanmak hafif hareketlerde orantısız sıçramalara,
 * ağır hareketlerde gereksiz yavaşlığa yol açıyordu.
 */
const PERCENT_BY_TYPE: Record<ExerciseType, number> = {
  compound: 0.025,
  isolation: 0.02,
};

/** Türkçe karakterleri sadeleştirip karşılaştırmayı güvenli hale getirir. */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .trim();
}

/**
 * Egzersiz adlarını karşılaştırılabilir hale getirir: büyük/küçük harf, Türkçe
 * karakter ve fazladan boşluk farklarını siler.
 *
 * NOT: "Bench" ile "Bench Press" bunun kapsamı dışında — onun çözümü serbest
 * metin yerine egzersiz kataloğundan seçtirmek.
 */
export function normalizeExerciseName(text: string): string {
  return normalize(text).replace(/\s+/g, " ");
}

const LOWER_BODY_COMPOUND = [
  "squat", "deadlift", "leg press", "hip thrust", "lunge", "romanian", "rdl",
  "good morning", "bulgarian", "hack", "comelme", "olu kaldirma", "bacak pres",
  "kalca", "hamle",
];

/**
 * Katalogda bulunmayan hareketler için en küçük adım tahmini.
 * Alt vücut bileşikleri daha büyük plakalarla çalışılır.
 */
export function inferMinStep(exerciseName: string): number {
  const name = normalize(exerciseName);
  return LOWER_BODY_COMPOUND.some((k) => name.includes(k)) ? 5 : 2.5;
}

/** Verilen adıma yuvarlar; salondaki plakalar ondan ince değil. */
export function roundToStep(weight: number, step: number): number {
  return Math.round(weight / step) * step;
}

/**
 * Bu ağırlıkta eklenecek miktar.
 * Yüzdeye göre hesaplanır ama salonda yapılabilecek en küçük adımın altına
 * inemez — 10 kg'a %2 eklemek 0.2 kg eder ki böyle bir plaka yok.
 */
export function incrementFor(target: ExerciseTarget, currentWeight: number): number {
  const step = target.minStep ?? inferMinStep(target.name);
  const percent = PERCENT_BY_TYPE[target.type ?? "compound"];
  return Math.max(step, roundToStep(currentWeight * percent, step));
}

/** Bir seansta kullanılan çalışma ağırlığı: o seansın en ağır seti. */
function workingWeightOf(performance: ExercisePerformance): number {
  return performance.sets.reduce((max, set) => Math.max(max, set.weight), 0);
}

/** Çalışma ağırlığındaki setler (ısınmalar hariç). */
function workingSets(performance: ExercisePerformance): PerformedSet[] {
  const weight = workingWeightOf(performance);
  return performance.sets.filter((set) => set.weight >= weight);
}

/** En zayıf çalışma setinin tekrar sayısı. Aralık ilerlemesi buna bakar. */
function weakestSetReps(performance: ExercisePerformance): number {
  const sets = workingSets(performance);
  return sets.length === 0 ? 0 : Math.min(...sets.map((s) => s.reps));
}

/** Tüm hedef setler aralığın üst ucuna ulaştı mı? */
function reachedTopOfRange(
  performance: ExercisePerformance,
  target: ExerciseTarget
): boolean {
  const qualifying = workingSets(performance).filter((s) => s.reps >= target.maxReps);
  return qualifying.length >= target.targetSets;
}

/** Bu seansta en azından aralığın alt ucu tutturuldu mu? */
function reachedBottomOfRange(
  performance: ExercisePerformance,
  target: ExerciseTarget
): boolean {
  const qualifying = workingSets(performance).filter((s) => s.reps >= target.minReps);
  return qualifying.length >= target.targetSets;
}

const range = (t: ExerciseTarget) =>
  t.minReps === t.maxReps ? `${t.minReps}` : `${t.minReps}-${t.maxReps}`;

/**
 * Bir sonraki seans için reçete üretir.
 *
 * @param history En yeniden en eskiye sıralı geçmiş performanslar.
 */
export function prescribe(
  target: ExerciseTarget,
  history: ExercisePerformance[]
): Prescription {
  const withSets = history.filter((entry) => entry.sets.length > 0);

  if (withSets.length === 0) {
    return {
      weight: null,
      reps: target.minReps,
      decision: "first-time",
      rationale:
        `Bu egzersizi ilk kez yapıyorsun. ${target.targetSets} set × ${range(target)} ` +
        "tekrarı formunu bozmadan tamamlayabileceğin bir ağırlıkla başla.",
      increment: target.minStep ?? inferMinStep(target.name),
    };
  }

  const last = withSets[0];
  const workingWeight = workingWeightOf(last);
  const increment = incrementFor(target, workingWeight);

  // 1) Aralığın üst ucu tamamlandı: ağırlık artar, tekrar alt uca döner.
  if (reachedTopOfRange(last, target)) {
    const next = roundToStep(
      workingWeight + increment,
      target.minStep ?? inferMinStep(target.name)
    );
    return {
      weight: next,
      reps: target.minReps,
      decision: "add-weight",
      rationale:
        `${workingWeight} kg ile ${target.targetSets} × ${target.maxReps} tekrarı ` +
        `tamamladın — bugün ${next} kg, ${target.minReps} tekrardan başla.`,
      increment,
    };
  }

  const weakest = weakestSetReps(last);

  // 2) Alt uç tutturuldu ama üst uca ulaşılmadı: aynı ağırlıkta tekrar ekle.
  //    Lateral raise gibi hareketlerin aylarca kaldığı yer burası, ve olması
  //    gereken de bu.
  if (reachedBottomOfRange(last, target)) {
    const nextReps = Math.min(weakest + 1, target.maxReps);
    return {
      weight: workingWeight,
      reps: nextReps,
      decision: "add-reps",
      rationale:
        `${workingWeight} kg'da en zayıf setin ${weakest} tekrardı. ` +
        `Bugün aynı ağırlıkta ${nextReps} tekrarı hedefle; ` +
        `tüm setler ${target.maxReps}'e ulaşınca ağırlık artacak.`,
      increment,
    };
  }

  // 3) Alt uç bile tutturulamadı. Üst üste kaç seans böyle gitti?
  //    Takılma ölçüsü artık "ağırlık artmadı" değil "tekrar bile eklenemedi";
  //    bu çok daha güçlü bir sinyal ve kendi kendini kalibre ediyor.
  let stalled = 0;
  for (const entry of withSets) {
    if (workingWeightOf(entry) !== workingWeight) break;
    if (reachedBottomOfRange(entry, target)) break;
    stalled += 1;
  }

  const step = target.minStep ?? inferMinStep(target.name);

  if (stalled >= STALL_LIMIT) {
    const deloaded = Math.max(step, roundToStep(workingWeight * DELOAD_FACTOR, step));
    return {
      weight: deloaded,
      reps: target.minReps,
      decision: "deload",
      rationale:
        `${workingWeight} kg'da ${stalled} seans ${target.minReps} tekrara ulaşamadın. ` +
        `Bugün ${deloaded} kg'a inip ivmeyi geri kazanalım.`,
      increment,
    };
  }

  return {
    weight: workingWeight,
    reps: target.minReps,
    decision: "repeat",
    rationale:
      `Geçen sefer ${workingWeight} kg'da en zayıf setin ${weakest} tekrardı, ` +
      `hedef ${target.minReps}. Aynı ağırlıkta kalıp alt ucu tamamlamaya odaklan.`,
    increment,
  };
}
