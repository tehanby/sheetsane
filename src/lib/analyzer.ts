/**
 * Spreadsheet Analysis Engine
 * Performs deterministic checks on Excel workbooks
 */

import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type {
  Finding,
  SheetInfo,
  ColumnCandidate,
  AnalysisPreview,
  AnalysisResult,
  Severity,
} from './types';
import { MAX_SHEETS, MAX_ROWS_PER_SHEET, MAX_COLS_PER_SHEET } from './limits';

// Excel error values to detect
const EXCEL_ERRORS = ['#REF!', '#DIV/0!', '#NAME?', '#VALUE!', '#N/A', '#NULL!', '#NUM!', '#GETTING_DATA'];

// Patterns for identifying likely ID/key columns
const KEY_COLUMN_PATTERNS = /^(id|ID|Id|_id|sku|SKU|order|Order|email|Email|order_id|orderId|user_id|userId|product_id|productId)$/i;

// Date-like patterns
const DATE_PATTERNS = [
  /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/,
  /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/,
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
];

/**
 * Get column letter from index (0 = A, 1 = B, etc.)
 */
function getColumnLetter(index: number): string {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Parse workbook from buffer
 */
export function parseWorkbook(buffer: Buffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellNF: true });
}

/**
 * Get sheet information
 */
function getSheetInfo(workbook: XLSX.WorkBook): SheetInfo[] {
  const sheets: SheetInfo[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Check if sheet is hidden
    const sheetProps = workbook.Workbook?.Sheets?.find(s => s.name === sheetName);
    const isHidden = sheetProps?.Hidden === 1 || sheetProps?.Hidden === 2;

    // Get headers from first row
    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? String(cell.v || '') : '');
    }

    const rowCount = range.e.r - range.s.r + 1;
    const columnCount = range.e.c - range.s.c + 1;
    const hasData = rowCount > 1;

    sheets.push({
      name: sheetName,
      isHidden,
      rowCount,
      columnCount,
      headers,
      hasData,
    });
  }

  return sheets;
}

/**
 * Find potential key/ID columns
 */
function findPotentialKeyColumns(workbook: XLSX.WorkBook): ColumnCandidate[] {
  const candidates: ColumnCandidate[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
      const headerValue = headerCell ? String(headerCell.v || '') : '';

      if (KEY_COLUMN_PATTERNS.test(headerValue)) {
        // Get sample values (up to 5)
        const sampleValues: string[] = [];
        for (let row = range.s.r + 1; row <= Math.min(range.s.r + 5, range.e.r); row++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
          if (cell && cell.v !== undefined) {
            sampleValues.push(String(cell.v));
          }
        }

        candidates.push({
          sheet: sheetName,
          column: headerValue,
          columnIndex: col,
          sampleValues,
        });
      }
    }
  }

  return candidates;
}

/**
 * Generate analysis preview (before payment)
 */
export function generatePreview(
  buffer: Buffer,
  fileId: string,
  fileName: string,
  fileSize: number
): AnalysisPreview {
  const workbook = parseWorkbook(buffer);
  const sheets = getSheetInfo(workbook);
  const potentialKeyColumns = findPotentialKeyColumns(workbook);

  const checksToRun = [
    'Workbook integrity check',
    'Hidden sheets detection',
    'Header quality analysis',
    'Empty data detection',
    'Formula error scanning',
    'Excel error value detection',
    'Data type anomaly detection',
  ];

  if (potentialKeyColumns.length > 0) {
    checksToRun.push('Duplicate key detection');
  }

  return {
    fileId,
    fileName,
    fileSize,
    sheets,
    potentialKeyColumns,
    checksToRun,
  };
}

/**
 * Run full analysis on workbook
 */
