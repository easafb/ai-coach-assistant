import { test } from "node:test";
import assert from "node:assert/strict";

import {
  prescribe,
  incrementFor,
  inferMinStep,
  roundToStep,
  normalizeExerciseName,
  type ExercisePerformance,
  type ExerciseTarget,
} from "./progression.ts";

const bench: ExerciseTarget = {
  name: "Bench Press", targetSets: 3, minReps: 8, maxReps: 12,
  minStep: 2.5, type: "compound",
};

const lateral: ExerciseTarget = {
  name: "Lateral Raise", targetSets: 3, minReps: 10, maxReps: 15,
  minStep: 1.25, type: "isolation",
};

const session = (id: string, sets: Array<[number, number]>): ExercisePerformance => ({
  sessionId: id,
  performedAt: "2026-09-21T10:00:00Z",
  sets: sets.map(([weight, reps]) => ({ weight, reps })),
});

// ================================================== tekrar aralığı mantığı

test("ilk kez: ağırlık önerilmez, alt uçtan başlanır", () => {
  const r = prescribe(bench, []);
  assert.equal(r.decision, "first-time");
  assert.equal(r.weight, null);
  assert.equal(r.reps, 8);
});

test("üst uca ulaşılmadıysa ağırlık DEĞİL tekrar artar", () => {
  // Eski motorun en büyük hatası buydu: 8 tekrarı tutturan herkese
  // her seans ağırlık artırmasını söylüyordu.
  const r = prescribe(bench, [session("s1", [[60, 8], [60, 8], [60, 8]])]);
  assert.equal(r.decision, "add-reps");
  assert.equal(r.weight, 60, "ağırlık sabit kalmalı");
  assert.equal(r.reps, 9, "bir tekrar eklenmeli");
});

test("tüm setler üst uca ulaşınca ağırlık artar ve tekrar alt uca döner", () => {
  const r = prescribe(bench, [session("s1", [[60, 12], [60, 12], [60, 12]])]);
  assert.equal(r.decision, "add-weight");
  assert.equal(r.weight, 62.5);
  assert.equal(r.reps, 8, "ağırlık artınca tekrar alt uca dönmeli");
});

test("tek set eksik kaldıysa ağırlık artmaz", () => {
  const r = prescribe(bench, [session("s1", [[60, 12], [60, 12], [60, 11]])]);
  assert.equal(r.decision, "add-reps");
  assert.equal(r.weight, 60);
  assert.equal(r.reps, 12, "en zayıf set 11 -> hedef 12");
});

test("hedef tekrar üst ucu aşamaz", () => {
  const r = prescribe(bench, [session("s1", [[60, 12], [60, 12], [60, 11]])]);
  assert.ok(r.reps <= bench.maxReps);
});

// ================================== lateral raise: bildirilen somut sorun

test("lateral raise aynı ağırlıkta tekrar ekleyerek ilerler", () => {
  // Eski motor 10 kg'da hedefi tutturunca 12.5 kg öneriyordu: %25 sıçrama.
  const r = prescribe(lateral, [session("s1", [[10, 10], [10, 10], [10, 10]])]);
  assert.equal(r.decision, "add-reps");
  assert.equal(r.weight, 10, "hafif izolasyonda ağırlık sıçramamalı");
  assert.equal(r.reps, 11);
});

test("lateral raise üst uca ulaşınca mikro adımla artar", () => {
  const r = prescribe(lateral, [session("s1", [[10, 15], [10, 15], [10, 15]])]);
  assert.equal(r.decision, "add-weight");
  assert.equal(r.weight, 11.25, "2.5 değil 1.25 kg artmalı");
  const artisYuzdesi = ((r.weight! - 10) / 10) * 100;
  assert.ok(artisYuzdesi <= 15, `artış %${artisYuzdesi} — çok büyük`);
});

// ==================================== artış yüke ve hareket tipine duyarlı

test("artış mutlak yükle birlikte büyür", () => {
  assert.equal(incrementFor(bench, 60), 2.5);
  assert.equal(incrementFor(bench, 100), 2.5);
  assert.equal(incrementFor(bench, 200), 5, "200 kg'da 2.5 kg gereksiz yavaş");
});

test("artış en küçük adımın altına inemez", () => {
  // %2 x 10 kg = 0.2 kg; böyle bir plaka yok.
  assert.equal(incrementFor(lateral, 10), 1.25);
});

test("izolasyon bileşikten yavaş ilerler", () => {
  const compound: ExerciseTarget = { ...bench, minStep: 1.25 };
  const isolation: ExerciseTarget = { ...bench, minStep: 1.25, type: "isolation" };
  assert.ok(incrementFor(compound, 100) >= incrementFor(isolation, 100));
});

