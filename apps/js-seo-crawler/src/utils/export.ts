import {CrawlResult} from '../types';

export function exportToCSV(result: CrawlResult): string {
  const rows: string[] = [];

  rows.push('Category,Issue Type,Message,Value');

  result.issues.forEach((issue) => {
    rows.push(`"${issue.category}","${issue.type}","${issue.message}","${issue.value || ''}"`);
  });

  rows.push('');
  rows.push('Section,Item,Value');
  rows.push(`"Basic","Title","${result.title}"`);
  rows.push(`"Basic","Meta Description","${result.metaDescription}"`);
  rows.push(`"Basic","Canonical","${result.canonical}"`);
  rows.push(`"Basic","Robots","${result.robots}"`);
  rows.push(`"Basic","Word Count","${result.wordCount}"`);
  rows.push(`"Basic","HTML Size","${result.htmlSize} bytes"`);

  result.headings.forEach((h) => {
    rows.push(`"Headings","H${h.level}","${h.text}"`);
  });

  result.images.forEach((img) => {
    rows.push(`"Images","${img.src}","Alt: ${img.alt || 'MISSING'}"`);
  });

  return rows.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(result: CrawlResult): void {
  const csv = exportToCSV(result);
  const domain = new URL(result.url).hostname.replace('www.', '');
  downloadFile(csv, `seo-audit-${domain}.csv`, 'text/csv');
}

export function exportToJSON(result: CrawlResult): string {
  return JSON.stringify(result, null, 2);
}

export function downloadJSON(result: CrawlResult): void {
  const json = exportToJSON(result);
  const domain = new URL(result.url).hostname.replace('www.', '');
  downloadFile(json, `seo-audit-${domain}.json`, 'application/json');
}

export function generatePDFContent(result: CrawlResult): string {
  const lines: string[] = [];

  lines.push('SEO AUDIT REPORT');
  lines.push('='.repeat(60));
  lines.push(`URL: ${result.url}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push('');

  lines.push('BASIC INFORMATION');
  lines.push('-'.repeat(60));
  lines.push(`Title: ${result.title || 'MISSING'}`);
  lines.push(`Meta Description: ${result.metaDescription || 'MISSING'}`);
  lines.push(`Canonical: ${result.canonical || 'MISSING'}`);
  lines.push(`Robots: ${result.robots || 'Not set'}`);
  lines.push(`Word Count: ${result.wordCount}`);
  lines.push(`HTML Size: ${result.htmlSize} bytes`);
  lines.push('');

  lines.push('ISSUES SUMMARY');
  lines.push('-'.repeat(60));
  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');
  const infos = result.issues.filter((i) => i.type === 'info');
  lines.push(`Errors: ${errors.length}`);
  lines.push(`Warnings: ${warnings.length}`);
  lines.push(`Info: ${infos.length}`);
  lines.push('');

  if (errors.length > 0) {
    lines.push('ERRORS');
    errors.forEach((e) => lines.push(`  - [${e.category}] ${e.message}`));
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('WARNINGS');
    warnings.forEach((w) => lines.push(`  - [${w.category}] ${w.message}`));
    lines.push('');
  }

  lines.push('HEADINGS');
  lines.push('-'.repeat(60));
  result.headings.forEach((h) => {
    lines.push(`${'  '.repeat(h.level - 1)}H${h.level}: ${h.text}`);
  });
  lines.push('');

  lines.push('IMAGES');
  lines.push('-'.repeat(60));
  result.images.forEach((img) => {
    lines.push(`${img.hasAlt ? '✓' : '✗'} ${img.src} ${img.hasAlt ? '' : '(MISSING ALT)'}`);
  });
  lines.push('');

  lines.push('SCHEMA MARKUP');
  lines.push('-'.repeat(60));
  if (result.schemas.length === 0) {
    lines.push('No structured data found');
  } else {
    result.schemas.forEach((s) => {
      lines.push(`${s.isValid ? '✓' : '✗'} ${s.type} ${s.isValid ? '' : '(INVALID)'}`);
    });
  }

  return lines.join('\n');
}

export function downloadPDF(result: CrawlResult): void {
  const content = generatePDFContent(result);
  const domain = new URL(result.url).hostname.replace('www.', '');
  downloadFile(content, `seo-audit-${domain}.txt`, 'text/plain');
}
