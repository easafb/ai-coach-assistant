import { notFound } from "next/navigation";

import {
  getRoutineExercises,
  getExerciseHistory,
  getActiveAdjustments,
  getExerciseResolver,
  getOpenSession,
} from "@/lib/queries";
import { prescribe, normalizeExerciseName } from "@/lib/progression";
import { applyAdjustment, type WorkoutPlanItem } from "@/lib/adjustments";
import { requireConsent } from "@/lib/dal";
import ActiveWorkout from "@/components/workout/ActiveWorkout";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireConsent();
  const { id } = await params;

  const [exercises, history, adjustments, resolve, openSession] = await Promise.all([
    getRoutineExercises(id),
    getExerciseHistory(),
    getActiveAdjustments(),
    getExerciseResolver(),
    getOpenSession(id),
  ]);

  if (exercises.length === 0) notFound();

  // Plan sunucuda kuruluyor: motor deterministik kararı verir, ayarlama onu
  // esnetir. Ağırlık her iki adımda da koddan çıkar, modelden değil.
  const plan: WorkoutPlanItem[] = exercises.map((exercise) => {
    const key = normalizeExerciseName(exercise.exercise_name);

    const prescription = prescribe(
      {
        name: exercise.exercise_name,
        targetSets: exercise.default_sets,
        minReps: exercise.min_reps,
        maxReps: exercise.max_reps,
        // Katalogda veya kullanıcının kendi hareketlerinde varsa kesin bilgi;
        // yoksa motor addan çıkarım yapar.
        minStep: resolve(exercise.exercise_name)?.minStep,
        type: resolve(exercise.exercise_name)?.type,
        unit: resolve(exercise.exercise_name)?.unit,
      },
      history[key] ?? []
    );

    const adjusted = applyAdjustment(
      exercise.exercise_name,
      prescription,
      adjustments[key] ?? null
    );

    return {
      exerciseId: exercise.id,
      originalName: exercise.exercise_name,
      performedName: adjusted.displayName,
      targetSets: exercise.default_sets,
      minReps: exercise.min_reps,
      maxReps: exercise.max_reps,
      exerciseType: resolve(exercise.exercise_name)?.type ?? "compound",
      unit: resolve(exercise.exercise_name)?.unit ?? "reps",
      bodyweight: resolve(exercise.exercise_name)?.bodyweight ?? false,
      classified: resolve(exercise.exercise_name) !== undefined,
      prescription: adjusted,
    };
  });

  return <ActiveWorkout routineId={id} plan={plan} openSession={openSession} />;
}
