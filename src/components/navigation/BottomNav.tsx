"use client";

import { Dumbbell, Sparkles, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { id: "train", label: "Antrenman", href: "/dashboard", icon: Dumbbell },
    { id: "history", label: "Geçmiş", href: "/history", icon: Calendar },
    { id: "coach", label: "Koç", href: "/coach", icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/5 bg-black/80 px-6 pt-3 backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link 
            key={item.id} 
            href={item.href} 
            className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl transition-all ${isActive ? "scale-110 text-blue-500" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Icon size={24} strokeWidth={isActive ? 3 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}