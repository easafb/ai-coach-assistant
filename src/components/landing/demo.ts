import {
  prescribe,
  type ExercisePerformance,
  type ExerciseTarget,
  type Prescription,
} from "../../lib/progression.ts";

// Ana sayfadaki örnek kartlar elle yazılmıyor, gerçek motordan üretiliyor.
// Böylece sayfa, uygulamanın gerçekte söylemeyeceği bir şeyi vaat edemez;
// motorun kuralı ya da cümlesi değişirse ana sayfa da kendiliğinden değişir.

function sessions(weight: number, repsPerSession: number[][]): ExercisePerformance[] {
  return repsPerSession.map((reps, i) => ({
    sessionId: `demo-${i}`,
    performedAt: new Date(Date.UTC(2026, 0, 20 - i * 3)).toISOString(),
    sets: reps.map((r) => ({ weight, reps: r })),
  }));
}

const BENCH: ExerciseTarget = {
  name: "Bench Press",
  targetSets: 3,
  minReps: 8,
  maxReps: 8,
  minStep: 2.5,
  type: "compound",
};

const SQUAT: ExerciseTarget = {
  name: "Squat",
  targetSets: 3,
  minReps: 5,
  maxReps: 5,
  minStep: 2.5,
  type: "compound",
};

export interface DemoCard {
  exercise: string;
  prescription: Prescription;
}

/** Hedefi tutturan kullanıcı: ağırlık artar. */
export const progressDemo: DemoCard = {
  exercise: BENCH.name,
  prescription: prescribe(BENCH, sessions(60, [[8, 8, 8]])),
};

/** Üç seanstır takılan kullanıcı: ağırlık düşer. */
export const deloadDemo: DemoCard = {
  exercise: SQUAT.name,
  prescription: prescribe(
    SQUAT,
    sessions(100, [
      [4, 4, 3],
      [4, 4, 4],
      [4, 3, 3],
    ])
  ),
};
