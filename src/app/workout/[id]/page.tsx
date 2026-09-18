import { notFound } from "next/navigation";

import { getRoutineExercises } from "@/lib/queries";
import ActiveWorkout from "@/components/workout/ActiveWorkout";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercises = await getRoutineExercises(id);

  if (exercises.length === 0) notFound();

  return <ActiveWorkout routineId={id} exercises={exercises} />;
}