export function analyzeWorkbook(
  buffer: Buffer,
  fileId: string,
  fileName: string,
  selectedKeyColumn?: { sheet: string; column: string; columnIndex: number }
): AnalysisResult {
  const workbook = parseWorkbook(buffer);
  const sheets = getSheetInfo(workbook);
  const findings: Finding[] = [];

  // 1. Workbook integrity check
  if (workbook.SheetNames.length === 0) {
    findings.push({
      id: uuidv4(),
      severity: 'error',
      category: 'Workbook Integrity',
      sheet: '-',
      description: 'No sheets found in workbook',
      suggestion: 'Ensure the Excel file contains at least one worksheet with data.',
    });
    return createEmptyResult(fileId, fileName, findings, sheets);
  }

  // Check sheet limit
  const sheetsToProcess = workbook.SheetNames.slice(0, MAX_SHEETS);
  const sheetsExceeded = workbook.SheetNames.length > MAX_SHEETS;
  
  if (sheetsExceeded) {
    findings.push({
      id: uuidv4(),
      severity: 'warning',
      category: 'Processing Limits',
      sheet: '-',
      description: `Workbook contains ${workbook.SheetNames.length} sheets. Only the first ${MAX_SHEETS} sheets will be analyzed due to processing limits.`,
      suggestion: `Consider splitting your workbook or analyzing sheets in batches. Only sheets: ${sheetsToProcess.join(', ')} will be processed.`,
    });
  }

  // 2. Hidden sheets detection
  const hiddenSheets = sheets.filter(s => s.isHidden);
  if (hiddenSheets.length > 0) {
    findings.push({
      id: uuidv4(),
      severity: 'warning',
      category: 'Hidden Sheets',
      sheet: hiddenSheets.map(s => s.name).join(', '),
      description: `${hiddenSheets.length} hidden sheet(s) found: ${hiddenSheets.map(s => s.name).join(', ')}`,
      suggestion: 'Review hidden sheets for important data that may be overlooked.',
    });
  }

  // Process each sheet (up to MAX_SHEETS)
  for (const sheetName of sheetsToProcess) {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Check row and column limits
    const totalRows = range.e.r - range.s.r + 1;
    const totalCols = range.e.c - range.s.c + 1;
    const rowsExceeded = totalRows > MAX_ROWS_PER_SHEET;
    const colsExceeded = totalCols > MAX_COLS_PER_SHEET;

    // Limit processing range
    const maxRow = rowsExceeded ? range.s.r + MAX_ROWS_PER_SHEET - 1 : range.e.r;
    const maxCol = colsExceeded ? range.s.c + MAX_COLS_PER_SHEET - 1 : range.e.c;
    const limitedRange = {
      s: { r: range.s.r, c: range.s.c },
      e: { r: maxRow, c: maxCol },
    };

    if (rowsExceeded || colsExceeded) {
      const limits: string[] = [];
      if (rowsExceeded) limits.push(`${totalRows} rows (limit: ${MAX_ROWS_PER_SHEET})`);
      if (colsExceeded) limits.push(`${totalCols} columns (limit: ${MAX_COLS_PER_SHEET})`);
      
      findings.push({
        id: uuidv4(),
        severity: 'warning',
        category: 'Processing Limits',
        sheet: sheetName,
        description: `Sheet "${sheetName}" exceeds processing limits: ${limits.join(', ')}. Only the first ${MAX_ROWS_PER_SHEET} rows and ${MAX_COLS_PER_SHEET} columns will be analyzed.`,
        suggestion: 'Consider splitting large sheets or analyzing in sections. Results may be incomplete for this sheet.',
      });
    }

    // 3. Header quality checks
    const headers: string[] = [];
    const emptyHeaders: string[] = [];
    const headerCounts: Record<string, number> = {};

    for (let col = limitedRange.s.c; col <= limitedRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellAddress];
      const value = cell ? String(cell.v || '') : '';
      const colLetter = getColumnLetter(col);

      if (!value.trim()) {
        emptyHeaders.push(colLetter);
      } else {
        headers.push(value);
        headerCounts[value] = (headerCounts[value] || 0) + 1;
      }
    }

    // Check for missing header row (all empty)
    if (emptyHeaders.length === limitedRange.e.c - limitedRange.s.c + 1) {
      findings.push({
        id: uuidv4(),
        severity: 'error',
        category: 'Header Quality',
        sheet: sheetName,
        description: 'Missing header row - first row is completely blank',
        suggestion: 'Add descriptive column headers in the first row.',
      });
    } else if (emptyHeaders.length > 0) {
      findings.push({
        id: uuidv4(),
        severity: 'warning',
        category: 'Header Quality',
        sheet: sheetName,
        column: emptyHeaders.join(', '),
        description: `Empty column headers in columns: ${emptyHeaders.join(', ')}`,
        suggestion: 'Add headers to all columns for better data clarity.',
      });
    }

    // Check for duplicate headers
    const duplicates = Object.entries(headerCounts)
      .filter(([, count]) => count > 1)
      .map(([name]) => name);

    if (duplicates.length > 0) {
      findings.push({
        id: uuidv4(),
        severity: 'warning',
        category: 'Header Quality',
        sheet: sheetName,
        description: `Duplicate column headers: ${duplicates.join(', ')}`,
        suggestion: 'Rename duplicate headers to ensure unique column identifiers.',
      });
    }

    // 4. Empty data check
    if (range.e.r === range.s.r) {
      findings.push({
        id: uuidv4(),
        severity: 'warning',
        category: 'Empty Data',
        sheet: sheetName,
        description: 'Sheet contains only header row with no data rows',
        suggestion: 'Add data rows or remove empty sheet if not needed.',
      });
    }

    // 5 & 6. Formula and error value checks
    const errorCells: { ref: string; error: string }[] = [];

    for (let row = limitedRange.s.r; row <= limitedRange.e.r; row++) {
      for (let col = limitedRange.s.c; col <= limitedRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];

        if (cell) {
          // Check for error type cells
          if (cell.t === 'e') {
            errorCells.push({ ref: cellAddress, error: String(cell.w || cell.v) });
          }
          // Check cell value for error strings
          else if (typeof cell.v === 'string') {
            const errorMatch = EXCEL_ERRORS.find(err => cell.v === err);
            if (errorMatch) {
              errorCells.push({ ref: cellAddress, error: errorMatch });
            }
          }
        }
      }
    }

    if (errorCells.length > 0) {
      // Group by error type
      const errorGroups: Record<string, string[]> = {};
      for (const { ref, error } of errorCells) {
        if (!errorGroups[error]) errorGroups[error] = [];
        errorGroups[error].push(ref);
      }

      for (const [error, refs] of Object.entries(errorGroups)) {
        const displayRefs = refs.length > 10 
          ? refs.slice(0, 10).join(', ') + ` and ${refs.length - 10} more`
          : refs.join(', ');

        findings.push({
          id: uuidv4(),
          severity: 'error',
          category: 'Formula Errors',
          sheet: sheetName,
          cellRef: displayRefs,
          description: `${refs.length} cell(s) contain ${error} error: ${displayRefs}`,
          suggestion: getErrorSuggestion(error),
        });
      }
    }

    // 7. Data type anomaly detection
    analyzeDataTypeAnomalies(worksheet, limitedRange, sheetName, findings);

    // 8. Duplicate key detection (if selected)
    if (selectedKeyColumn && selectedKeyColumn.sheet === sheetName) {
      detectDuplicateKeys(worksheet, limitedRange, selectedKeyColumn, findings);
    }
  }

  // Calculate score
  const { score, explanation } = calculateScore(findings);

  return {
    fileId,
    fileName,
    analyzedAt: new Date().toISOString(),
    score,
    scoreExplanation: explanation,
    errorCount: findings.filter(f => f.severity === 'error').length,
    warningCount: findings.filter(f => f.severity === 'warning').length,
    infoCount: findings.filter(f => f.severity === 'info').length,
    findings,
    sheets,
  };
}