// ================================================================ takılma

test("üç seans alt uca ulaşılamazsa deload", () => {
  const stalled = [
    session("s3", [[60, 7], [60, 6], [60, 6]]),
    session("s2", [[60, 7], [60, 7], [60, 5]]),
    session("s1", [[60, 6], [60, 6], [60, 6]]),
  ];
  const r = prescribe(bench, stalled);
  assert.equal(r.decision, "deload");
  assert.equal(r.weight, 55);
  assert.equal(r.reps, 8);
});

test("iki başarısız seans henüz deload getirmez", () => {
  const r = prescribe(bench, [
    session("s2", [[60, 7], [60, 6], [60, 6]]),
    session("s1", [[60, 7], [60, 7], [60, 5]]),
  ]);
  assert.equal(r.decision, "repeat");
  assert.equal(r.weight, 60);
});

test("tekrar eklenen seans takılma sayacını sıfırlar", () => {
  // Ağırlık sabit ama alt uç tutturulmuş: bu takılma değil, ilerleme.
  const r = prescribe(bench, [
    session("s3", [[60, 7], [60, 6], [60, 6]]),
    session("s2", [[60, 9], [60, 9], [60, 9]]),
    session("s1", [[60, 8], [60, 8], [60, 8]]),
  ]);
  assert.equal(r.decision, "repeat", "deload olmamalı");
});

test("takılma sayımı ağırlık değiştiğinde sıfırlanır", () => {
  const r = prescribe(bench, [
    session("s3", [[60, 7], [60, 6], [60, 6]]),
    session("s2", [[57.5, 12], [57.5, 12], [57.5, 12]]),
    session("s1", [[55, 12], [55, 12], [55, 12]]),
  ]);
  assert.equal(r.decision, "repeat");
});

test("deload en küçük adımın altına inmez", () => {
  const light: ExerciseTarget = { ...lateral, minStep: 1.25 };
  const r = prescribe(light, [
    session("s3", [[1.25, 4]]), session("s2", [[1.25, 4]]), session("s1", [[1.25, 4]]),
  ]);
  assert.ok(r.weight !== null && r.weight >= 1.25);
});

// ================================================================== genel

test("ısınma setleri çalışma ağırlığını düşürmez", () => {
  const r = prescribe(bench, [
    session("s1", [[40, 15], [50, 12], [60, 12], [60, 12], [60, 12]]),
  ]);
  assert.equal(r.decision, "add-weight");
  assert.equal(r.weight, 62.5);
});

test("hedef set sayısına ulaşılamazsa üst uç sayılmaz", () => {
  const r = prescribe(bench, [session("s1", [[60, 12], [60, 12]])]);
  assert.notEqual(r.decision, "add-weight");
});

test("boş setli seanslar yok sayılır", () => {
  const r = prescribe(bench, [
    session("empty", []),
    session("s1", [[60, 12], [60, 12], [60, 12]]),
  ]);
  assert.equal(r.decision, "add-weight");
});

test("sabit tekrar hedefi (minReps === maxReps) hâlâ çalışır", () => {
  const fixed: ExerciseTarget = { ...bench, minReps: 5, maxReps: 5 };
  const r = prescribe(fixed, [session("s1", [[100, 5], [100, 5], [100, 5]])]);
  assert.equal(r.decision, "add-weight");
  assert.equal(r.weight, 102.5);
});

test("adım çıkarımı: alt vücut bileşikleri daha büyük plakalarla çalışır", () => {
  assert.equal(inferMinStep("Back Squat"), 5);
  assert.equal(inferMinStep("Ölü Kaldırma"), 5);
  assert.equal(inferMinStep("Bench Press"), 2.5);
  assert.equal(inferMinStep("Uydurma Hareket"), 2.5);
});

test("adıma yuvarlama", () => {
  assert.equal(roundToStep(54, 2.5), 55);
  assert.equal(roundToStep(53.7, 2.5), 52.5);
  assert.equal(roundToStep(10.4, 1.25), 10);
});

test("normalize: varyantlar aynı anahtara iner", () => {
  const keys = new Set(
    ["Bench Press", "bench press", "BENCH PRESS", "  Bench   Press  "]
      .map(normalizeExerciseName)
  );
  assert.equal(keys.size, 1);
  assert.equal(
    normalizeExerciseName("Göğüs Presi"),
    normalizeExerciseName("gogus presi")
  );
  assert.notEqual(normalizeExerciseName("Bench"), normalizeExerciseName("Bench Press"));
});
