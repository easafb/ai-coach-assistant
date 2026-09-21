import { test } from "node:test";
import assert from "node:assert/strict";

import {
  prescribe,
  inferIncrement,
  roundToPlate,
  normalizeExerciseName,
  type ExercisePerformance,
  type ExerciseTarget,
} from "./progression.ts";

const target: ExerciseTarget = { name: "Bench Press", targetSets: 3, targetReps: 8 };

const session = (
  id: string,
  sets: Array<[number, number]>
): ExercisePerformance => ({
  sessionId: id,
  performedAt: "2026-09-19T10:00:00Z",
  sets: sets.map(([weight, reps]) => ({ weight, reps })),
});

test("artış adımı: alt vücut bileşik hareketler 5 kg alır", () => {
  assert.equal(inferIncrement("Back Squat"), 5);
  assert.equal(inferIncrement("Romanian Deadlift"), 5);
  assert.equal(inferIncrement("Leg Press"), 5);
  assert.equal(inferIncrement("Ölü Kaldırma"), 5);
  assert.equal(inferIncrement("Kalça Thrust"), 5);
});

test("artış adımı: tanınmayan ve üst vücut hareketler 2.5 kg alır", () => {
  assert.equal(inferIncrement("Bench Press"), 2.5);
  assert.equal(inferIncrement("Biceps Curl"), 2.5);
  assert.equal(inferIncrement("Uydurma Hareket"), 2.5);
});

test("geçmiş yoksa ağırlık önerilmez", () => {
  const result = prescribe(target, []);
  assert.equal(result.decision, "first-time");
  assert.equal(result.weight, null);
});

test("hedef tamamlandıysa ağırlık artar", () => {
  const result = prescribe(target, [session("s1", [[60, 8], [60, 8], [60, 8]])]);
  assert.equal(result.decision, "progress");
  assert.equal(result.weight, 62.5);
});

test("hedefin üstünde tekrar yapmak da ilerleme sayılır", () => {
  const result = prescribe(target, [session("s1", [[60, 10], [60, 9], [60, 8]])]);
  assert.equal(result.decision, "progress");
  assert.equal(result.weight, 62.5);
});

test("tek set eksik kaldıysa aynı ağırlık tekrarlanır", () => {
  const result = prescribe(target, [session("s1", [[60, 8], [60, 8], [60, 6]])]);
  assert.equal(result.decision, "repeat");
  assert.equal(result.weight, 60);
});

test("hedef set sayısına ulaşılamadıysa tekrarlanır", () => {
  const result = prescribe(target, [session("s1", [[60, 8], [60, 8]])]);
  assert.equal(result.decision, "repeat");
  assert.equal(result.weight, 60);
});

test("aynı ağırlıkta üç başarısız seans deload getirir", () => {
  const stalled = [
    session("s3", [[60, 7], [60, 6], [60, 6]]),
    session("s2", [[60, 7], [60, 7], [60, 5]]),
    session("s1", [[60, 6], [60, 6], [60, 6]]),
  ];
  const result = prescribe(target, stalled);
  assert.equal(result.decision, "deload");
  assert.equal(result.weight, 55); // 60 * 0.9 = 54 -> en yakın plakaya 55
});

test("iki başarısız seans henüz deload getirmez", () => {
  const result = prescribe(target, [
    session("s2", [[60, 7], [60, 6], [60, 6]]),
    session("s1", [[60, 7], [60, 7], [60, 5]]),
  ]);
  assert.equal(result.decision, "repeat");
});

test("takılma sayımı ağırlık değiştiğinde sıfırlanır", () => {
  // En yeni seans 60 kg'da başarısız, ama ondan öncekiler farklı ağırlıkta.
  const result = prescribe(target, [
    session("s3", [[60, 7], [60, 6], [60, 6]]),
    session("s2", [[57.5, 8], [57.5, 8], [57.5, 8]]),
    session("s1", [[55, 8], [55, 8], [55, 8]]),
  ]);
  assert.equal(result.decision, "repeat");
});

test("deload ağırlığı artış adımının altına düşmez", () => {
  const light: ExerciseTarget = { name: "Curl", targetSets: 3, targetReps: 10 };
  const result = prescribe(light, [
    session("s3", [[2.5, 4]]),
    session("s2", [[2.5, 4]]),
    session("s1", [[2.5, 4]]),
  ]);
  assert.equal(result.decision, "deload");
  assert.ok(result.weight !== null && result.weight >= 2.5);
});

test("ısınma setleri çalışma ağırlığını düşürmez", () => {
  // 40 ve 50 kg ısınma, 60 kg çalışma ağırlığı.
  const result = prescribe(target, [
    session("s1", [[40, 10], [50, 8], [60, 8], [60, 8], [60, 8]]),
  ]);
  assert.equal(result.decision, "progress");
  assert.equal(result.weight, 62.5);
});

test("boş setli seanslar yok sayılır", () => {
  const result = prescribe(target, [session("empty", []), session("s1", [[60, 8], [60, 8], [60, 8]])]);
  assert.equal(result.decision, "progress");
  assert.equal(result.weight, 62.5);
});

test("plaka yuvarlaması", () => {
  assert.equal(roundToPlate(54), 55);
  assert.equal(roundToPlate(53.7), 52.5); // 52.5'e uzaklık 1.2, 55'e 1.3
  assert.equal(roundToPlate(51), 50);
  assert.equal(roundToPlate(53.8), 55);
});

test("normalize: büyük/küçük harf ve Türkçe karakter farkı geçmişi bölmez", () => {
  const variants = ["Bench Press", "bench press", "BENCH PRESS", "  Bench   Press  "];
  const keys = new Set(variants.map(normalizeExerciseName));
  assert.equal(keys.size, 1, "tüm varyantlar aynı anahtara inmeli");
});

test("normalize: Türkçe karakterler sadeleşir", () => {
  assert.equal(normalizeExerciseName("Göğüs Presi"), normalizeExerciseName("gogus presi"));
  assert.equal(normalizeExerciseName("Ölü Kaldırma"), normalizeExerciseName("OLU KALDIRMA"));
});

test("normalize: farklı hareketler aynı anahtara inmez", () => {
  assert.notEqual(normalizeExerciseName("Bench Press"), normalizeExerciseName("Leg Press"));
  // Bilinen sınır: kısaltma eşleşmesi normalizasyonun kapsamı dışında.
  assert.notEqual(normalizeExerciseName("Bench"), normalizeExerciseName("Bench Press"));
});
