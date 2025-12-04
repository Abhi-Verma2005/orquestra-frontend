// Ensure `indexedDB` is defined in server/SSR environments where some
// third-party browser-only libraries incorrectly assume it exists.
//
// This avoids runtime `ReferenceError: indexedDB is not defined` on Vercel
// while still signalling to those libraries that IndexedDB is effectively
// unavailable.

if (typeof globalThis !== "undefined" && !("indexedDB" in globalThis)) {
  (globalThis as any).indexedDB = undefined;
}


