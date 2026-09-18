"use client";

import { useId, useMemo, useRef, useState } from "react";
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
 */
export default function ExercisePicker({ value, onChange, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => searchExercises(value), [value]);
  const isCanonical = findExercise(value) !== undefined;

  const select = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(suggestions[highlight].name);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search size={16} className="shrink-0 text-slate-600" />
        <input
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-slate-600"
          placeholder={placeholder ?? "Egzersiz ara veya yaz"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setHighlight(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Listeye tıklama blur'dan önce gelmesin diye kısa gecikme.
            blurTimer.current = setTimeout(() => setIsOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
        />
        {isCanonical && (
          <Check size={16} className="shrink-0 text-emerald-500" aria-label="Katalogda" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-1 shadow-2xl"
          onMouseDown={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {suggestions.map((exercise, i) => (
            <li key={exercise.name}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onClick={() => select(exercise.name)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === highlight ? "bg-blue-600/20" : ""
                }`}
              >
                <span className="font-semibold">{exercise.name}</span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {exercise.group} · +{exercise.increment}kg
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
