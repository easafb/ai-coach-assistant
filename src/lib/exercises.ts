// ==========================================================================
// EGZERSİZ KATALOĞU
//
// Serbest metin girişi geçmiş eşleşmesini bozuyordu: "Bench", "Bench Press" ve
// "bench press" üç ayrı hareket gibi davranıyordu. Normalizasyon harf/karakter
// farkını çözer ama kısaltmayı çözemez; asıl çözüm kullanıcıya kanonik bir ad
// seçtirmek.
//
// Katalog ayrıca artış adımını tahminden kesin bilgiye çeviriyor: ada bakıp
// "alt vücut mu?" diye çıkarım yapmak yerine burada yazıyor.
// ==========================================================================

// Göreli import: bu modül Node'un test runner'ından da yükleniyor ve
// Node tsconfig yol takma adlarını (@/) çözmüyor.
import { normalizeExerciseName } from "./progression.ts";

export type MuscleGroup =
  | "göğüs"
  | "sırt"
  | "omuz"
  | "kol"
  | "bacak"
  | "karın";

/**
 * Hareket tipi. İzolasyon hareketleri bileşiklerden belirgin şekilde yavaş
 * ilerler; motor artış oranını buna göre ayarlıyor.
 */
export type ExerciseType = "compound" | "isolation";

export interface CatalogExercise {
  /** Kanonik ad — veritabanına bu yazılır. */
  name: string;
  group: MuscleGroup;
  type: ExerciseType;
  /**
   * Salonda fiilen yapılabilen en küçük ağırlık artışı.
   * Barbell hareketlerde 2.5 kg (iki yana 1.25'er), hafif izolasyonlarda
   * mikro plaka veya küçük dambıllarla 1.25 kg mümkün.
   *
   * Bu alan olmadan 10 kg'lık lateral raise'e 2.5 kg eklemek zorunda
   * kalıyorduk — %25'lik bir sıçrama.
   */
  minStep: 1.25 | 2.5 | 5;
  /** Arama terimleri: İngilizce karşılıklar, kısaltmalar, yaygın yazımlar. */
  aliases: string[];
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // ---------------------------------------------------------------- göğüs
  { name: "Bench Press", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["bench", "göğüs presi", "bp", "flat bench"] },
  { name: "Incline Bench Press", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["incline bench", "eğimli bench", "üst göğüs"] },
  { name: "Decline Bench Press", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["decline bench", "alt göğüs"] },
  { name: "Dumbbell Bench Press", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["db bench", "dumbell press", "halter bench"] },
  { name: "Incline Dumbbell Press", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["incline db", "eğimli dumbbell"] },
  { name: "Chest Fly", group: "göğüs", type: "isolation", minStep: 1.25, aliases: ["fly", "pec deck", "kelebek", "göğüs açış"] },
  { name: "Cable Crossover", group: "göğüs", type: "isolation", minStep: 1.25, aliases: ["crossover", "kablo çapraz"] },
  { name: "Push Up", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["şınav", "pushup"] },
  { name: "Dips", group: "göğüs", type: "compound", minStep: 2.5, aliases: ["paralel bar", "dip"] },

  // ------------------------------------------------------------------ sırt
  { name: "Deadlift", group: "sırt", type: "compound", minStep: 5, aliases: ["ölü kaldırma", "dl", "konvansiyonel deadlift"] },
  { name: "Romanian Deadlift", group: "sırt", type: "compound", minStep: 2.5, aliases: ["rdl", "romanian", "romen deadlift"] },
  { name: "Barbell Row", group: "sırt", type: "compound", minStep: 2.5, aliases: ["bent over row", "barfiks row", "kürek", "row"] },
  { name: "Pendlay Row", group: "sırt", type: "compound", minStep: 2.5, aliases: ["pendlay"] },
  { name: "Dumbbell Row", group: "sırt", type: "compound", minStep: 2.5, aliases: ["db row", "tek kol kürek"] },
  { name: "Pull Up", group: "sırt", type: "compound", minStep: 2.5, aliases: ["barfiks", "pullup", "çekme"] },
  { name: "Chin Up", group: "sırt", type: "compound", minStep: 2.5, aliases: ["chinup", "ters barfiks"] },
  { name: "Lat Pulldown", group: "sırt", type: "compound", minStep: 2.5, aliases: ["pulldown", "lat çekiş", "önden çekiş"] },
  { name: "Seated Cable Row", group: "sırt", type: "compound", minStep: 2.5, aliases: ["cable row", "oturarak kürek"] },
  { name: "T-Bar Row", group: "sırt", type: "compound", minStep: 2.5, aliases: ["tbar", "t bar"] },
  { name: "Face Pull", group: "sırt", type: "isolation", minStep: 1.25, aliases: ["facepull", "yüz çekiş"] },
  { name: "Shrug", group: "sırt", type: "isolation", minStep: 1.25, aliases: ["trapez", "omuz silkme"] },

