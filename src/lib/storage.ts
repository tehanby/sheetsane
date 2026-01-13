/**
 * Temporary File Storage
 * In-memory storage with automatic cleanup after 30 minutes
 * For production scale, consider using Redis or cloud storage
 */

import type { StoredFile, AnalysisResult } from './types';

// In-memory storage (for MVP - works well with Vercel serverless)
const fileStore = new Map<string, StoredFile>();

// Cleanup interval in milliseconds (5 minutes check)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
// File expiry in milliseconds (30 minutes)
const FILE_EXPIRY = 30 * 60 * 1000;

// Run cleanup periodically
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, file] of fileStore.entries()) {
      if (now - file.uploadedAt > FILE_EXPIRY) {
        fileStore.delete(id);
        console.log(`[Storage] Cleaned up expired file: ${id}`);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

// Start cleanup on module load
startCleanupInterval();

/**
 * Store a file in memory
 */
export function storeFile(id: string, fileName: string, buffer: Buffer): void {
  fileStore.set(id, {
    id,
    fileName,
    buffer,
    uploadedAt: Date.now(),
  });
  console.log(`[Storage] Stored file: ${id} (${fileName}, ${buffer.length} bytes)`);
}

/**
 * Retrieve a stored file
 */
export function getFile(id: string): StoredFile | null {
  const file = fileStore.get(id);
  
  if (!file) {
    return null;
  }

  // Check if expired
  if (Date.now() - file.uploadedAt > FILE_EXPIRY) {
    fileStore.delete(id);
    return null;
  }

  return file;
}

/**
 * Store analysis result with file
 */
export function storeAnalysisResult(fileId: string, result: AnalysisResult): void {
  const file = fileStore.get(fileId);
  if (file) {
    file.analysisResult = result;
    console.log(`[Storage] Stored analysis result for file: ${fileId}`);
  }
}

/**
 * Get analysis result for a file
 */
export function getAnalysisResult(fileId: string): AnalysisResult | null {
  const file = fileStore.get(fileId);
  return file?.analysisResult || null;
}

/**
 * Delete a file from storage
 */
export function deleteFile(id: string): boolean {
  const existed = fileStore.has(id);
  fileStore.delete(id);
  if (existed) {
    console.log(`[Storage] Deleted file: ${id}`);
  }
  return existed;
}

/**
 * Check if file exists
 */
export function fileExists(id: string): boolean {
  const file = fileStore.get(id);
  if (!file) return false;

  // Check if expired
  if (Date.now() - file.uploadedAt > FILE_EXPIRY) {
    fileStore.delete(id);
    return false;
  }

  return true;
}

/**
 * Get storage stats (for debugging)
 */
export function getStorageStats(): { fileCount: number; totalSize: number } {
  let totalSize = 0;
  for (const file of fileStore.values()) {
    totalSize += file.buffer.length;
  }
  return {
    fileCount: fileStore.size,
    totalSize,
  };
}