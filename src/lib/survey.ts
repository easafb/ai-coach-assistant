// ==========================================================================
// ANTRENMAN SONRASI ANKET
//
// Saf modül: seçenekler, etiketler ve doğrulama. Sunucu işlemi ve arayüz
// buradan okuyor; veritabanındaki CHECK kısıtlarıyla (017) aynı değerler.
//
// "Haftada kaç gün çalışıyorsun?" bilerek sorulmuyor: bunu zaten
// kayıtlardan ölçüyoruz. Ankete yalnızca ölçemediğimiz şeyler giriyor.
// ==========================================================================

export const GOALS = {
  muscle: "Kas kazanmak",
  strength: "Güçlenmek",
  fat_loss: "Yağ yakmak",
  fitness: "Formda kalmak",
} as const;

export const EXPERIENCES = {
  beginner: "6 aydan az",
  intermediate: "6 ay – 2 yıl",
  advanced: "2 yıldan fazla",
} as const;

export const SOURCES = {
  friend: "Bir arkadaşım",
  social: "Sosyal medya",
  search: "İnternet araması",
  other: "Diğer",
} as const;

export type Goal = keyof typeof GOALS;
export type Experience = keyof typeof EXPERIENCES;
export type Source = keyof typeof SOURCES;

export interface SurveyAnswers {
  goal: Goal;
  experience: Experience;
  source: Source;
}

function isKey<T extends object>(options: T, value: unknown): value is keyof T {
  return typeof value === "string" && Object.hasOwn(options, value);
}

/**
 * İstemciden gelen cevabı doğrular. Server action her dışarıdan çağrılabilen
 * bir uç nokta olduğu için tipler güvence değil; eksik ya da bilinmeyen bir
 * değer varsa null döner.
 */
export function parseSurvey(raw: unknown): SurveyAnswers | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { goal, experience, source } = raw as Record<string, unknown>;
  if (!isKey(GOALS, goal)) return null;
  if (!isKey(EXPERIENCES, experience)) return null;
  if (!isKey(SOURCES, source)) return null;
  return { goal, experience, source };
}
