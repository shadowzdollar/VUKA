import { useSyncExternalStore } from "react";

const KEY = "vuka.dataSaver";
const listeners = new Set<() => void>();

function browserHint(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !!c?.saveData;
}

function read(): boolean {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "on") return true;
    if (v === "off") return false;
  } catch {
    /* storage unavailable: fall through to the browser's own hint */
  }
  return browserHint();
}

export function setDataSaver(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** True when the visitor chose data-saver, or their browser asks for reduced data (Save-Data). */
export function useDataSaver(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => false,
  );
}
