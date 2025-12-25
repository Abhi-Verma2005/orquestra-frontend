// Ensure `indexedDB` is defined in server/SSR environments where some
// third-party browser-only libraries incorrectly assume it exists.
//
// This avoids runtime `ReferenceError: indexedDB is not defined` on Vercel
// while still signalling to those libraries that IndexedDB is effectively
// unavailable.
//
// We provide a mock object with no-op methods to prevent errors when libraries
// try to call methods like `.open()` on undefined.

if (typeof globalThis !== "undefined" && !("indexedDB" in globalThis)) {
  // Create a mock IndexedDB that provides no-op methods
  // This prevents errors when WalletConnect and other libraries try to access it
  // The mock returns request objects that are immediately in an error state
  const createMockRequest = () => {
    const error = new DOMException("IndexedDB is not available in SSR environment", "NotSupportedError");
    const request = {
      onerror: null,
      onsuccess: null,
      onblocked: null,
      onupgradeneeded: null,
      error,
      result: null,
      readyState: "done" as IDBRequestReadyState,
      source: null,
      transaction: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    return request;
  };

  const mockIDBFactory = {
    open: (name?: string, version?: number) => {
      const request = createMockRequest();
      // Immediately set error state
      (request as any).readyState = "done";
      return request as IDBOpenDBRequest;
    },
    deleteDatabase: (name: string) => {
      const request = createMockRequest();
      (request as any).readyState = "done";
      return request as IDBOpenDBRequest;
    },
    cmp: (first: any, second: any) => 0,
    databases: () => Promise.resolve([]),
  };

  (globalThis as any).indexedDB = mockIDBFactory;
}







