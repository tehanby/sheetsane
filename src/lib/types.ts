/**
 * Core types for SheetSane spreadsheet analysis
 */

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  sheet: string;
  column?: string;
  cellRef?: string;
  rowNumbers?: number[];
  description: string;
  suggestion: string;
}

export interface SheetInfo {
  name: string;
  isHidden: boolean;
  rowCount: number;
  columnCount: number;
  headers: string[];
  hasData: boolean;
}

export interface ColumnCandidate {
  sheet: string;
  column: string;
  columnIndex: number;
  sampleValues: string[];
}

export interface AnalysisPreview {
  fileId: string;
  fileName: string;
  fileSize: number;
  sheets: SheetInfo[];
  potentialKeyColumns: ColumnCandidate[];
  checksToRun: string[];
}

export interface AnalysisResult {
  fileId: string;
  fileName: string;
  analyzedAt: string;
  score: number;
  scoreExplanation: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  findings: Finding[];
  sheets: SheetInfo[];
}

export interface SessionPayload {
  fileId: string;
  fileName: string;
  paid: boolean;
  selectedKeyColumn?: {
    sheet: string;
    column: string;
    columnIndex: number;
  };
  createdAt: number;
  expiresAt: number;
}

export interface StoredFile {
  id: string;
  fileName: string;
  buffer: Buffer;
  uploadedAt: number;
  analysisResult?: AnalysisResult;
}

