import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sunucu tarafı Supabase istemcisi.
// Tüm Server Component, Server Action ve Route Handler'lar bunu kullanır.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component render'ı sırasında cookie yazılamaz.
            // Oturum yenilemeyi proxy.ts hallettiği için burada yutmak güvenli.
          }
        },
      },
    }
  );
}
