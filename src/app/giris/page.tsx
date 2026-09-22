import type { Metadata } from "next";

import LoginScreen from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Giriş — Coach.ai",
};

// Oturumu olan kullanıcıyı /dashboard'a yollama işi proxy.ts'te yapılıyor.
export default async function LoginPage(props: PageProps<"/giris">) {
  const { error } = await props.searchParams;
  return <LoginScreen authFailed={error === "auth"} />;
}
