"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ShieldCheck, Loader2 } from "lucide-react";

import { saveConsentAction } from "@/app/actions/consentActions";

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? "border-blue-500 bg-blue-600 text-white" : "border-white/20"
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="text-sm leading-snug text-neutral-300">{children}</span>
    </label>
  );
}

export default function ConsentForm({
  name,
  isUpdate,
}: {
  name: string;
  isUpdate: boolean;
}) {
  const router = useRouter();
  const [readPolicy, setReadPolicy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveConsentAction(consent, consent);
      if (result.ok) router.push("/dashboard");
      else setError(result.error);
    });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-6 text-white">
      <div className="w-full max-w-md">
        <ShieldCheck className="mb-6 text-blue-500" size={40} />

        <h1 className="mb-2 text-3xl font-black tracking-tighter">
          {isUpdate ? "Metnimiz güncellendi" : `Son bir adım, ${name}`}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-neutral-500">
          {isUpdate
            ? "Aydınlatma metnimizde değişiklik oldu. Devam etmek için yeni metni onaylaman gerekiyor."
            : "Devam etmeden önce verilerinin nasıl işlendiğini onaylaman gerekiyor."}
        </p>

        <div className="mb-6 space-y-3">
          <Checkbox checked={readPolicy} onChange={setReadPolicy}>
            <Link href="/gizlilik" className="font-semibold text-blue-400 underline">
              Aydınlatma metnini
            </Link>{" "}
            okudum.
          </Checkbox>

          <Checkbox checked={consent} onChange={setConsent}>
            Sağlık verilerimin işlenmesine ve yurt dışı sunucularına
            aktarılmasına <strong className="text-white">açık rıza</strong>{" "}
            gösteriyorum.
          </Checkbox>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={isPending || !readPolicy || !consent}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black disabled:opacity-30"
        >
          {isPending && <Loader2 size={18} className="animate-spin" />}
          {isPending ? "Kaydediliyor..." : "Onaylıyorum"}
        </button>

        <p className="mt-6 text-center text-xs leading-relaxed text-neutral-600">
          Onaylamak istemiyorsan uygulamayı kullanamazsın.{" "}
          <Link href="/hesap" className="underline">
            Hesabını ve tüm verini silebilirsin.
          </Link>
        </p>
      </div>
    </main>
  );
}