/**
 * Create empty result when workbook has no sheets
 */
function createEmptyResult(
  fileId: string,
  fileName: string,
  findings: Finding[],
  sheets: SheetInfo[]
): AnalysisResult {
  const { score, explanation } = calculateScore(findings);
  return {
    fileId,
    fileName,
    analyzedAt: new Date().toISOString(),
    score,
    scoreExplanation: explanation,
    errorCount: findings.filter(f => f.severity === 'error').length,
    warningCount: findings.filter(f => f.severity === 'warning').length,
    infoCount: findings.filter(f => f.severity === 'info').length,
    findings,
    sheets,
  };
}

/**
 * Analyze data type anomalies in columns
 */
function analyzeDataTypeAnomalies(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  sheetName: string,
  findings: Finding[]
): void {
  for (let col = range.s.c; col <= range.e.c; col++) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
    const headerValue = headerCell ? String(headerCell.v || '') : '';
    const colLetter = getColumnLetter(col);

    // Collect column data (respect row limit)
    const values: { value: unknown; type: string; row: number }[] = [];
    const maxDataRow = Math.min(range.e.r, range.s.r + MAX_ROWS_PER_SHEET);
    for (let row = range.s.r + 1; row <= maxDataRow; row++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.v !== undefined) {
        values.push({
          value: cell.v,
          type: cell.t,
          row: row + 1, // 1-indexed for user
        });
      }
    }

    if (values.length < 5) continue; // Skip columns with too few values

    // Check for date-like text values
    const textDateCount = values.filter(v => {
      if (typeof v.value !== 'string') return false;
      return DATE_PATTERNS.some(pattern => pattern.test(v.value as string));
    }).length;

    if (textDateCount > 0 && textDateCount / values.length > 0.2) {
      findings.push({
        id: uuidv4(),
        severity: 'warning',
        category: 'Data Type Anomaly',
        sheet: sheetName,
        column: headerValue || colLetter,
        description: `${textDateCount} values (${Math.round(textDateCount / values.length * 100)}%) appear to be text-formatted dates`,
        suggestion: 'Convert text dates to proper Excel date format for better sorting and calculations.',
      });
    }

    // Check for numeric columns with text values
    const numericCount = values.filter(v => v.type === 'n').length;
    const stringCount = values.filter(v => v.type === 's').length;

    if (numericCount > values.length * 0.5 && stringCount > values.length * 0.2) {
      findings.push({
        id: uuidv4(),
        severity: 'warning',
        category: 'Data Type Anomaly',
        sheet: sheetName,
        column: headerValue || colLetter,
        description: `Mixed data types: ${numericCount} numeric and ${stringCount} text values in a predominantly numeric column`,
        suggestion: 'Standardize column data types. Convert text numbers to numeric format.',
      });
    }
  }
}

