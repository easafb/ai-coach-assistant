// Uygulama genelinde paylaşılan tipler.

export interface Routine {
  id: string;
  name: string;
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_name: string;
  default_sets: number;
  /** Tekrar aralığının alt ucu. */
  min_reps: number;
  /** Üst uç: tüm setler buraya ulaşınca ağırlık artar. */
  max_reps: number;
  order_index: number;
}

export interface WorkoutSession {
  id: string;
  routine_name: string | null;
  total_volume: number | null;
  start_time: string;
  end_time: string | null;
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  created_at: string;
}

export interface ExerciseDraft {
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
}

// Server Action'ların ortak dönüş tipi. Çağıran taraf hatayı görmezden
// gelemesin diye ayrık birleşim (discriminated union) kullanıyoruz.
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };
