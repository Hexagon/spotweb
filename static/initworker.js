// Register the service worker (offline fallback page)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/worker.js").catch((e) => console.warn("Service worker registration failed", e));
}
