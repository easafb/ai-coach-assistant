import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EXERCISE_CATALOG,
  findExercise,
  catalogIncrement,
  searchExercises,
} from "./exercises.ts";
import { normalizeExerciseName } from "./progression.ts";
import { ROUTINE_TEMPLATES } from "./templates.ts";

test("katalogda kanonik ad tekrarı yok", () => {
  const keys = EXERCISE_CATALOG.map((e) => normalizeExerciseName(e.name));
  assert.equal(new Set(keys).size, keys.length);
});

test("takma adlar birden fazla harekete işaret etmiyor", () => {
  const seen = new Map<string, string>();
  for (const exercise of EXERCISE_CATALOG) {
    for (const alias of exercise.aliases) {
      const key = normalizeExerciseName(alias);
      const owner = seen.get(key);
      assert.equal(owner, undefined, `"${alias}" hem ${owner} hem ${exercise.name} için tanımlı`);
      seen.set(key, exercise.name);
    }
  }
});

test("kısaltmalar kanonik harekete çözülüyor", () => {
  assert.equal(findExercise("bench")?.name, "Bench Press");
  assert.equal(findExercise("BENCH")?.name, "Bench Press");
  assert.equal(findExercise("ohp")?.name, "Overhead Press");
  assert.equal(findExercise("squat")?.name, "Back Squat");
  assert.equal(findExercise("ölü kaldırma")?.name, "Deadlift");
  assert.equal(findExercise("rdl")?.name, "Romanian Deadlift");
});

test("katalogda olmayan hareket undefined döner", () => {
  assert.equal(findExercise("Uydurma Hareket"), undefined);
  assert.equal(catalogIncrement("Uydurma Hareket"), undefined);
});

test("artış adımı katalogdan kesin geliyor", () => {
  assert.equal(catalogIncrement("Back Squat"), 5);
  assert.equal(catalogIncrement("Deadlift"), 5);
  assert.equal(catalogIncrement("Hip Thrust"), 5);
  assert.equal(catalogIncrement("Bench Press"), 2.5);
  // Leg curl alt vücut ama izolasyon: ad çıkarımı 5 derdi, katalog 2.5 diyor.
  assert.equal(catalogIncrement("Leg Curl"), 2.5);
});

test("arama kısaltma ve Türkçe karakterle çalışıyor", () => {
  assert.ok(searchExercises("bench").some((e) => e.name === "Bench Press"));
  assert.ok(searchExercises("göğüs").some((e) => e.group === "göğüs"));
  assert.ok(searchExercises("kürek").some((e) => e.name === "Barbell Row"));
  assert.equal(searchExercises("zzzz").length, 0);
});

test("arama tam eşleşmeyi öne alıyor", () => {
  assert.equal(searchExercises("bench press")[0].name, "Bench Press");
});

test("şablonlardaki her egzersiz katalogda var", () => {
  for (const template of ROUTINE_TEMPLATES) {
    for (const routine of template.routines) {
      for (const exercise of routine.exercises) {
        assert.ok(
          findExercise(exercise.name),
          `${template.title} / ${routine.name}: "${exercise.name}" katalogda yok`
        );
      }
    }
  }
});

test("şablon id'leri benzersiz", () => {
  const ids = ROUTINE_TEMPLATES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});
