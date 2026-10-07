import { useSyncExternalStore } from "react";

const listeners = new Set();
let now = Date.now();
let timer = null;

const tick = () => {
  now = Date.now();
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  now = Date.now();
  listeners.add(listener);
  if (!timer) timer = window.setInterval(tick, 30_000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };
};

const disabledSubscribe = () => () => {};
const getSnapshot = () => now;

export default function useNotificationNow(enabled = true) {
  return useSyncExternalStore(
    enabled ? subscribe : disabledSubscribe,
    getSnapshot,
    getSnapshot,
  );
}
