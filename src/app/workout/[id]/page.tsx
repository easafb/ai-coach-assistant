import { notFound } from "next/navigation";

import {
  getRoutineExercises,
  getExerciseHistory,
  getActiveAdjustments,
} from "@/lib/queries";
import { prescribe, normalizeExerciseName } from "@/lib/progression";
import { applyAdjustment, type WorkoutPlanItem } from "@/lib/adjustments";
import { catalogIncrement } from "@/lib/exercises";
import ActiveWorkout from "@/components/workout/ActiveWorkout";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [exercises, history, adjustments] = await Promise.all([
    getRoutineExercises(id),
    getExerciseHistory(),
    getActiveAdjustments(),
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
        targetReps: exercise.default_reps,
        increment: catalogIncrement(exercise.exercise_name),
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
      prescription: adjusted,
    };
  });

  return <ActiveWorkout routineId={id} plan={plan} />;
}
