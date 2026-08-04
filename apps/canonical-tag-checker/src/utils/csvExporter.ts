import { PageAuditResult, BulkCluster } from '../types';

/**
 * Generates and triggers download of a CSV file containing single/bulk audit results
 */
export function exportResultsToCSV(results: PageAuditResult[], clusters?: BulkCluster[]) {
  const headers = [
    'Page URL',
    'Health Score',
    'Page Title',
    'Canonical Target URL',
    'Self-Referencing?',
    'Cross-Domain?',
    'Relative URL?',
    'Fails Count',
    'Warnings Count',
    'Passes Count',
    'Primary Issue',
    'Canonical Tags Found',
  ];

  const rows = results.map((r) => {
    const primaryFail = r.issues.find((i) => i.severity === 'fail');
    const primaryWarn = r.issues.find((i) => i.severity === 'warning');
    const primaryNote = primaryFail?.title || primaryWarn?.title || 'All Checks Passed';

    const tagsList = [
      ...r.parsedData.headCanonicalTags.map((t) => t.href),
      ...r.parsedData.bodyCanonicalTags.map((t) => `${t.href} (in body)`),
      ...(r.parsedData.headerCanonical ? [`${r.parsedData.headerCanonical.url} (in header)`] : []),
    ].join(' | ');

    return [
      escapeCSV(r.pageUrl),
      r.score.toString(),
      escapeCSV(r.title),
      escapeCSV(r.canonicalTarget || 'None'),
      r.isSelfCanonical ? 'YES' : 'NO',
      r.isCrossDomain ? 'YES' : 'NO',
      r.isRelative ? 'YES' : 'NO',
      r.stats.fails.toString(),
      r.stats.warnings.toString(),
      r.stats.passes.toString(),
      escapeCSV(primaryNote),
      escapeCSV(tagsList),
    ];
  });

  let csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  if (clusters && clusters.length > 0) {
    csvContent += '\n\n';
    csvContent += '--- BULK CLUSTER SUMMARY ---\n';
    csvContent += 'Canonical Target URL,Cluster Size,Is Target Orphaned (Not in audit batch?)\n';
    clusters.forEach((c) => {
      csvContent += `${escapeCSV(c.canonicalTarget)},${c.pages.length},${c.isOrphaned ? 'YES (ORPHANED)' : 'NO'}\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `canonical-audit-report-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSV(str: string): string {
  if (!str) return '""';
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}
