import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16: middleware.ts deprecated edildi, dosya adı proxy.ts oldu.
// Buradaki iş iki tane: (1) Supabase oturum çerezini tazelemek,
// (2) iyimser yönlendirme. Asıl yetki kontrolü src/lib/dal.ts'te.

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/coach",
  "/history",
  "/routines",
  "/workout",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Bu çağrı süresi dolmak üzere olan access token'ı yeniler ve yeni çerezi
  // response'a yazar. Eski kodda cookie adapter'ı sadece get tanımladığı için
  // yenileme hiç çalışmıyordu; kullanıcılar sebepsiz yere dışarı atılıyordu.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Statik dosyaları ve auth callback'ini dışarıda bırakıyoruz.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
