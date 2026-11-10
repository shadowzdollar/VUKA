/**
 * IndexedDB offline storage for VUKA border-zone traders.
 * Allows drafting invoices and queuing transactions when offline,
 * and automatically syncing once network returns.
 */

export interface OfflineDraftInvoice {
  id: string;
  traderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: string;
  createdAt: string;
  status: "DRAFT_OFFLINE" | "SYNCING" | "SYNCED";
}

const DB_NAME = "vuka_offline_store";
const DB_VERSION = 1;
const STORE_INVOICES = "draft_invoices";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_INVOICES)) {
        db.createObjectStore(STORE_INVOICES, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineDraft(draft: Omit<OfflineDraftInvoice, "id" | "createdAt" | "status">): Promise<OfflineDraftInvoice> {
  const db = await openDB();
  const item: OfflineDraftInvoice = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: "DRAFT_OFFLINE",
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_INVOICES, "readwrite");
    const store = tx.objectStore(STORE_INVOICES);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineDrafts(): Promise<OfflineDraftInvoice[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_INVOICES, "readonly");
      const store = tx.objectStore(STORE_INVOICES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteOfflineDraft(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_INVOICES, "readwrite");
    const store = tx.objectStore(STORE_INVOICES);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
