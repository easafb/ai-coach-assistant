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
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 pb-8 pt-4 px-12 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link 
            key={item.id} 
            href={item.href} 
            className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-blue-500 scale-110" : "text-slate-500 hover:text-slate-300"}`}
          >
            <Icon size={24} strokeWidth={isActive ? 3 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}