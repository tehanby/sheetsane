/**
 * PDF Report Generator using PDFKit
 * Creates a professional sanity report document
 */

import PDFDocument from 'pdfkit';
import type { AnalysisResult, Finding } from './types';

// Colors
const COLORS = {
  primary: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
};

/**
 * Get color for severity
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'error': return COLORS.error;
    case 'warning': return COLORS.warning;
    case 'info': return COLORS.info;
    default: return COLORS.text;
  }
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.primary;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

/**
 * Generate PDF report from analysis result
 */
export function generatePDFReport(result: AnalysisResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Spreadsheet Sanity Report',
          Author: 'SheetSane',
          Subject: `Analysis of ${result.fileName}`,
          Creator: 'SheetSane - sheetsane.com',
        },
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title Page
      renderTitlePage(doc, result);
      doc.addPage();

      // Summary Section
      renderSummary(doc, result);

      // Findings Table
      if (result.findings.length > 0) {
        renderFindings(doc, result.findings);
      }

      // Suggestions Section
      renderSuggestions(doc, result.findings);

      // Footer on all pages
      const pageCount = doc.bufferedPageRange();
      for (let i = 0; i < pageCount.count; i++) {
        doc.switchToPage(i);
        renderFooter(doc, i + 1, pageCount.count);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Render title page
 */
function renderTitlePage(doc: PDFKit.PDFDocument, result: AnalysisResult): void {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Logo/Title area
  doc.moveDown(4);
  
  doc.fontSize(32)
    .fillColor(COLORS.primary)
    .text('SheetSane', { align: 'center' });
  
  doc.moveDown(0.5);
  
  doc.fontSize(24)
    .fillColor(COLORS.text)
    .text('Spreadsheet Sanity Report', { align: 'center' });

  doc.moveDown(3);

  // Score circle representation
  const scoreColor = getScoreColor(result.score);
  doc.fontSize(72)
    .fillColor(scoreColor)
    .text(result.score.toString(), { align: 'center' });
  
  doc.fontSize(16)
    .fillColor(COLORS.textLight)
    .text('out of 100', { align: 'center' });

  doc.moveDown(3);

  // File info box
  const boxY = doc.y;
  const boxHeight = 100;
  const boxX = doc.page.margins.left + (pageWidth - 400) / 2;
  
  doc.rect(boxX, boxY, 400, boxHeight)
    .fillColor(COLORS.background)
    .fill();

  doc.fillColor(COLORS.text);
  doc.y = boxY + 15;
  
  doc.fontSize(12)
    .text('File:', boxX + 20, doc.y, { continued: true })
    .font('Helvetica-Bold')
    .text(` ${result.fileName}`, { lineBreak: true })
    .font('Helvetica');

  doc.moveDown(0.3);
  doc.text('Analyzed:', boxX + 20, doc.y, { continued: true })
    .text(` ${new Date(result.analyzedAt).toLocaleString()}`);

  doc.moveDown(0.3);
  doc.text('Sheets:', boxX + 20, doc.y, { continued: true })
    .text(` ${result.sheets.length}`);

  doc.moveDown(4);
  doc.y = boxY + boxHeight + 40;

  // Issue counts
  doc.fontSize(14);
  const counts = [
    { label: 'Errors', count: result.errorCount, color: COLORS.error },
    { label: 'Warnings', count: result.warningCount, color: COLORS.warning },
    { label: 'Info', count: result.infoCount, color: COLORS.info },
  ];

  const countWidth = pageWidth / 3;
  counts.forEach((item, index) => {
    const x = doc.page.margins.left + countWidth * index + countWidth / 2;
    doc.fillColor(item.color)
      .fontSize(28)
      .text(item.count.toString(), x - 30, doc.y, { width: 60, align: 'center' });
  });

  doc.moveDown(0.5);
  const labelY = doc.y;
  counts.forEach((item, index) => {
    const x = doc.page.margins.left + countWidth * index + countWidth / 2;
    doc.fillColor(COLORS.textLight)
      .fontSize(11)
      .text(item.label, x - 40, labelY, { width: 80, align: 'center' });
  });
}

/**
 * Render summary section
 */
function renderSummary(doc: PDFKit.PDFDocument, result: AnalysisResult): void {
  doc.fontSize(18)
    .fillColor(COLORS.text)
    .text('Summary', { underline: true });
  
  doc.moveDown(0.5);

  doc.fontSize(11)
    .fillColor(COLORS.textLight)
    .text(result.scoreExplanation, { lineGap: 2 });

  doc.moveDown(1);

  // Sheets analyzed
  doc.fontSize(14)
    .fillColor(COLORS.text)
    .text('Sheets Analyzed:');

  doc.moveDown(0.3);

  result.sheets.forEach(sheet => {
    const hiddenTag = sheet.isHidden ? ' (hidden)' : '';
    const dataTag = sheet.hasData ? `${sheet.rowCount - 1} rows` : 'No data';
    doc.fontSize(10)
      .fillColor(COLORS.text)
      .text(`• ${sheet.name}${hiddenTag}: ${sheet.columnCount} columns, ${dataTag}`, {
        indent: 15,
      });
  });

  doc.moveDown(1.5);
}

/**
 * Render findings table
 */
function renderFindings(doc: PDFKit.PDFDocument, findings: Finding[]): void {
  doc.fontSize(18)
    .fillColor(COLORS.text)
    .text('Detailed Findings', { underline: true });
  
  doc.moveDown(0.5);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = {
    severity: 60,
    category: 100,
    sheet: 80,
    description: pageWidth - 240,
  };

  // Table header
  const headerY = doc.y;
  doc.fontSize(9)
    .fillColor(COLORS.textLight)
    .font('Helvetica-Bold');

  let x = doc.page.margins.left;
  doc.text('Severity', x, headerY, { width: colWidths.severity });
  x += colWidths.severity;
  doc.text('Category', x, headerY, { width: colWidths.category });
  x += colWidths.category;
  doc.text('Sheet', x, headerY, { width: colWidths.sheet });
  x += colWidths.sheet;
  doc.text('Description', x, headerY, { width: colWidths.description });

  doc.font('Helvetica');
  doc.moveDown(0.5);

  // Draw header underline
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .strokeColor(COLORS.border)
    .stroke();

  doc.moveDown(0.3);

  // Table rows
  findings.forEach((finding, index) => {
    // Check if we need a new page
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
      doc.y = doc.page.margins.top;
    }

    const rowY = doc.y;
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.rect(doc.page.margins.left, rowY - 3, pageWidth, 28)
        .fillColor('#fafafa')
        .fill();
    }

    x = doc.page.margins.left;
    doc.fontSize(9);

    // Severity
    doc.fillColor(getSeverityColor(finding.severity))
      .text(finding.severity.toUpperCase(), x + 2, rowY, { width: colWidths.severity - 4 });

    // Category
    x += colWidths.severity;
    doc.fillColor(COLORS.text)
      .text(finding.category, x, rowY, { width: colWidths.category - 4 });

    // Sheet
    x += colWidths.category;
    doc.text(finding.sheet, x, rowY, { width: colWidths.sheet - 4 });

    // Description (wrapped)
    x += colWidths.sheet;
    let desc = finding.description;
    if (finding.column) desc = `[${finding.column}] ${desc}`;
    
    // Truncate very long descriptions
    if (desc.length > 150) {
      desc = desc.substring(0, 147) + '...';
    }
    
    doc.text(desc, x, rowY, { width: colWidths.description - 4 });

    doc.y = rowY + 25;
  });

  doc.moveDown(1);
}

