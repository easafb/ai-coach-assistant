import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { CURRENT_POLICY_VERSION } from "@/lib/consent";

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

  // Giriş ekranındaki açık rıza, Google'a yönlendirme sırasında kaybolmasın
  // diye çerezle taşınıyor. Kullanıcı kimliği ancak burada belli olduğu için
  // kayıt bu noktada yapılıyor.
  const cookieStore = await cookies();
  if (cookieStore.get("pending_consent")?.value === "1") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: consentError } = await supabase.from("user_consents").upsert(
        {
          user_id: user.id,
          policy_version: CURRENT_POLICY_VERSION,
          health_data: true,
          cross_border: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      // Kaydedilemezse akışı kesmiyoruz: /onay ekranı zaten yakalayacak.
      if (consentError) console.error("[callback.consent]", consentError.message);
    }
    cookieStore.delete("pending_consent");
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
