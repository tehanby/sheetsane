/**
 * Standardized Error Responses
 * Consistent error shape across all API routes
 */

export interface ApiError {
  ok: false;
  code: string;
  error: string;
}

export type ErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'EMPTY_FILE'
  | 'UNPAID'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'INTERNAL'
  | 'SESSION_EXPIRED'
  | 'INVALID_SESSION'
  | 'PAYMENT_REQUIRED'
  | 'FILE_EXPIRED'
  | 'PARSE_ERROR';

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400
): { json: ApiError; status: number } {
  return {
    json: {
      ok: false,
      code,
      error: message,
    },
    status,
  };
}

/**
 * Common error responses
 */
export const ERRORS = {
  FILE_TOO_LARGE: (maxSize: string) =>
    createErrorResponse('FILE_TOO_LARGE', `File too large. Maximum size is ${maxSize}`, 413),
  
  INVALID_FILE_TYPE: () =>
    createErrorResponse('INVALID_FILE_TYPE', 'Invalid file type. Please upload an Excel file (.xlsx or .xls)', 400),
  
  EMPTY_FILE: () =>
    createErrorResponse('EMPTY_FILE', 'File is empty or cannot be read', 400),
  
  UNPAID: () =>
    createErrorResponse('UNPAID', 'Payment required to perform this action', 402),
  
  NOT_FOUND: (resource: string = 'Resource') =>
    createErrorResponse('NOT_FOUND', `${resource} not found or expired`, 404),
  
  RATE_LIMIT: (remaining?: number) => {
    const message = remaining
      ? `Too many requests. Try again in ${Math.ceil(remaining / 1000)} seconds.`
      : 'Too many requests. Try again later.';
    return createErrorResponse('RATE_LIMIT', message, 429);
  },
  
  INTERNAL: (message: string = 'An internal error occurred') =>
    createErrorResponse('INTERNAL', message, 500),
  
  SESSION_EXPIRED: () =>
    createErrorResponse('SESSION_EXPIRED', 'Session expired or invalid. Please upload your file again.', 401),
  
  INVALID_SESSION: () =>
    createErrorResponse('INVALID_SESSION', 'Invalid session. Please upload your file again.', 401),
  
  PAYMENT_REQUIRED: () =>
    createErrorResponse('PAYMENT_REQUIRED', 'Payment required to generate report.', 402),
  
  FILE_EXPIRED: () =>
    createErrorResponse('FILE_EXPIRED', 'File expired. Please upload again.', 404),
  
  PARSE_ERROR: () =>
    createErrorResponse('PARSE_ERROR', 'Failed to parse Excel file. The file may be corrupted or password-protected.', 400),
};
