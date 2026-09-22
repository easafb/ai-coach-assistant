import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CloudOff,
  Dumbbell,
  ListChecks,
  MessageCircle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { deloadDemo, progressDemo, type DemoCard } from "@/components/landing/demo";

// Linke tıklayan biri eskiden doğrudan giriş ekranına ve sağlık verisi rıza
// kutusuna düşüyordu: ürünü görmeden hesap açması isteniyordu. Bu sayfa
// önce ne aldığını gösteriyor, girişi /giris'e bırakıyor.
// Oturumu olan kullanıcı proxy.ts'te /dashboard'a yönlendiriliyor.

const DESCRIPTION =
  "Geçen antrenmanlarına bakıp bugün kaç kilo, kaç tekrar yapacağını söyleyen antrenman uygulaması. Ücretsiz.";

export const metadata: Metadata = {
  title: "Coach.ai — Bugün ne kaldıracağını sen düşünme",
  description: DESCRIPTION,
  openGraph: {
    title: "Coach.ai — Bugün ne kaldıracağını sen düşünme",
    description: DESCRIPTION,
    locale: "tr_TR",
    type: "website",
  },
};

const STEPS = [
  {
    icon: ListChecks,
    title: "Programını seç",
    body: "Hazır programlardan biriyle başla ya da kendi rutinini kur. 114 hareketlik katalogdan seç.",
  },
  {
    icon: Dumbbell,
    title: "Setlerini kaydet",
    body: "Ağırlık ve tekrar önceden dolu gelir, tek dokunuşla kaydedersin. Salonda internet çekmezse setlerin telefonda bekler.",
  },
  {
    icon: TrendingUp,
    title: "Sonraki seans hazır",
    body: "Hedefini tutturduysan ağırlık artar. Tutturamadıysan aynı ağırlıkta kalırsın. Üç seans takılırsan ağırlık düşer, yeniden tırmanırsın.",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#050505] text-white">
      {/* ÜST: ne olduğu ve tek eylem */}
      <section className="mx-auto max-w-xl px-6 pb-16 pt-14">
        <div className="mb-10 flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-black italic tracking-tighter">
            <span className="rounded-lg bg-blue-600 p-1.5">
              <Dumbbell size={16} />
            </span>
            Coach.ai
          </span>
          <Link
            href="/giris"
            className="flex min-h-11 items-center px-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white"
          >
            Giriş yap
          </Link>
        </div>

        <div className="stagger-children">
          <span className="mb-5 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
            Ücretsiz · Beta
          </span>

          <h1 className="mb-5 text-[2.6rem] font-black leading-[1.05] tracking-tight sm:text-5xl">
            Bugün kaç kilo kaldıracağını sen düşünme.
          </h1>

          <p className="mb-8 text-lg leading-relaxed text-neutral-400">
            Coach.ai geçen antrenmanlarına bakar ve her hareket için bugünkü
            ağırlığı ve tekrarı söyler. Sen sadece kaldırırsın.
          </p>

          <div>
            <Link
              href="/giris"
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-lg font-bold transition-transform hover:scale-[1.02] active:scale-95 sm:w-auto sm:inline-flex"
            >
              Ücretsiz başla <ArrowRight size={20} />
            </Link>
            <p className="mt-3 text-center text-xs text-neutral-500 sm:text-left">
              Google hesabınla giriş. Kredi kartı istenmez.
            </p>
          </div>
        </div>
      </section>

      {/* ÜRÜNÜN KENDİSİ: motorun gerçekten ürettiği iki karar */}
      <section className="mx-auto max-w-xl px-6 pb-20">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-neutral-500">
          Salonda gördüğün şey
        </h2>
        <p className="mb-6 text-neutral-400">
          Her öneri bir gerekçeyle gelir. Ne yapacağını değil, neden yapacağını
          da bilirsin.
        </p>

        <div className="space-y-4">
          <DemoPrescription card={progressDemo} tone="up" />
          <DemoPrescription card={deloadDemo} tone="down" />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-neutral-500">
          İkinci kart önemli: çoğu uygulama sadece artırmayı bilir. Takıldığında
          ağırlığı bilerek düşürmek (deload), aylarca aynı yerde saymaktan
          kurtaran şeydir.
        </p>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-xl px-6 py-16">
          <h2 className="mb-8 text-2xl font-black tracking-tight">Nasıl çalışır?</h2>
          <ol className="space-y-7">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="mb-1 font-bold">
                    <span className="text-neutral-500">{i + 1}.</span> {title}
                  </h3>
                  <p className="leading-relaxed text-neutral-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* KOÇ: yapay zekânın sınırı bir özellik olarak */}
      <section className="mx-auto max-w-xl px-6 py-16">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <ShieldCheck size={20} />
        </div>
        <h2 className="mb-3 text-2xl font-black tracking-tight">
          Yapay zekâ ağırlık uydurmaz.
        </h2>
        <p className="mb-4 leading-relaxed text-neutral-400">
          Koç&apos;a &ldquo;omzum ağrıyor&rdquo; ya da &ldquo;bugün yorgunum&rdquo;
          yazabilirsin. Programına bakıp bir hareketi hafifletmeyi, benzer bir
          hareketle değiştirmeyi ya da bugünlük atlamayı önerir.
        </p>
        <p className="leading-relaxed text-neutral-400">
          Ama kilo ve tekrar her zaman yukarıdaki kurallarla hesaplanır. Yapay
          zekâ bir sayı söyleyemez. Bir hareketi değiştirmeyi önerdiğinde de
          yerine yalnızca aynı kas grubunu çalıştıran bir hareket koyabilir.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Feature icon={MessageCircle} text="Türkçe konuşan koç" />
          <Feature icon={CloudOff} text="Salonda internet olmasa da set kaydı" />
        </div>
      </section>

      {/* KAPANIŞ */}
      <section className="mx-auto max-w-xl px-6 pb-16">
        <div className="rounded-[2rem] bg-blue-600 p-8 text-center">
          <h2 className="mb-2 text-2xl font-black tracking-tight">
            Bir sonraki antrenmanında dene.
          </h2>
          <p className="mb-6 text-blue-100">
            Kurulum yok. Programını seçmen bir dakika sürer.
          </p>
          <Link
            href="/giris"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
          >
            Ücretsiz başla <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-xl items-center justify-between px-6 pb-10 text-xs text-neutral-600">
        <span>Coach.ai · Beta</span>
        <Link href="/gizlilik" className="min-h-11 content-center hover:text-neutral-400">
          Aydınlatma metni
        </Link>
      </footer>
    </main>
  );
}

