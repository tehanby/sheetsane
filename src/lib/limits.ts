/**
 * Processing Limits and Constants
 * Hard limits to prevent abuse and control infrastructure costs
 */

// File size limit: 10MB
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Workbook processing limits
export const MAX_SHEETS = 20;
export const MAX_ROWS_PER_SHEET = 10000;
export const MAX_COLS_PER_SHEET = 200;

// Temp file TTL: 30 minutes
export const TTL_MS = 30 * 60 * 1000;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
