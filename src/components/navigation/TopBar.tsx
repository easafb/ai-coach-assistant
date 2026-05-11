// src/components/navigation/TopBar.tsx
import React from "react";

const TopBar = () => {
  return (
    <header className="flex justify-between items-center w-full pt-12 pb-6 px-6 bg-[#F5F5F7] dark:bg-[#000000]">
      {/* User Profile Area */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
          {/* İleride buraya Google'dan gelen profil fotoğrafını (next/image ile) koyacağız */}
          <div className="w-full h-full bg-gradient-to-tr from-blue-400 to-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Welcome back</p>
          <h1 className="text-lg font-black text-[#1D1D1F] dark:text-white leading-none">Emir Asaf</h1>
        </div>
      </div>

      {/* Action Icons (e.g., Settings) */}
      <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] shadow-sm border border-slate-200 dark:border-white/5 active:scale-90 transition-transform">
        {/* Placeholder for Gear Icon */}
        <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
      </button>
    </header>
  );
};

export default TopBar;