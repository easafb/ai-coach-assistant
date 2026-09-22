import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

/** Basit localStorage taklidi; modül depoyu tembel okuduğu için yeterli. */
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  get length() { return this.data.size; }
}

const store = new MemoryStorage();
(globalThis as unknown as { window: unknown }).window = { localStorage: store };

const {
  enqueue, dequeue, readQueue, pendingFor, newClientId, isDefinitelyOffline,
} = await import("./offlineQueue.ts");

const set = (clientId: string, sessionId: string) => ({
  clientId, sessionId,
  exerciseName: "Bench Press",
  weight: 60, reps: 8,
  queuedAt: "2026-09-22T10:00:00Z",
});

beforeEach(() => store.clear());

test("boş kuyruk boş dizi döner", () => {
  assert.deepEqual(readQueue(), []);
});

test("sıraya alınan setler eklenme sırasını korur", () => {
  // Sıra önemli: setler yapıldıkları sırayla gönderilmeli.
  enqueue(set("a", "s1"));
  enqueue(set("b", "s1"));
  enqueue(set("c", "s1"));
  assert.deepEqual(readQueue().map((i) => i.clientId), ["a", "b", "c"]);
});

test("gönderilen set kuyruktan çıkar, diğerleri kalır", () => {
  enqueue(set("a", "s1"));
  enqueue(set("b", "s1"));
  dequeue("a");
  assert.deepEqual(readQueue().map((i) => i.clientId), ["b"]);
});

test("olmayan bir kimliği çıkarmak kuyruğu bozmaz", () => {
  enqueue(set("a", "s1"));
  dequeue("yok");
  assert.equal(readQueue().length, 1);
});

test("bekleyenler antrenmana göre filtreleniyor", () => {
  // Kullanıcı bir antrenmanı yarım bırakıp başkasına başlayabilir;
  // bitirme kontrolü yalnızca o antrenmanın setlerine bakmalı.
  enqueue(set("a", "s1"));
  enqueue(set("b", "s2"));
  enqueue(set("c", "s1"));
  assert.deepEqual(pendingFor("s1").map((i) => i.clientId), ["a", "c"]);
  assert.deepEqual(pendingFor("s2").map((i) => i.clientId), ["b"]);
});

test("bozuk veri kullanıcıyı kilitlemez", () => {
  store.setItem("coachai.pendingSets.v1", "{bu json degil");
  assert.deepEqual(readQueue(), []);
  // Bozuk veriden sonra yazmaya devam edilebilmeli.
  enqueue(set("a", "s1"));
  assert.equal(readQueue().length, 1);
});

test("dizi olmayan veri yok sayılır", () => {
  store.setItem("coachai.pendingSets.v1", '{"bu":"nesne"}');
  assert.deepEqual(readQueue(), []);
});

test("set verisi kayıpsız saklanıyor", () => {
  enqueue({ ...set("a", "s1"), weight: 62.5, reps: 12 });
  const [saved] = readQueue();
  assert.equal(saved.weight, 62.5);
  assert.equal(saved.reps, 12);
  assert.equal(saved.exerciseName, "Bench Press");
});

test("istemci kimlikleri benzersiz", () => {
  const ids = new Set(Array.from({ length: 200 }, () => newClientId()));
  assert.equal(ids.size, 200);
});

test("navigator yokken çevrimdışı varsayılmıyor", () => {
  // Sunucuda veya navigator olmayan ortamda yanlışlıkla "çevrimdışı"
  // demek, kullanıcıya gereksiz uyarı göstermek olurdu.
  assert.equal(isDefinitelyOffline(), false);
});
