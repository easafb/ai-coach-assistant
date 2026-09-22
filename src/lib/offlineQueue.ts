/**
 * ÇEVRİMDIŞI SET KUYRUĞU
 *
 * Salon bodrumlarında sinyal kopuyor ve her set kaydı sunucuya gidiyordu;
 * bağlantı yoksa set kayboluyordu.
 *
 * Desen "giden kutusu": set önce YEREL DEPOYA yazılıyor, arayüz anında
 * güncelleniyor, gönderim arka planda deneniyor. Başarısız olursa kuyrukta
 * bekliyor ve bağlantı gelince tekrar deneniyor.
 *
 * localStorage bilerek tercih edildi; IndexedDB burada gereksiz. Bir
 * antrenman ~30 set, her biri küçük bir nesne — toplam birkaç kilobayt.
 *
 * BİLİNEN SINIR: kuyruk yalnızca uygulama açıkken boşalıyor. Kullanıcı
 * çevrimdışıyken uygulamayı kapatıp bir daha hiç açmazsa setler gönderilmez.
 * Bunu çözmek service worker + background sync gerektiriyor.
 */

const STORAGE_KEY = "coachai.pendingSets.v1";

export interface PendingSet {
  clientId: string;
  sessionId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  queuedAt: string;
}

/** localStorage her ortamda yok (SSR, gizli mod, kapalı site verisi). */
function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readQueue(): PendingSet[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingSet[]) : [];
  } catch {
    // Bozuk veri kullanıcıyı kilitlemesin.
    return [];
  }
}

function writeQueue(items: PendingSet[]): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Kota dolduysa yapacak bir şey yok; set sunucuya gitmeye çalışmaya devam eder.
  }
}

export function enqueue(item: PendingSet): void {
  writeQueue([...readQueue(), item]);
}

export function dequeue(clientId: string): void {
  writeQueue(readQueue().filter((i) => i.clientId !== clientId));
}

/** Belirli bir antrenmana ait bekleyen setler. */
export function pendingFor(sessionId: string): PendingSet[] {
  return readQueue().filter((i) => i.sessionId === sessionId);
}

/**
 * Tarayıcı çevrimiçi mi?
 * navigator.onLine yanlış pozitif verebiliyor (ağa bağlı ama internet yok),
 * o yüzden yalnızca "kesinlikle çevrimdışı" durumunu güvenilir sayıyoruz.
 */
export function isDefinitelyOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Eski tarayıcılar için yedek; benzersizlik için yeterli.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
