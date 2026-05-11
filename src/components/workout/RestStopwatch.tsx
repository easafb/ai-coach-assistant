// src/components/workout/RestStopwatch.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface RestStopwatchProps {
  isVisible: boolean;
  onFinish: () => void;
}

export const RestStopwatch = ({ isVisible, onFinish }: RestStopwatchProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Sadece görünür olduğunda sayacı çalıştır
    if (isVisible) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } 
    
    return () => clearInterval(interval);
  }, [isVisible]); // else bloğunu sildik!

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Sayacı sıfırlama işini arka planda değil, butona basıldığında yapıyoruz
  const handleReady = () => {
    setElapsedTime(0); // Önce süreyi sıfırla
    onFinish();        // Sonra pencereyi kapat
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[85%] max-w-xs bg-white/70 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/20 dark:border-white/10 flex flex-col items-center z-[100] animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300">
      
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Resting</p>
      </div>
      
      <div className="flex items-end gap-1 mb-6">
        <span className="text-6xl font-black tabular-nums tracking-tighter text-[#1D1D1F] dark:text-white">
          {formatTime(elapsedTime)}
        </span>
      </div>

      <button 
        onClick={handleReady} // Yeni fonksiyonumuzu buraya bağladık
        className="w-full bg-[#1D1D1F] dark:bg-white text-white dark:text-black font-bold py-4 rounded-3xl text-sm active:scale-95 transition-transform shadow-xl shadow-black/10 dark:shadow-white/10"
      >
        Ready for Next Set
      </button>
    </div>
  );
};