  // ------------------------------------------------------------------ omuz
  { name: "Overhead Press", group: "omuz", type: "compound", minStep: 2.5, aliases: ["ohp", "military press", "askeri pres", "omuz presi"] },
  { name: "Dumbbell Shoulder Press", group: "omuz", type: "compound", minStep: 2.5, aliases: ["db omuz", "dumbbell omuz presi"] },
  { name: "Arnold Press", group: "omuz", type: "compound", minStep: 2.5, aliases: ["arnold"] },
  { name: "Lateral Raise", group: "omuz", type: "isolation", minStep: 1.25, aliases: ["yan omuz", "side raise", "lateral"] },
  { name: "Front Raise", group: "omuz", type: "isolation", minStep: 1.25, aliases: ["ön omuz"] },
  { name: "Rear Delt Fly", group: "omuz", type: "isolation", minStep: 1.25, aliases: ["arka omuz", "reverse fly", "rear delt"] },
  { name: "Upright Row", group: "omuz", type: "compound", minStep: 2.5, aliases: ["dik kürek"] },

  // ------------------------------------------------------------------- kol
  { name: "Barbell Curl", group: "kol", type: "isolation", minStep: 1.25, aliases: ["biceps curl", "bar curl", "biseps"] },
  { name: "Dumbbell Curl", group: "kol", type: "isolation", minStep: 1.25, aliases: ["db curl", "halter curl"] },
  { name: "Hammer Curl", group: "kol", type: "isolation", minStep: 1.25, aliases: ["hammer", "çekiç curl"] },
  { name: "Preacher Curl", group: "kol", type: "isolation", minStep: 1.25, aliases: ["scott curl", "preacher"] },
  { name: "Cable Curl", group: "kol", type: "isolation", minStep: 1.25, aliases: ["kablo curl"] },
  { name: "Triceps Pushdown", group: "kol", type: "isolation", minStep: 1.25, aliases: ["pushdown", "triceps itiş", "triseps"] },
  { name: "Skull Crusher", group: "kol", type: "isolation", minStep: 1.25, aliases: ["skullcrusher", "lying triceps extension"] },
  { name: "Overhead Triceps Extension", group: "kol", type: "isolation", minStep: 1.25, aliases: ["triceps extension", "ense arkası triceps"] },
  { name: "Close Grip Bench Press", group: "kol", type: "compound", minStep: 2.5, aliases: ["close grip", "dar tutuş bench"] },

  // ----------------------------------------------------------------- bacak
  { name: "Back Squat", group: "bacak", type: "compound", minStep: 5, aliases: ["squat", "çömelme", "arka squat"] },
  { name: "Front Squat", group: "bacak", type: "compound", minStep: 2.5, aliases: ["ön squat", "front"] },
  { name: "Leg Press", group: "bacak", type: "compound", minStep: 5, aliases: ["bacak pres", "legpress"] },
  { name: "Hack Squat", group: "bacak", type: "compound", minStep: 5, aliases: ["hack"] },
  { name: "Bulgarian Split Squat", group: "bacak", type: "compound", minStep: 2.5, aliases: ["bulgarian", "split squat", "bulgar"] },
  { name: "Lunge", group: "bacak", type: "compound", minStep: 2.5, aliases: ["hamle", "walking lunge", "yürüyen hamle"] },
  { name: "Hip Thrust", group: "bacak", type: "compound", minStep: 2.5, aliases: ["kalça thrust", "hipthrust", "kalça itiş"] },
  { name: "Leg Curl", group: "bacak", type: "isolation", minStep: 1.25, aliases: ["hamstring curl", "arka bacak"] },
  { name: "Leg Extension", group: "bacak", type: "isolation", minStep: 1.25, aliases: ["ön bacak", "extension"] },
  { name: "Calf Raise", group: "bacak", type: "isolation", minStep: 1.25, aliases: ["baldır", "calf"] },
  { name: "Good Morning", group: "bacak", type: "compound", minStep: 2.5, aliases: ["goodmorning"] },

  // ----------------------------------------------------------------- karın
  { name: "Plank", group: "karın", type: "isolation", minStep: 2.5, aliases: ["plank", "tahta"] },
  { name: "Hanging Leg Raise", group: "karın", type: "isolation", minStep: 2.5, aliases: ["leg raise", "bacak kaldırma"] },
  { name: "Cable Crunch", group: "karın", type: "isolation", minStep: 1.25, aliases: ["crunch", "mekik"] },
  { name: "Ab Wheel", group: "karın", type: "isolation", minStep: 2.5, aliases: ["ab roller", "karın tekeri"] },
];

