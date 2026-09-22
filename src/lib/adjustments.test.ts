import { test } from "node:test";
import assert from "node:assert/strict";

import {
  validateAdjustments,
  applyAdjustment,
  activeOnly,
  REDUCE_LOAD_FACTOR,
  type Adjustment,
} from "./adjustments.ts";
import { prescribe, type Prescription } from "./progression.ts";
import { catalogResolver, createResolver } from "./exercises.ts";

const USER_EXERCISES = ["Bench Press", "Back Squat", "Overhead Press", "Barbell Row"];
const NOW = new Date("2026-09-21T10:00:00Z");

const progressPrescription = (): Prescription =>
  prescribe(
    { name: "Bench Press", targetSets: 3, minReps: 8, maxReps: 12, minStep: 2.5, type: "compound" },
    [{ sessionId: "s1", performedAt: "2026-09-14", sets: [
      { weight: 60, reps: 12 }, { weight: 60, reps: 12 }, { weight: 60, reps: 12 },
    ] }]
  );

// ----------------------------------------------------------------- doğrulama

test("geçerli öneri kabul edilir", () => {
  const result = validateAdjustments(
    [{ exercise: "Bench Press", action: "reduce_load", reason: "Omuz ağrısı." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].exerciseName, "Bench Press");
  assert.equal(result[0].action, "reduce_load");
});

test("kullanıcıda olmayan hareket uydurulamaz", () => {
  const result = validateAdjustments(
    [{ exercise: "Leg Press", action: "skip", reason: "Diz ağrısı." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 0);
});

test("egzersiz adı büyük/küçük harf farkıyla da eşleşir", () => {
  const result = validateAdjustments(
    [{ exercise: "bench press", action: "skip", reason: "Ağrı." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].exerciseName, "Bench Press", "kanonik ad korunmalı");
});

test("geçersiz eylem reddedilir", () => {
  const result = validateAdjustments(
    [{ exercise: "Bench Press", action: "increase_load", reason: "İyi hissediyorum." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 0);
});

test("boş veya eksik alanlar reddedilir", () => {
  const result = validateAdjustments(
    [
      { exercise: "Bench Press", action: "skip" },
      { action: "skip", reason: "Ağrı." },
      { exercise: "Bench Press", action: "skip", reason: "   " },
    ],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 0);
});

test("ikame aynı kas grubundan olmalı", () => {
  const sameGroup = validateAdjustments(
    [{ exercise: "Bench Press", action: "swap", substitute: "Dumbbell Bench Press", reason: "Omuz." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(sameGroup.length, 1);
  assert.equal(sameGroup[0].substituteName, "Dumbbell Bench Press");

  const wrongGroup = validateAdjustments(
    [{ exercise: "Back Squat", action: "swap", substitute: "Barbell Curl", reason: "Diz." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(wrongGroup.length, 0, "squat yerine curl önerilememeli");
});

test("katalogda olmayan ikame reddedilir", () => {
  const result = validateAdjustments(
    [{ exercise: "Bench Press", action: "swap", substitute: "Uydurma Hareket", reason: "Ağrı." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 0);
});

test("hareketin kendisiyle değiştirilmesi reddedilir", () => {
  const result = validateAdjustments(
    [{ exercise: "Bench Press", action: "swap", substitute: "bench", reason: "Ağrı." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 0);
});

test("aynı hareket için yalnızca ilk öneri geçerli", () => {
  const result = validateAdjustments(
    [
      { exercise: "Bench Press", action: "skip", reason: "Birinci." },
      { exercise: "Bench Press", action: "reduce_load", reason: "İkinci." },
    ],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].reason, "Birinci.");
});

test("gerekçe 300 karakterde kırpılır", () => {
  const result = validateAdjustments(
    [{ exercise: "Bench Press", action: "skip", reason: "x".repeat(500) }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  assert.equal(result[0].reason.length, 300);
});

// ------------------------------------------------------------------ uygulama

test("ayarlama yoksa reçete değişmez", () => {
  const base = progressPrescription();
  const result = applyAdjustment("Bench Press", base, null);
  assert.equal(result.weight, base.weight);
  assert.equal(result.skipped, false);
});

test("skip egzersizi atlanmış işaretler", () => {
  const adjustment: Adjustment = {
    exerciseKey: "bench press", exerciseName: "Bench Press", action: "skip",
    substituteName: null, reason: "Ağrı.", expiresAt: "2026-10-05T10:00:00Z",
  };
  const result = applyAdjustment("Bench Press", progressPrescription(), adjustment);
  assert.equal(result.skipped, true);
});

test("reduce_load ağırlığı sabit oranla düşürür, modele bırakmaz", () => {
  const base = progressPrescription();
  assert.equal(base.weight, 62.5);

  const adjustment: Adjustment = {
    exerciseKey: "bench press", exerciseName: "Bench Press", action: "reduce_load",
    substituteName: null, reason: "Omuz ağrısı.", expiresAt: "2026-10-05T10:00:00Z",
  };
  const result = applyAdjustment("Bench Press", base, adjustment);

  // 62.5 * 0.8 = 50 -> plakaya yuvarlanmış
  assert.equal(result.weight, 50);
  assert.equal(result.decision, "deload");
  assert.ok(result.rationale.includes("Omuz ağrısı."));
});

test("reduce_load artış adımının altına inmez", () => {
  const tiny: Prescription = {
    weight: 2.5, reps: 10, decision: "repeat", rationale: "", increment: 2.5,
  };
  const adjustment: Adjustment = {
    exerciseKey: "bench press", exerciseName: "Bench Press", action: "reduce_load",
    substituteName: null, reason: "Yorgunum.", expiresAt: "2026-10-05T10:00:00Z",
  };
  const result = applyAdjustment("Bench Press", tiny, adjustment);
  assert.ok(result.weight !== null && result.weight >= 2.5);
});

test("swap adı değiştirir ve ağırlık önerisini kaldırır", () => {
  const adjustment: Adjustment = {
    exerciseKey: "bench press", exerciseName: "Bench Press", action: "swap",
    substituteName: "Dumbbell Bench Press", reason: "Omuz ağrısı.",
    expiresAt: "2026-10-05T10:00:00Z",
  };
  const result = applyAdjustment("Bench Press", progressPrescription(), adjustment);
  assert.equal(result.displayName, "Dumbbell Bench Press");
  assert.equal(result.weight, null, "ikamenin geçmişi yok, ağırlık önerilmemeli");
  assert.equal(result.decision, "first-time");
});

test("ilerleme motorunun ağırlığı ayarlamadan bağımsız hesaplanır", () => {
  // Güvenlik özelliği: ayarlama nesnesinde hiçbir sayı alanı yok.
  const adjustment: Adjustment = {
    exerciseKey: "bench press", exerciseName: "Bench Press", action: "reduce_load",
    substituteName: null, reason: "Test.", expiresAt: "2026-10-05T10:00:00Z",
  };
  assert.equal(Object.keys(adjustment).some((k) => k === "weight"), false);
  const result = applyAdjustment("Bench Press", progressPrescription(), adjustment);
  assert.equal(result.weight, Math.round((62.5 * REDUCE_LOAD_FACTOR) / 2.5) * 2.5);
});

// --------------------------------------------------------------------- süre

test("süresi dolmuş ayarlamalar elenir", () => {
  const make = (expiresAt: string): Adjustment => ({
    exerciseKey: "bench press", exerciseName: "Bench Press", action: "skip",
    substituteName: null, reason: "x", expiresAt,
  });
  const result = activeOnly(
    [make("2026-09-20T10:00:00Z"), make("2026-09-22T10:00:00Z")],
    NOW
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].expiresAt, "2026-09-22T10:00:00Z");
});

test("ayarlama 14 gün sonra düşecek şekilde damgalanır", () => {
  const result = validateAdjustments(
    [{ exercise: "Bench Press", action: "skip", reason: "Ağrı." }],
    USER_EXERCISES,
    catalogResolver,
    NOW
  );
  const days = (new Date(result[0].expiresAt).getTime() - NOW.getTime()) / 86400000;
  assert.equal(days, 14);
});

// ------------------------------------------------- kullanıcıya özel hareketler

test("sınıflandırılmamış hareket için ikame önerilemez", () => {
  // Güvenlik davranışı: kas grubu bilinmeyen harekete ikame önerilirse
  // "AAA yerine biceps curl" gibi saçma bir sonuç çıkardı.
  const result = validateAdjustments(
    [{ exercise: "AAA", action: "swap", substitute: "Dumbbell Bench Press", reason: "Ağrı." }],
    ["AAA"],
    catalogResolver,
    NOW
  );
  assert.equal(result.length, 0);
});

test("sınıflandırılmamış harekette hafifletme ve atlama yine çalışır", () => {
  for (const action of ["reduce_load", "skip"] as const) {
    const result = validateAdjustments(
      [{ exercise: "AAA", action, reason: "Ağrı." }],
      ["AAA"],
      catalogResolver,
      NOW
    );
    assert.equal(result.length, 1, `${action} kabul edilmeliydi`);
  }
});

test("sınıflandırılan kullanıcı hareketi ikame alabilir", () => {
  const resolve = createResolver([
    { exerciseKey: "aaa", name: "AAA", group: "göğüs", type: "compound", unit: "reps", minStep: 2.5 },
  ]);
  const result = validateAdjustments(
    [{ exercise: "AAA", action: "swap", substitute: "Dumbbell Bench Press", reason: "Omuz." }],
    ["AAA"],
    resolve,
    NOW
  );
  assert.equal(result.length, 1, "sınıflandırıldıktan sonra ikame mümkün olmalı");
  assert.equal(result[0].substituteName, "Dumbbell Bench Press");
});

test("kullanıcı hareketi yanlış kas grubuna ikame edilemez", () => {
  const resolve = createResolver([
    { exerciseKey: "aaa", name: "AAA", group: "bacak", type: "compound", unit: "reps", minStep: 5 },
  ]);
  const result = validateAdjustments(
    [{ exercise: "AAA", action: "swap", substitute: "Dumbbell Bench Press", reason: "Diz." }],
    ["AAA"],
    resolve,
    NOW
  );
  assert.equal(result.length, 0, "bacak hareketi göğüs hareketiyle değiştirilememeli");
});

test("kullanıcı kaydı katalogla çakışırsa kullanıcınınki kazanır", () => {
  const resolve = createResolver([
    { exerciseKey: "bench press", name: "Bench Press", group: "göğüs", type: "compound", unit: "reps", minStep: 5 },
  ]);
  assert.equal(resolve("Bench Press")?.minStep, 5);
  assert.equal(resolve("Bench Press")?.custom, true);
  assert.equal(catalogResolver("Bench Press")?.minStep, 2.5);
});
