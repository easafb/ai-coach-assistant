import { getCustomExercises } from "@/lib/queries";
import { requireConsent } from "@/lib/dal";
import RoutineForm from "@/components/routines/RoutineForm";

export default async function NewRoutinePage() {
  // Kullanıcının kendi hareketlerini seçiciye veriyoruz ki bir kez
  // sınıflandırdığı hareket tekrar "yeni" gibi görünmesin.
  await requireConsent();
  const customs = await getCustomExercises();
  return <RoutineForm customKeys={customs.map((c) => c.exerciseKey)} />;
}
