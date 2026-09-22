import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EXERCISE_CATALOG,
  findExercise,
  catalogMinStep,
  catalogResolver,
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
  assert.equal(catalogMinStep("Uydurma Hareket"), undefined);
});

test("en küçük adım katalogdan kesin geliyor", () => {
  assert.equal(catalogMinStep("Back Squat"), 5);
  assert.equal(catalogMinStep("Deadlift"), 5);
  assert.equal(catalogMinStep("Bench Press"), 2.5);
  // Hafif izolasyonlar mikro plakayla ilerleyebilir; bildirilen sorun buydu.
  assert.equal(catalogMinStep("Lateral Raise"), 1.25);
  assert.equal(catalogMinStep("Barbell Curl"), 1.25);
});

test("hareket tipi katalogda tanımlı", () => {
  assert.equal(findExercise("Back Squat")?.type, "compound");
  assert.equal(findExercise("Bench Press")?.type, "compound");
  assert.equal(findExercise("Lateral Raise")?.type, "isolation");
  assert.equal(findExercise("Leg Curl")?.type, "isolation");
});

test("her katalog kaydının tipi ve adımı var", () => {
  for (const ex of EXERCISE_CATALOG) {
    assert.ok(["compound", "isolation"].includes(ex.type), `${ex.name}: tip yok`);
    assert.ok([1.25, 2.5, 5].includes(ex.minStep), `${ex.name}: adım geçersiz`);
  }
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

test("şablonlarda tekrar aralıkları tutarlı", () => {
  for (const template of ROUTINE_TEMPLATES) {
    for (const routine of template.routines) {
      for (const ex of routine.exercises) {
        assert.ok(ex.minReps >= 1, `${ex.name}: alt uç geçersiz`);
        assert.ok(
          ex.maxReps >= ex.minReps,
          `${ex.name}: üst uç (${ex.maxReps}) alt ucun (${ex.minReps}) altında`
        );
        assert.ok(ex.sets >= 1 && ex.sets <= 20, `${ex.name}: set sayısı geçersiz`);
      }
    }
  }
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

test("şablonlarda bileşikler sabit tekrar, izolasyonlar aralık kullanır", () => {
  for (const template of ROUTINE_TEMPLATES) {
    for (const routine of template.routines) {
      for (const ex of routine.exercises) {
        const known = findExercise(ex.name);
        if (!known) continue;

        if (known.type === "compound") {
          // Bileşikte hedefi tutturunca ağırlık artmalı; aralık bunu geciktirir.
          assert.equal(
            ex.minReps,
            ex.maxReps,
            `${ex.name} bileşik ama aralık kullanıyor (${ex.minReps}-${ex.maxReps})`
          );
        } else {
          // İzolasyonda sabit tekrar, orantısız ağırlık sıçramasına yol açar.
          assert.ok(
            ex.maxReps > ex.minReps,
            `${ex.name} izolasyon ama sabit tekrar kullanıyor`
          );
        }
      }
    }
  }
});

test("izometrik duruşlar süreyle ölçülüyor", () => {
  // "3 x 1-5 tekrar plank" anlamsız bir hedefti.
  for (const name of ["Plank", "Side Plank", "Hollow Hold", "Dead Bug"]) {
    assert.equal(findExercise(name)?.unit, "seconds", `${name} süre olmalı`);
  }
});

test("kaldırma hareketleri tekrarla ölçülüyor", () => {
  for (const name of ["Bench Press", "Back Squat", "Lateral Raise"]) {
    assert.equal(catalogResolver(name)?.unit, "reps", `${name} tekrar olmalı`);
  }
});

test("şablonlarda süre bazlı hedefler makul aralıkta", () => {
  for (const template of ROUTINE_TEMPLATES) {
    for (const routine of template.routines) {
      for (const ex of routine.exercises) {
        if (findExercise(ex.name)?.unit !== "seconds") continue;
        // Saniye hedefi tekrar gibi tek haneli olmamalı.
        assert.ok(
          ex.minReps >= 15,
          `${ex.name}: ${ex.minReps} sn hedefi tekrar gibi görünüyor`
        );
      }
    }
  }
});

test("ağırlıksız hareketler işaretli, halter hareketleri değil", async () => {
  const { catalogResolver } = await import("./exercises.ts");
  assert.equal(catalogResolver("Plank")?.bodyweight, true);
  assert.equal(catalogResolver("şınav")?.bodyweight, true);
  assert.equal(catalogResolver("Pull Up")?.bodyweight, true);
  assert.equal(catalogResolver("Bench Press")?.bodyweight, false);
  assert.equal(catalogResolver("Back Squat")?.bodyweight, false);
});
