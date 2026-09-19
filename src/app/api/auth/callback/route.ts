import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Google OAuth dönüş noktası: yetki kodunu Supabase oturumuyla takas eder.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Açık yönlendirme (open redirect) koruması: yalnızca kendi sitemiz içindeki
  // göreli yollara izin veriyoruz.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth kod takası başarısız:", error.message);
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
