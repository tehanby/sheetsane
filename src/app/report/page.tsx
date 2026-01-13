'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisResult, Finding } from '@/lib/types';

type ReportState = 'loading' | 'analyzing' | 'ready' | 'error';

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-surface-light"
        />
        {/* Score circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke={getScoreColor(score)}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-3xl font-bold" style={{ color: getScoreColor(score) }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const classes = {
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
  };
  return (
    <span className={classes[severity as keyof typeof classes] || 'badge-info'}>
      {severity}
    </span>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [state, setState] = useState<ReportState>('loading');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const loadReport = useCallback(async () => {
    try {
      // First try to get existing analysis
      let response = await fetch('/api/analyze/');
      let data = await response.json();

      if (response.status === 402) {
        // Payment required - redirect to home
        router.push('/');
        return;
      }

      if (response.status === 401) {
        // Session expired
        router.push('/');
        return;
      }

      if (response.status === 404 || !data.result) {
        // Need to run analysis
        setState('analyzing');
        
        response = await fetch('/api/analyze/', {
          method: 'POST',
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }
      }

      setResult(data.result);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
      setState('error');
    }
  }, [router]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/report/download/');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SheetSane_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredFindings = result?.findings.filter(f => 
    filter === 'all' || f.severity === filter
  ) || [];

  if (state === 'loading' || state === 'analyzing') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="spinner !w-8 !h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {state === 'loading' ? 'Loading Report...' : 'Analyzing Spreadsheet...'}
          </h1>
          <p className="text-foreground/60">
            {state === 'analyzing' && 'Running all checks on your file'}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="animate-fade-in">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-foreground/60 mb-6">{error}</p>
          <a href="/" className="btn-primary inline-flex items-center justify-center">
            Start Over
          </a>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Sanity Report
          </h1>
          <p className="text-foreground/60 text-sm">
            {result.fileName} • Analyzed {new Date(result.analyzedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-primary flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <div className="spinner !w-4 !h-4 !border-2" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Score & Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Score Card */}
        <div className="card flex flex-col items-center animate-fade-in">
          <ScoreRing score={result.score} />
          <h2 className="font-display text-lg font-bold text-foreground mt-4 mb-1">
            Health Score
          </h2>
          <p className="text-sm text-foreground/50 text-center">
            {result.score >= 80 ? 'Looking good!' : result.score >= 50 ? 'Needs attention' : 'Critical issues found'}
          </p>
        </div>

        {/* Issue Counts */}
        <div className="card animate-fade-in animation-delay-100">
          <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wide mb-4">
            Issues Found
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-foreground">Errors</span>
              </div>
              <span className="font-mono text-lg font-bold text-foreground">{result.errorCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-foreground">Warnings</span>
              </div>
              <span className="font-mono text-lg font-bold text-foreground">{result.warningCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-foreground">Info</span>
              </div>
              <span className="font-mono text-lg font-bold text-foreground">{result.infoCount}</span>
            </div>
          </div>
        </div>

        {/* Sheets Summary */}
        <div className="card animate-fade-in animation-delay-200">
          <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wide mb-4">
            Sheets Analyzed
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {result.sheets.map(sheet => (
              <div key={sheet.name} className="flex items-center justify-between text-sm">
                <span className="text-foreground truncate flex-1 mr-2">{sheet.name}</span>
                <span className="text-foreground/50">{sheet.rowCount - 1} rows</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Explanation */}
      <div className="card mb-8 animate-fade-in animation-delay-300">
        <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wide mb-2">
          Score Breakdown
        </h3>
        <p className="text-foreground/80">{result.scoreExplanation}</p>
      </div>

      {/* Findings Table */}
      <div className="card animate-fade-in animation-delay-400">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Detailed Findings ({result.findings.length})
          </h3>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'error', 'warning', 'info'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filter === f
                    ? 'bg-primary text-black font-medium'
                    : 'bg-surface-light text-foreground/70 hover:bg-border'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="ml-1 opacity-70">
                    ({result.findings.filter(x => x.severity === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 text-foreground/50">
            {result.findings.length === 0 ? (
              <>
                <svg className="w-12 h-12 mx-auto mb-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-foreground">No issues found!</p>
                <p className="text-sm">Your spreadsheet looks great.</p>
              </>
            ) : (
              <p>No {filter} findings</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-medium text-foreground/50 uppercase tracking-wide">Severity</th>
                  <th className="px-6 py-3 text-xs font-medium text-foreground/50 uppercase tracking-wide">Category</th>
                  <th className="px-6 py-3 text-xs font-medium text-foreground/50 uppercase tracking-wide">Sheet</th>
                  <th className="px-6 py-3 text-xs font-medium text-foreground/50 uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredFindings.map((finding: Finding) => (
                  <tr key={finding.id} className="hover:bg-surface-light/50 transition-colors">
                    <td className="px-6 py-4">
                      <SeverityBadge severity={finding.severity} />
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {finding.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/70">
                      {finding.sheet}
                      {finding.column && (
                        <span className="text-foreground/50 ml-1">
                          [{finding.column}]
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80 max-w-md">
                      {finding.description}
                      {finding.cellRef && (
                        <span className="block text-xs text-foreground/50 mt-1">
                          Cells: {finding.cellRef}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {result.findings.length > 0 && (
        <div className="card mt-8 animate-fade-in animation-delay-500">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recommended Actions
          </h3>
          <div className="space-y-4">
            {Array.from(new Set(result.findings.map(f => f.suggestion))).map((suggestion, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">{i + 1}</span>
                </div>
                <p className="text-foreground/80 text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-12 text-center animate-fade-in animation-delay-500">
        <p className="text-foreground/50 mb-4">Need to analyze another file?</p>
        <a href="/" className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload New File
        </a>
      </div>
    </div>
  );
}
