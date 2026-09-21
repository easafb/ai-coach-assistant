import LoginScreen from "@/components/auth/LoginScreen";

// Oturumu olan kullanıcıyı /dashboard'a yollama işi proxy.ts'te yapılıyor,
// bu yüzden burada client tarafında yönlendirme/flash ekranı gerekmiyor.
export default function Home() {
  return <LoginScreen />;
}
