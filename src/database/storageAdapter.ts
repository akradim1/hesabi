/**
 * StorageAdapter Interface
 * Defines standard synchronous storage operations.
 * Allows switching from LocalStorage to files or SQLite easily in the future.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * LocalStorageAdapter
 * Browser-based implementation of the StorageAdapter.
 */
export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
