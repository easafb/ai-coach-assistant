// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class'larını çakışmadan birleştiren mucizevi fonksiyon (Apple temasındaki dinamik renkler için çok işimize yarayacak)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Bugünün tarihini Apple stili formatlar (Örn: "Monday, April 20")
export function getFormattedDate(): string {
  const date = new Date();
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}