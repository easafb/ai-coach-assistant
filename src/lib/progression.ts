// ==========================================================================
// İLERLEME MOTORU (Çift İlerleme / Double Progression)
//
// Bilerek saf: veritabanı, ağ veya framework bağımlılığı yok. Ürünün
// satılabilir çekirdeği burası olduğu için karar mantığının test edilebilir
// ve denetlenebilir olması gerekiyor.
//
// Kural: hedef set × tekrarın hepsi tamamlandıysa ağırlık artar. Tamamlanmadıysa
// aynı ağırlık tekrarlanır. Aynı ağırlıkta üst üste STALL_LIMIT seans takılırsa
// deload uygulanır.
//
// Ağırlık kararını kasten LLM'e vermiyoruz: maliyet, gecikme, tutarsızlık ve
// en önemlisi halüsinasyon kaynaklı ağırlık sıçramasının sakatlık riski.
// LLM'in işi bu kararı anlatmak ve niteliksel durumları (ağrı, bitkinlik) ele almak.
// ==========================================================================

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
  targetReps: number;
  /**
   * Artış adımı. Katalogdan geliyorsa kesin bilgidir; verilmezse motor
   * egzersiz adından çıkarım yapar.
   */
  increment?: number;
}

export type ProgressionDecision = "first-time" | "progress" | "repeat" | "deload";

export interface Prescription {
  /** null: bu egzersiz ilk kez yapılıyor, ağırlığı kullanıcı belirler. */
  weight: number | null;
  reps: number;
  decision: ProgressionDecision;
  rationale: string;
  increment: number;
}

/** Aynı ağırlıkta kaç başarısız seanstan sonra deload uygulanacağı. */
const STALL_LIMIT = 3;

/** Deload oranı: çalışma ağırlığının %90'ı. */
const DELOAD_FACTOR = 0.9;

const LOWER_BODY_COMPOUND = [
  "squat",
  "deadlift",
  "leg press",
  "hip thrust",
  "lunge",
  "romanian",
  "rdl",
  "good morning",
  "bulgarian",
  "hack",
  "comelme",
  "olu kaldirma",
  "bacak pres",
  "kalca",
  "hamle",
];

/**
 * Egzersiz adlarını karşılaştırılabilir hale getirir: büyük/küçük harf, Türkçe
 * karakter ve fazladan boşluk farklarını siler. Kullanıcılar aynı hareketi
 * "Bench Press", "bench press", "BENCH PRESS" diye kaydedebiliyor; geçmiş
 * eşleşmesi bu yüzden ham metinle değil bu anahtarla yapılır.
 *
 * NOT: "Bench" ile "Bench Press" bunun kapsamı dışında — onun çözümü serbest
 * metin yerine egzersiz kataloğundan seçtirmek.
 */
export function normalizeExerciseName(text: string): string {
  return normalize(text).replace(/\s+/g, " ");
}

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
 * Artış adımını egzersiz adından çıkarır. Alt vücut bileşik hareketleri daha
 * hızlı ilerler; tanınmayan her hareket güvenli tarafta kalıp 2.5 kg alır.
 */
export function inferIncrement(exerciseName: string): number {
  const name = normalize(exerciseName);
  return LOWER_BODY_COMPOUND.some((keyword) => name.includes(keyword)) ? 5 : 2.5;
}

/** En yakın 2.5 kg'a yuvarlar; salondaki plakalar bundan daha ince değil. */
export function roundToPlate(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}

/** Bir seansta kullanılan çalışma ağırlığı: o seansın en ağır seti. */
function workingWeightOf(performance: ExercisePerformance): number {
  return performance.sets.reduce((max, set) => Math.max(max, set.weight), 0);
}

/** Hedef, o seansta tamamlandı mı? */
function metTarget(performance: ExercisePerformance, target: ExerciseTarget): boolean {
  const weight = workingWeightOf(performance);
  const qualifying = performance.sets.filter(
    (set) => set.weight >= weight && set.reps >= target.targetReps
  );
  return qualifying.length >= target.targetSets;
}

/**
 * Bir sonraki seans için reçete üretir.
 *
 * @param history En yeniden en eskiye sıralı geçmiş performanslar.
 */
export function prescribe(
  target: ExerciseTarget,
  history: ExercisePerformance[]
): Prescription {
  const increment = target.increment ?? inferIncrement(target.name);

  const withSets = history.filter((entry) => entry.sets.length > 0);

  if (withSets.length === 0) {
    return {
      weight: null,
      reps: target.targetReps,
      decision: "first-time",
      rationale:
        "Bu egzersizi ilk kez yapıyorsun. Formuna odaklanabileceğin bir ağırlıkla başla; bir sonraki seansta öneri getireceğiz.",
      increment,
    };
  }

  const last = withSets[0];
  const workingWeight = workingWeightOf(last);

  if (metTarget(last, target)) {
    const next = workingWeight + increment;
    return {
      weight: next,
      reps: target.targetReps,
      decision: "progress",
      rationale: `Geçen sefer ${workingWeight} kg ile ${target.targetSets} × ${target.targetReps} hedefini tamamladın — bugün ${next} kg.`,
      increment,
    };
  }

  // Aynı çalışma ağırlığında üst üste kaç seans hedefi tutturamadık?
  let stalled = 0;
  for (const entry of withSets) {
    if (workingWeightOf(entry) !== workingWeight || metTarget(entry, target)) break;
    stalled += 1;
  }

  if (stalled >= STALL_LIMIT) {
    const deloaded = Math.max(increment, roundToPlate(workingWeight * DELOAD_FACTOR));
    return {
      weight: deloaded,
      reps: target.targetReps,
      decision: "deload",
      rationale: `${workingWeight} kg'da ${stalled} seans takıldın. Bugün ${deloaded} kg'a inip ivmeyi geri kazanalım.`,
      increment,
    };
  }

  const bestReps = Math.max(...last.sets.map((set) => set.reps));
  return {
    weight: workingWeight,
    reps: target.targetReps,
    decision: "repeat",
    rationale: `Geçen sefer ${workingWeight} kg ile en iyi setin ${bestReps} tekrardı, hedef ${target.targetReps}. Aynı ağırlıkta kalıp hedefi tamamlamaya odaklan.`,
    increment,
  };
}
