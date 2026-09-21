// ==========================================================================
// HAZIR PROGRAM ŞABLONLARI
//
// Soğuk başlangıç sorununu çözerler: yeni kullanıcı boş bir panel yerine
// çalışmaya hazır bir program görür. Şablon seçilince kullanıcının kendi
// hesabına KOPYALANIR — sonrasında istediği gibi düzenler, sahibi odur.
//
// Egzersiz adları bilerek katalogdaki kanonik adlardır: geçmiş eşleşmesi ve
// artış adımı ilk günden doğru çalışsın diye.
//
// TEKRAR HEDEFLERİ hareket tipine göre kurulur:
//   Bileşik  -> sabit tekrar (minReps === maxReps). Hedefi tutturunca ağırlık
//               artar; programın omurgasında istenen his budur.
//   İzolasyon -> aralık. 10 kg'lık bir lateral raise'e 2.5 kg eklemek %25'lik
//               bir sıçramadır ve kimse bunu bir seansta yapamaz; bu hareketler
//               önce tekrar biriktirir, sonra mikro adımla ilerler.
// ==========================================================================

export interface TemplateExercise {
  name: string;
  sets: number;
  /** Tekrar aralığının alt ucu. */
  minReps: number;
  /** Üst uç: tüm setler buraya ulaşınca ağırlık artar. */
  maxReps: number;
}

export interface TemplateRoutine {
  name: string;
  exercises: TemplateExercise[];
}

export interface RoutineTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  routines: TemplateRoutine[];
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: "ppl",
    title: "Push / Pull / Legs",
    subtitle: "Haftada 3-6 gün · Orta seviye",
    description:
      "İtiş, çekiş ve bacak günlerine ayrılmış klasik bölünme. Haftada üç gün yaparsan her kas grubuna haftada bir, altı gün yaparsan ikişer kez denk gelir.",
    routines: [
      {
        name: "Push",
        exercises: [
          { name: "Bench Press", sets: 4, minReps: 6, maxReps: 6 },
          { name: "Overhead Press", sets: 3, minReps: 8, maxReps: 8 },
          { name: "Incline Dumbbell Press", sets: 3, minReps: 10, maxReps: 10 },
          { name: "Lateral Raise", sets: 3, minReps: 12, maxReps: 16 },
          { name: "Triceps Pushdown", sets: 3, minReps: 12, maxReps: 16 },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { name: "Deadlift", sets: 3, minReps: 5, maxReps: 5 },
          { name: "Pull Up", sets: 4, minReps: 8, maxReps: 8 },
          { name: "Barbell Row", sets: 3, minReps: 8, maxReps: 8 },
          { name: "Face Pull", sets: 3, minReps: 15, maxReps: 19 },
          { name: "Barbell Curl", sets: 3, minReps: 10, maxReps: 14 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { name: "Back Squat", sets: 4, minReps: 6, maxReps: 6 },
          { name: "Romanian Deadlift", sets: 3, minReps: 8, maxReps: 8 },
          { name: "Leg Press", sets: 3, minReps: 10, maxReps: 10 },
          { name: "Leg Curl", sets: 3, minReps: 12, maxReps: 16 },
          { name: "Calf Raise", sets: 4, minReps: 15, maxReps: 19 },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    title: "Upper / Lower",
    subtitle: "Haftada 4 gün · Orta seviye",
    description:
      "Üst ve alt vücut olarak ikiye ayrılır. Haftada dört gün çalışıp her kas grubunu iki kez uyarmak isteyenler için en verimli bölünme.",
    routines: [
      {
        name: "Upper",
        exercises: [
          { name: "Bench Press", sets: 4, minReps: 6, maxReps: 6 },
          { name: "Barbell Row", sets: 4, minReps: 8, maxReps: 8 },
          { name: "Overhead Press", sets: 3, minReps: 8, maxReps: 8 },
          { name: "Lat Pulldown", sets: 3, minReps: 10, maxReps: 10 },
          { name: "Dumbbell Curl", sets: 3, minReps: 12, maxReps: 16 },
          { name: "Triceps Pushdown", sets: 3, minReps: 12, maxReps: 16 },
        ],
      },
      {
        name: "Lower",
        exercises: [
          { name: "Back Squat", sets: 4, minReps: 6, maxReps: 6 },
          { name: "Romanian Deadlift", sets: 3, minReps: 8, maxReps: 8 },
          { name: "Bulgarian Split Squat", sets: 3, minReps: 10, maxReps: 10 },
          { name: "Leg Curl", sets: 3, minReps: 12, maxReps: 16 },
          { name: "Calf Raise", sets: 4, minReps: 15, maxReps: 19 },
        ],
      },
    ],
  },
  {
    id: "full-body",
    title: "Full Body",
    subtitle: "Haftada 3 gün · Yeni başlayan",
    description:
      "Her antrenmanda tüm vücut. Yeni başlayanlar için en hızlı ilerlemeyi veren yapı; hareketler az, tekrar sıklığı yüksek.",
    routines: [
      {
        name: "Full Body A",
        exercises: [
          { name: "Back Squat", sets: 3, minReps: 5, maxReps: 5 },
          { name: "Bench Press", sets: 3, minReps: 5, maxReps: 5 },
          { name: "Barbell Row", sets: 3, minReps: 8, maxReps: 8 },
          { name: "Plank", sets: 3, minReps: 1, maxReps: 5 },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          { name: "Deadlift", sets: 3, minReps: 5, maxReps: 5 },
          { name: "Overhead Press", sets: 3, minReps: 5, maxReps: 5 },
          { name: "Lat Pulldown", sets: 3, minReps: 10, maxReps: 10 },
          { name: "Leg Press", sets: 3, minReps: 10, maxReps: 10 },
        ],
      },
    ],
  },
];

export function findTemplate(id: string): RoutineTemplate | undefined {
  return ROUTINE_TEMPLATES.find((template) => template.id === id);
}
