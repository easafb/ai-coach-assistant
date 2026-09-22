import { test } from "node:test";
import assert from "node:assert/strict";

import { progressDemo, deloadDemo } from "./demo.ts";

// Ana sayfa bu iki kartı "ağırlık artar" ve "takılınca düşer" diye sunuyor.
// Motor değişip bu senaryolarda başka karar verirse sayfa yalan söylemeye
// başlar; test o anda kırılsın.

test("ana sayfa ilerleme örneği gerçekten ağırlık artırıyor", () => {
  assert.equal(progressDemo.prescription.decision, "add-weight");
  assert.equal(progressDemo.prescription.weight, 62.5);
});

test("ana sayfa deload örneği gerçekten ağırlık düşürüyor", () => {
  assert.equal(deloadDemo.prescription.decision, "deload");
  assert.equal(deloadDemo.prescription.weight, 90);
});
