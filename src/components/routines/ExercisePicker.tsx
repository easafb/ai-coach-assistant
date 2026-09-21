"use client";

import { useId, useMemo, useState } from "react";
import { Check, Search, Plus } from "lucide-react";

import { searchExercises, findExercise } from "@/lib/exercises";
import ExerciseClassifier from "@/components/routines/ExerciseClassifier";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Kullanıcının daha önce sınıflandırdığı hareketlerin normalize anahtarları. */
  customKeys?: string[];
  placeholder?: string;
}

export default function ExercisePicker({
  value,
  onChange,
  customKeys = [],
  placeholder,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [draftName, setDraftName] = useState<string | null>(null);

  const listId = useId();
  const optionId = (i: number) => `${listId}-option-${i}`;

  const suggestions = useMemo(() => searchExercises(value), [value]);
  const normalized = value.trim().toLocaleLowerCase("tr");
  const isKnown =
    findExercise(value) !== undefined ||
    customKeys.some((k) => k === normalized.replace(/\s+/g, " "));
  const canAdd = value.trim().length >= 2 && !isKnown;
  const hasList = isOpen && (suggestions.length > 0 || canAdd);

  const select = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  const openClassifier = () => {
    setDraftName(value.trim());
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasList || suggestions.length === 0) return;

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
        select(suggestions[highlight].name);
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // -------------------------------------------------------- sınıflandırma
  if (draftName) {
    return (
      <ExerciseClassifier
        name={draftName}
        onDone={(savedName) => {
          onChange(savedName);
          setDraftName(null);
        }}
        onCancel={() => setDraftName(null)}
      />
    );
  }

  // -------------------------------------------------------------- arama
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search size={16} className="shrink-0 text-slate-600" aria-hidden="true" />
        <input
          role="combobox"
          aria-expanded={hasList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            hasList && suggestions.length > 0 ? optionId(highlight) : undefined
          }
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
        {isKnown && value.trim() && (
          <Check size={18} className="shrink-0 text-emerald-500" aria-label="Tanımlı" />
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
                {exercise.group} · {exercise.type === "isolation" ? "izolasyon" : "bileşik"}
              </span>
            </li>
          ))}

          {canAdd && (
            <li>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  openClassifier();
                }}
                className="flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/5"
              >
                <Plus size={16} className="shrink-0 text-blue-400" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    «{value.trim()}» ekle
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Kas grubunu seçmen gerekecek
                  </span>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