/** Aktif antrenman ekranındaki öneri kartının sadeleştirilmiş kopyası. */
function DemoPrescription({ card, tone }: { card: DemoCard; tone: "up" | "down" }) {
  const { prescription } = card;
  const Icon = tone === "up" ? TrendingUp : TrendingDown;
  const badge =
    tone === "up"
      ? { label: "Ağırlık +", className: "bg-emerald-100 text-emerald-700" }
      : { label: "Deload", className: "bg-orange-100 text-orange-700" };

  return (
    <div className="rounded-[2rem] bg-white p-6 text-black shadow-2xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-2xl font-black leading-tight">{card.exercise}</h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <p className="mb-4 text-3xl font-black tabular-nums tracking-tight">
        {prescription.weight} kg
        <span className="text-neutral-400"> × {prescription.reps}</span>
      </p>

      <div className="flex items-start gap-2 rounded-2xl bg-neutral-100 p-4">
        <Icon
          size={16}
          className={`mt-0.5 shrink-0 ${tone === "up" ? "text-blue-600" : "text-orange-600"}`}
        />
        <p className="text-sm font-medium leading-snug text-neutral-700">
          {prescription.rationale}
        </p>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  text,
}: {
  icon: typeof MessageCircle;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <Icon size={18} className="shrink-0 text-neutral-400" />
      <span className="text-sm font-medium text-neutral-300">{text}</span>
    </div>
  );
}
