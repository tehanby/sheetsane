/**
 * Client-Side File Storage
 * Stores file in browser's IndexedDB to persist across server invocations
 * This solves the Vercel serverless file loss issue
 */

const DB_NAME = 'sheetsane_files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

interface StoredFileData {
  fileId: string;
  fileName: string;
  fileData: ArrayBuffer;
  uploadedAt: number;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileId' });
      }
    };
  });
}

/**
 * Store file in IndexedDB
 */
export async function storeFileInBrowser(
  fileId: string,
  fileName: string,
  fileData: ArrayBuffer
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data: StoredFileData = {
      fileId,
      fileName,
      fileData,
      uploadedAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.warn('[ClientStorage] Failed to store file:', error);
    // Fail silently - this is a fallback feature
  }
}

/**
 * Retrieve file from IndexedDB
 */
export async function getFileFromBrowser(fileId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const data = await new Promise<StoredFileData | null>((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();

    if (!data) return null;

    // Check if expired (30 minutes)
    const TTL = 30 * 60 * 1000;
    if (Date.now() - data.uploadedAt > TTL) {
      await deleteFileFromBrowser(fileId);
      return null;
    }

    return data.fileData;
  } catch (error) {
    console.warn('[ClientStorage] Failed to retrieve file:', error);
    return null;
  }
}

/**
 * Delete file from IndexedDB
 */
export async function deleteFileFromBrowser(fileId: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.warn('[ClientStorage] Failed to delete file:', error);
  }
}

/**
 * Check if IndexedDB is available
 */
export function isClientStorageAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
