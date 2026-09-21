"use client";

import { useId, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { searchExercises, findExercise } from "@/lib/exercises";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Egzersiz adı girişi: katalogdan seçtirir ama serbest yazmayı da engellemez.
 * Katalogdan seçilen adlar kanonik olduğu için geçmiş eşleşmesi ve artış adımı
 * doğru çalışır; listede olmayan bir hareketi yazan kullanıcı da engellenmez.
 *
 * Seçim bilerek pointerdown'da ve preventDefault ile yapılıyor: click'te
 * yapıldığında input önce blur oluyor, liste kapanıyor ve seçim hiç gerçekleşmiyordu.
 * Dokunmatikte parmak teması 150-250 ms sürdüğü için bu hata telefonda sistematikti.
 */
export default function ExercisePicker({ value, onChange, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const optionId = (i: number) => `${listId}-option-${i}`;

  const suggestions = useMemo(() => searchExercises(value), [value]);
  const isCanonical = findExercise(value) !== undefined;
  const hasList = isOpen && suggestions.length > 0;

  const select = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasList) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlight((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
        event.preventDefault();
        select(suggestions[highlight].name);
        break;
      case "Tab":
        // Tab vurgulanan öneriyi kabul edip odağı normal şekilde ilerletir.
        select(suggestions[highlight].name);
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search size={16} className="shrink-0 text-slate-600" aria-hidden="true" />
        <input
          role="combobox"
          aria-expanded={hasList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={hasList ? optionId(highlight) : undefined}
          className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-slate-600"
          placeholder={placeholder ?? "Egzersiz ara veya yaz"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setHighlight(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {isCanonical && (
          <Check size={18} className="shrink-0 text-emerald-500" aria-label="Katalogda" />
        )}
      </div>

      {hasList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#111] p-1 shadow-2xl"
        >
          {suggestions.map((exercise, i) => (
            <li
              key={exercise.name}
              id={optionId(i)}
              role="option"
              aria-selected={i === highlight}
              // pointerdown hem fare hem dokunmayı kapsar; preventDefault input'un
              // odağını korur, böylece blur tetiklenip liste kapanmaz.
              onPointerDown={(event) => {
                event.preventDefault();
                select(exercise.name);
              }}
              onPointerEnter={() => setHighlight(i)}
              className={`flex min-h-12 cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors ${
                i === highlight ? "bg-blue-600/25" : ""
              }`}
            >
              <span className="font-semibold">{exercise.name}</span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {exercise.group} · +{exercise.increment}kg
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
