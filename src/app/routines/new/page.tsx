import { getCustomExercises } from "@/lib/queries";
import NewRoutineForm from "@/components/routines/NewRoutineForm";

export default async function NewRoutinePage() {
  // Kullanıcının kendi hareketlerini seçiciye veriyoruz ki bir kez
  // sınıflandırdığı hareket tekrar "yeni" gibi görünmesin.
  const customs = await getCustomExercises();
  return <NewRoutineForm customKeys={customs.map((c) => c.exerciseKey)} />;
}
