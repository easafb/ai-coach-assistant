import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSurvey } from "./survey.ts";

test("geçerli cevaplar olduğu gibi döner", () => {
  assert.deepEqual(
    parseSurvey({ goal: "muscle", experience: "beginner", source: "friend" }),
    { goal: "muscle", experience: "beginner", source: "friend" }
  );
});

test("eksik alan reddedilir", () => {
  assert.equal(parseSurvey({ goal: "muscle", experience: "beginner" }), null);
});

test("bilinmeyen değer reddedilir", () => {
  assert.equal(
    parseSurvey({ goal: "bodybuilding", experience: "beginner", source: "friend" }),
    null
  );
});

test("prototip zincirindeki anahtarlar geçerli sayılmaz", () => {
  assert.equal(
    parseSurvey({ goal: "toString", experience: "beginner", source: "friend" }),
    null
  );
});

test("fazladan alanlar sonuca taşınmaz", () => {
  const parsed = parseSurvey({
    goal: "strength",
    experience: "advanced",
    source: "social",
    user_id: "başkasının-kimliği",
  });
  assert.deepEqual(parsed, { goal: "strength", experience: "advanced", source: "social" });
});

test("nesne olmayan girdi reddedilir", () => {
  assert.equal(parseSurvey(null), null);
  assert.equal(parseSurvey("muscle"), null);
});
