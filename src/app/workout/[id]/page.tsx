import { notFound } from "next/navigation";

import { getRoutineExercises, getExerciseHistory } from "@/lib/queries";
import {
  prescribe,
  normalizeExerciseName,
  type Prescription,
} from "@/lib/progression";
import { catalogIncrement } from "@/lib/exercises";
import ActiveWorkout from "@/components/workout/ActiveWorkout";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [exercises, history] = await Promise.all([
    getRoutineExercises(id),
    getExerciseHistory(),
  ]);

  if (exercises.length === 0) notFound();

  // Reçeteler sunucuda hesaplanıyor: motor saf ve deterministik olduğu için
  // salonda ağ beklemeden, her egzersiz için hazır geliyorlar.
  const prescriptions: Record<string, Prescription> = Object.fromEntries(
    exercises.map((exercise) => [
      exercise.id,
      prescribe(
        {
          name: exercise.exercise_name,
          targetSets: exercise.default_sets,
          targetReps: exercise.default_reps,
          // Katalogda varsa kesin adım, yoksa motor addan çıkarım yapar.
          increment: catalogIncrement(exercise.exercise_name),
        },
        history[normalizeExerciseName(exercise.exercise_name)] ?? []
      ),
    ])
  );

  return (
    <ActiveWorkout routineId={id} exercises={exercises} prescriptions={prescriptions} />
  );
}
