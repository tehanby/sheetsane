'use client';

import { useState, useCallback, useRef } from 'react';
import type { AnalysisPreview, ColumnCandidate } from '@/lib/types';
import { storeFileInBrowser, isClientStorageAvailable } from '@/lib/client-storage';

type UploadState = 'idle' | 'uploading' | 'preview' | 'processing' | 'error';

export default function HomePage() {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AnalysisPreview | null>(null);
  const [selectedKeyColumn, setSelectedKeyColumn] = useState<ColumnCandidate | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setState('uploading');

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      setState('error');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      setState('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Store file in browser for persistence across server invocations
      if (isClientStorageAvailable() && data.preview?.fileId) {
        try {
          await storeFileInBrowser(
            data.preview.fileId,
            file.name,
            await file.arrayBuffer()
          );
        } catch (error) {
          console.warn('Failed to store file in browser:', error);
          // Continue anyway - this is a fallback feature
        }
      }

      setPreview(data.preview);
      
      // Auto-select first key column if available
      if (data.preview.potentialKeyColumns?.length > 0) {
        setSelectedKeyColumn(data.preview.potentialKeyColumns[0]);
      }
      
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setState('error');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleGenerateReport = useCallback(async () => {
    setState('processing');
    setError(null);

    try {
      const response = await fetch('/api/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedKeyColumn: selectedKeyColumn ? {
            sheet: selectedKeyColumn.sheet,
            column: selectedKeyColumn.column,
            columnIndex: selectedKeyColumn.columnIndex,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed to checkout');
      setState('preview');
    }
  }, [selectedKeyColumn]);

  const resetUpload = useCallback(() => {
    setState('idle');
    setError(null);
    setPreview(null);
    setSelectedKeyColumn(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const scrollToChecks = useCallback(() => {
    const checksSection = document.getElementById('checks');
    if (checksSection) {
      checksSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-12 animate-fade-in">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Instantly find errors in your Excel spreadsheets
        </h1>
        <p className="text-lg text-foreground/60 max-w-2xl mx-auto mb-8">
          Upload a spreadsheet and get a clear report of broken formulas, duplicates, and data issues. No signup.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
          >
            Check My Spreadsheet — $19
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <button
            onClick={scrollToChecks}
            className="text-foreground/60 hover:text-foreground transition-colors text-sm underline"
          >
            See what it checks
          </button>
        </div>
        <p className="text-sm text-foreground/50 mb-2">
          One-time payment. No subscription.
        </p>
        <p className="text-xs text-foreground/40">
          Catches issues that cost hours to find manually.
        </p>
      </section>

      {/* Trust + Benefits */}
      <section className="mb-12 animate-fade-in animation-delay-100">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 text-sm">
            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-foreground/80">Detect broken formulas and Excel errors</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-foreground/80">Find duplicate IDs and empty columns</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-foreground/80">Catch hidden sheets and data issues</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-foreground/80">Instant download-ready report</span>
          </div>
        </div>
      </section>

      {/* Upload / Preview Section */}
      {state === 'idle' || state === 'uploading' || state === 'error' ? (
        <section className="animate-fade-in animation-delay-100">
          {/* Upload Zone */}
          <div
            className={`drop-zone border border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragging ? 'dragging border-primary/60 bg-primary/5' : 'border-border/60 hover:border-border/80'
            } ${state === 'uploading' ? 'pointer-events-none opacity-60' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {state === 'uploading' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="spinner" />
                <p className="text-foreground/60">Uploading and analyzing...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-foreground mb-1">
                  Drop your Excel file here
                </p>
                <p className="text-sm text-foreground/50">
                  or click to browse • .xlsx, .xls up to 10MB
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

        </section>
      ) : (state === 'preview' || state === 'processing') && preview ? (
        /* Preview Section */
        <section className="animate-fade-in">
          <div className="card mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  File Ready for Analysis
                </h2>
                <p className="text-foreground/50 text-sm">
                  {preview.fileName} • {(preview.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={resetUpload}
                className="text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                ← Upload different file
              </button>
            </div>

            {/* Sheets Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground/70 mb-3 uppercase tracking-wide">
                Sheets Found ({preview.sheets.length})
              </h3>
              <div className="grid gap-2">
                {preview.sheets.map(sheet => (
                  <div 
                    key={sheet.name}
                    className="flex items-center justify-between py-2 px-3 bg-surface-light rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{sheet.name}</span>
                      {sheet.isHidden && (
                        <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          hidden
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-foreground/50">
                      {sheet.columnCount} cols • {sheet.rowCount - 1} rows
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Column Selection */}
            {preview.potentialKeyColumns.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground/70 mb-3 uppercase tracking-wide">
                  Duplicate Check Column (Optional)
                </h3>
                <p className="text-sm text-foreground/50 mb-3">
                  Select a column to check for duplicate values:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedKeyColumn(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      !selectedKeyColumn
                        ? 'bg-primary text-black font-medium'
                        : 'bg-surface-light text-foreground/70 hover:bg-border'
                    }`}
                  >
                    Skip
                  </button>
                  {preview.potentialKeyColumns.map(col => (
                    <button
                      key={`${col.sheet}-${col.column}`}
                      onClick={() => setSelectedKeyColumn(col)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedKeyColumn?.column === col.column && selectedKeyColumn?.sheet === col.sheet
                          ? 'bg-primary text-black font-medium'
                          : 'bg-surface-light text-foreground/70 hover:bg-border'
                      }`}
                    >
                      {col.column}
                      <span className="text-xs opacity-60 ml-1">({col.sheet})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Checks to Run */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground/70 mb-3 uppercase tracking-wide">
                Analysis Checks
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {preview.checksToRun.map(check => (
                  <div key={check} className="flex items-center gap-2 text-sm text-foreground/70">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {check}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="card bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-3xl font-bold text-foreground">$19</span>
                  <span className="text-foreground/50">one-time</span>
                </div>
                <p className="text-sm text-foreground/60">
                  Get your full sanity report with PDF download
                </p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={state === 'processing'}
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {state === 'processing' ? (
                  <>
                    <div className="spinner !w-5 !h-5 !border-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Generate Report
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </section>
      ) : null}

      {/* What It Checks Section */}
      <section id="checks" className="mt-16 mb-16 animate-fade-in animation-delay-300">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            What This Catches (Automatically)
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto">
            Comprehensive analysis of your spreadsheet for common errors and data quality issues
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-foreground mb-3">Formula Errors</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Broken formulas and Excel errors (#REF!, #DIV/0!, #VALUE!, #N/A)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Error values in cells that could break calculations</span>
              </li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-semibold text-foreground mb-3">Data Quality</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Duplicate values in key columns (ID/SKU/Email)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Empty or inconsistent headers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Data type mismatches (dates-as-text, numbers-as-text)</span>
              </li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-semibold text-foreground mb-3">Workbook Structure</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Hidden sheets that might contain important data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Sheets with only headers and no data rows</span>
              </li>
            </ul>
          </div>
          <div className="card">
            <h3 className="font-semibold text-foreground mb-3">Report Output</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Detailed score (0-100) with explanation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Professional PDF report ready to share</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Repeat */}
      <section className="mb-16 animate-fade-in animation-delay-400">
        <div className="card bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to check your spreadsheet?
          </h2>
          <button
            onClick={() => {
              if (state === 'idle' || state === 'error') {
                fileInputRef.current?.click();
              } else {
                scrollToChecks();
              }
            }}
            className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2 mb-3"
          >
            Check My Spreadsheet — $19
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <p className="text-sm text-foreground/50">
            Secure checkout. Fast results.
          </p>
        </div>
      </section>

      {/* Micro FAQ */}
      <section className="mb-12 animate-fade-in animation-delay-500">
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Does this modify my spreadsheet?
            </h3>
            <p className="text-sm text-foreground/60">
              No. Files are analyzed read-only and deleted after processing.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Will this work on large files?
            </h3>
            <p className="text-sm text-foreground/60">
              Files up to 10MB with multiple sheets are supported.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Line */}
      <section className="mb-12 text-center animate-fade-in animation-delay-500">
        <p className="text-sm text-foreground/50">
          Built for analysts, consultants, and operators who rely on spreadsheets every day.
        </p>
      </section>

      {/* Trust Indicators */}
      <section className="mt-16 text-center animate-fade-in animation-delay-500">
        <div className="flex flex-wrap justify-center gap-8 text-sm text-foreground/40">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure file handling
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Files deleted after 30 min
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Secure Stripe payment
          </div>
        </div>
      </section>
    </div>
  );
}