/**
 * Render suggestions section
 */
function renderSuggestions(doc: PDFKit.PDFDocument, findings: Finding[]): void {
  // Check if we need a new page
  if (doc.y > doc.page.height - 200) {
    doc.addPage();
  }

  doc.fontSize(18)
    .fillColor(COLORS.text)
    .text('Recommended Actions', { underline: true });
  
  doc.moveDown(0.5);

  // Group suggestions by category
  const suggestionsByCategory: Record<string, string[]> = {};
  
  findings.forEach(finding => {
    if (!suggestionsByCategory[finding.category]) {
      suggestionsByCategory[finding.category] = [];
    }
    if (!suggestionsByCategory[finding.category].includes(finding.suggestion)) {
      suggestionsByCategory[finding.category].push(finding.suggestion);
    }
  });

  if (Object.keys(suggestionsByCategory).length === 0) {
    doc.fontSize(11)
      .fillColor(COLORS.primary)
      .text('✓ No issues found! Your spreadsheet looks great.', { lineGap: 2 });
    return;
  }

  Object.entries(suggestionsByCategory).forEach(([category, suggestions]) => {
    // Check page break
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc.fontSize(12)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text(category);
    
    doc.font('Helvetica');
    doc.moveDown(0.2);

    suggestions.forEach(suggestion => {
      doc.fontSize(10)
        .fillColor(COLORS.textLight)
        .text(`• ${suggestion}`, { indent: 10, lineGap: 2 });
    });

    doc.moveDown(0.5);
  });
}

/**
 * Render footer on each page
 */
function renderFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number): void {
  const y = doc.page.height - 35;
  
  doc.fontSize(8)
    .fillColor(COLORS.textLight)
    .text(
      `Generated by SheetSane | Page ${pageNum} of ${totalPages}`,
      doc.page.margins.left,
      y,
      {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'center',
      }
    );
}
