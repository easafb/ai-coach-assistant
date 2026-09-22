import { notFound } from "next/navigation";

import { getCustomExercises, getRoutine, getRoutineExercises } from "@/lib/queries";
import { requireConsent } from "@/lib/dal";
import RoutineForm from "@/components/routines/RoutineForm";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireConsent();
  const { id } = await params;

  const [routine, exercises, customs] = await Promise.all([
    getRoutine(id),
    getRoutineExercises(id),
    getCustomExercises(),
  ]);

  // getRoutine sahiplik doğrulaması yapıyor; başkasının rutini null döner.
  if (!routine) notFound();

  return (
    <RoutineForm
      routineId={routine.id}
      initialName={routine.name}
      initialExercises={exercises.map((ex) => ({
        name: ex.exercise_name,
        sets: String(ex.default_sets),
        minReps: String(ex.min_reps),
        maxReps: String(ex.max_reps),
      }))}
      customKeys={customs.map((c) => c.exerciseKey)}
    />
  );
}
