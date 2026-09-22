"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, X, Plus, Minus } from "lucide-react";

import type { ExerciseType } from "@/lib/exercises";

/**
 * Setler arası dinlenme süreleri (saniye).
 * Bileşik hareketler merkezi sinir sistemini daha çok yoruyor ve
 * toparlanması uzun sürüyor; izolasyonlarda bu kadar beklemek gereksiz.
 *
 * Bileşik süresi kullanım geri bildirimiyle 180'den 120'ye çekildi:
 * salonda üç dakika fazla geliyor. Kullanıcı her an +/- 30 sn ayarlayabiliyor.
 */
export const DEFAULT_REST: Record<ExerciseType, number> = {
  compound: 120,
  isolation: 90,
};

const format = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/**
 * Süre bitince üç kısa bip. Ses dosyası taşımamak için Web Audio ile üretiliyor.
 *
 * Üç bip, tek bip yerine bilinçli bir tercih: iOS Safari Vibration API'sini
 * desteklemiyor, yani iPhone'da titreşim mümkün değil ve ses tek uyarı
 * kanalı olarak kalıyor. Salon gürültüsünde tek bip kaçabiliyor.
 */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const PATTERN = [0, 0.22, 0.44];

    for (const offset of PATTERN) {
      const at = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      osc.start(at);
      osc.stop(at + 0.18);
    }

    setTimeout(() => void ctx.close(), 1200);
  } catch {
    // Ses politikası veya desteksiz tarayıcı: sessizce geç.
  }
}

interface Props {
  seconds: number;
  onDismiss: () => void;
}

/**
 * Sayaç her yeni sette sıfırdan başlamalı. Bunu effect içinde setState ile
 * yapmak ardışık render tetikliyordu; bunun yerine çağıran taraf `key`
 * veriyor ve React yeni bir örnek oluşturuyor. Durum doğrudan prop'tan
 * başlatıldığı için sıfırlama effect'ine gerek kalmıyor.
 */
export default function RestTimer({ seconds, onDismiss }: Props) {
  const [total, setTotal] = useState(seconds);
  const [left, setLeft] = useState(seconds);
  const finished = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left > 0 || finished.current) return;
    finished.current = true;
    beep();
    // Android'de ek uyarı. iOS Safari bu API'yi hiç desteklemiyor, orada
    // sessizce atlanıyor ve ses tek kanal olarak kalıyor.
    try {
      navigator.vibrate?.([200, 100, 200, 100, 200]);
    } catch {
      /* desteklenmiyorsa sorun değil */
    }
  }, [left]);

  const adjust = (delta: number) => {
    setTotal((t) => Math.max(15, t + delta));
    setLeft((v) => Math.max(1, v + delta));
    finished.current = false;
  };

  const done = left <= 0;
  const progress = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-rise fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 transition-colors ${
        done
          ? "border-emerald-500/40 bg-emerald-950/90"
          : "border-white/10 bg-neutral-900/95"
      }`}
    >
      {/* Kalan süreyi rakama bakmadan anlamak için ilerleme çubuğu. */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-white/5">
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${
            done ? "bg-emerald-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-2xl items-center gap-3 px-6">
        <Timer
          size={20}
          className={done ? "shrink-0 text-emerald-400" : "shrink-0 text-blue-400"}
        />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            {done ? "Dinlenme bitti" : "Dinlenme"}
          </p>
          <p
            className={`font-mono text-2xl font-bold tabular-nums ${
              done ? "animate-pulse text-emerald-400" : "text-white"
            }`}
          >
            {done ? "Hazırsın" : format(left)}
          </p>
        </div>

        <button
          onClick={() => adjust(-30)}
          aria-label="30 saniye azalt"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 active:scale-95"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => adjust(30)}
          aria-label="30 saniye ekle"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 active:scale-95"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={onDismiss}
          aria-label="Sayacı kapat"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white active:scale-95"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