/**
 * Detect duplicate keys in selected column
 */
function detectDuplicateKeys(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  keyColumn: { sheet: string; column: string; columnIndex: number },
  findings: Finding[]
): void {
  const valueCounts: Record<string, number[]> = {};

  // Respect row limit
  const maxDataRow = Math.min(range.e.r, range.s.r + MAX_ROWS_PER_SHEET);
  for (let row = range.s.r + 1; row <= maxDataRow; row++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: keyColumn.columnIndex })];
    if (cell && cell.v !== undefined) {
      const value = String(cell.v);
      if (!valueCounts[value]) valueCounts[value] = [];
      valueCounts[value].push(row + 1); // 1-indexed
    }
  }

  const duplicates = Object.entries(valueCounts)
    .filter(([, rows]) => rows.length > 1)
    .map(([value, rows]) => ({ value, rows }));

  if (duplicates.length > 0) {
    const totalDuplicateRows = duplicates.reduce((sum, d) => sum + d.rows.length, 0);
    const displayDuplicates = duplicates.slice(0, 5).map(d => 
      `"${d.value}" (rows ${d.rows.slice(0, 3).join(', ')}${d.rows.length > 3 ? '...' : ''})`
    );

    findings.push({
      id: uuidv4(),
      severity: 'error',
      category: 'Duplicate Keys',
      sheet: keyColumn.sheet,
      column: keyColumn.column,
      rowNumbers: duplicates.flatMap(d => d.rows),
      description: `${duplicates.length} duplicate values found affecting ${totalDuplicateRows} rows: ${displayDuplicates.join('; ')}${duplicates.length > 5 ? ` and ${duplicates.length - 5} more` : ''}`,
      suggestion: 'Remove or fix duplicate key values to ensure data integrity.',
    });
  }
}

/**
 * Get suggestion for specific Excel error
 */
function getErrorSuggestion(error: string): string {
  const suggestions: Record<string, string> = {
    '#REF!': 'Fix broken cell references. A referenced cell may have been deleted.',
    '#DIV/0!': 'Check formulas dividing by zero. Add error handling or fix denominator.',
    '#NAME?': 'Fix undefined function or named range. Check for typos in formula names.',
    '#VALUE!': 'Correct data type mismatch. Ensure formula inputs are correct types.',
    '#N/A': 'Fix lookup formula - value not found. Check lookup criteria and data.',
    '#NULL!': 'Correct range intersection error. Use proper range operators.',
    '#NUM!': 'Fix invalid numeric value in formula. Check for out-of-range numbers.',
    '#GETTING_DATA': 'Wait for external data to load or check data connection.',
  };
  return suggestions[error] || 'Review and fix the formula error.';
}

/**
 * Calculate score based on findings
 */
function calculateScore(findings: Finding[]): { score: number; explanation: string } {
  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.filter(f => f.severity === 'warning').length;

  let score = 100;
  const errorPenalty = Math.min(errors * 10, 70);
  const warningPenalty = Math.min(warnings * 3, 30);

  score -= errorPenalty;
  score -= warningPenalty;
  score = Math.max(0, score);

  let explanation = `Starting score: 100. `;
  if (errors > 0) {
    explanation += `${errors} error(s) × 10 points = -${errorPenalty} (capped at 70). `;
  }
  if (warnings > 0) {
    explanation += `${warnings} warning(s) × 3 points = -${warningPenalty} (capped at 30). `;
  }
  if (errors === 0 && warnings === 0) {
    explanation += 'No issues found! ';
  }
  explanation += `Final score: ${score}/100.`;

  return { score, explanation };
}