/** Normalize edilmiş kanonik ad -> katalog kaydı. */
const BY_NAME = new Map(
  EXERCISE_CATALOG.map((exercise) => [normalizeExerciseName(exercise.name), exercise])
);

/** Normalize edilmiş takma ad -> katalog kaydı. */
const BY_ALIAS = new Map<string, CatalogExercise>();
for (const exercise of EXERCISE_CATALOG) {
  for (const alias of exercise.aliases) {
    BY_ALIAS.set(normalizeExerciseName(alias), exercise);
  }
}

/** Bir egzersiz adını katalogda arar; kanonik ad veya takma ad üzerinden eşleşir. */
export function findExercise(name: string): CatalogExercise | undefined {
  const key = normalizeExerciseName(name);
  return BY_NAME.get(key) ?? BY_ALIAS.get(key);
}

/**
 * En küçük artış adımı: katalogda varsa oradan, yoksa çağıran taraf ada bakıp
 * tahmin yapar (progression.inferMinStep).
 */
export function catalogMinStep(name: string): number | undefined {
  return findExercise(name)?.minStep;
}

// ==========================================================================
// ÇÖZÜMLEYİCİ (Resolver)
//
// Kullanıcının kendi eklediği hareketler katalogdakilerle eşit davranmalı:
// doğru artış adımı, AI ikamesi, analitik. Ama bu kullanıcıya özel veri ve
// onu doğrudan saf modüllere sızdırmak istemiyoruz.
//
// Çözüm: arama işlevini dışarıdan enjekte ediyoruz. Sunucu, katalog ile
// kullanıcının kayıtlarını birleştirip bir resolver kuruyor; adjustments.ts
// ve progression.ts saf kalmaya devam ediyor.
// ==========================================================================

/** Hem katalog hem kullanıcı hareketleri için ortak biçim. */
export interface ResolvedExercise {
  name: string;
  group: MuscleGroup;
  type: ExerciseType;
  /** Salonda yapılabilen en küçük artış. Motor bunun altına inemez. */
  minStep: number;
  /** Kullanıcının kendi eklediği bir hareket mi? */
  custom: boolean;
}

export type ExerciseResolver = (name: string) => ResolvedExercise | undefined;

export interface CustomExercise {
  exerciseKey: string;
  name: string;
  group: MuscleGroup;
  type: ExerciseType;
  minStep: number;
}

/** Yalnızca katalogdan çözümler. Kullanıcı verisi olmayan yerlerde varsayılan. */
export const catalogResolver: ExerciseResolver = (name) => {
  const found = findExercise(name);
  if (!found) return undefined;
  return {
    name: found.name,
    group: found.group,
    type: found.type,
    minStep: found.minStep,
    custom: false,
  };
};

/**
 * Katalog + kullanıcının kendi hareketleri.
 * Kullanıcı kaydı katalogla çakışırsa kullanıcınınki kazanır: kendi
 * sınıflandırmasını bilerek yapmıştır.
 */
export function createResolver(customs: CustomExercise[]): ExerciseResolver {
  const byKey = new Map(customs.map((c) => [c.exerciseKey, c]));

  return (name) => {
    const key = normalizeExerciseName(name);
    const custom = byKey.get(key);
    if (custom) {
      return {
        name: custom.name,
        group: custom.group,
        type: custom.type,
        minStep: custom.minStep,
        custom: true,
      };
    }
    return catalogResolver(name);
  };
}

/**
 * Otomatik tamamlama araması. Kanonik adda ve takma adlarda geçen her kaydı
 * döndürür; kanonik adın başında eşleşenler öne alınır.
 */
export function searchExercises(query: string, limit = 8): CatalogExercise[] {
  const key = normalizeExerciseName(query);
  if (!key) return EXERCISE_CATALOG.slice(0, limit);

  const scored: Array<{ exercise: CatalogExercise; score: number }> = [];

  for (const exercise of EXERCISE_CATALOG) {
    const canonical = normalizeExerciseName(exercise.name);
    let score = -1;

    if (canonical.startsWith(key)) score = 0;
    else if (canonical.includes(key)) score = 1;
    else if (exercise.aliases.some((a) => normalizeExerciseName(a).startsWith(key))) score = 2;
    else if (exercise.aliases.some((a) => normalizeExerciseName(a).includes(key))) score = 3;

    if (score >= 0) scored.push({ exercise, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.exercise.name.localeCompare(b.exercise.name, "tr"))
    .slice(0, limit)
    .map((entry) => entry.exercise);
}
