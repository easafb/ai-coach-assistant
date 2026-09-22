import { getCustomExercises } from "@/lib/queries";
import RoutineForm from "@/components/routines/RoutineForm";

export default async function NewRoutinePage() {
  // Kullanıcının kendi hareketlerini seçiciye veriyoruz ki bir kez
  // sınıflandırdığı hareket tekrar "yeni" gibi görünmesin.
  const customs = await getCustomExercises();
  return <RoutineForm customKeys={customs.map((c) => c.exerciseKey)} />;
}
