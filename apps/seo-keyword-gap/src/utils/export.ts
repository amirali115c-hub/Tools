import Papa from 'papaparse';
import { ClassifiedPage, GapOpportunity, PlacementChecklist } from '../types';
import { generatePlacementChecklist } from './placementPlanner';

/**
 * Triggers browser download of text content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export all extracted keywords across competitor pages, own pages, and gaps into CSV
 */
export function exportKeywordsToCsv(
  competitorPages: ClassifiedPage[],
  ownPages: ClassifiedPage[],
  gaps: GapOpportunity[]
) {
  const rows: Record<string, string | number>[] = [];

  // Helper to push page keywords
  const processPage = (page: ClassifiedPage, siteType: 'Competitor' | 'Own Site') => {
    if (page.primaryKeyword) {
      rows.push({
        'Keyword Term': page.primaryKeyword.term,
        'Keyword Type': 'Primary Target',
        'Site': siteType,
        'Page Category': page.category.toUpperCase(),
        'Page Title': page.metadata.title || page.metadata.h1 || 'Untitled',
        'Page URL': page.metadata.url,
        'Est Search Volume': page.primaryKeyword.volume || (page.primaryKeyword.isVolumeBacked ? 'Volume-Backed' : 'N/A'),
        'TF-IDF Score': page.primaryKeyword.score?.toFixed(4) || 'N/A'
      });
    }

    page.secondaryKeywords.forEach(sec => {
      rows.push({
        'Keyword Term': sec.term,
        'Keyword Type': 'Secondary Keyword',
        'Site': siteType,
        'Page Category': page.category.toUpperCase(),
        'Page Title': page.metadata.title || page.metadata.h1 || 'Untitled',
        'Page URL': page.metadata.url,
        'Est Search Volume': sec.volume || (sec.isVolumeBacked ? 'Volume-Backed' : 'N/A'),
        'TF-IDF Score': sec.score?.toFixed(4) || 'N/A'
      });
    });
  };

  competitorPages.forEach(p => processPage(p, 'Competitor'));
  ownPages.forEach(p => processPage(p, 'Own Site'));

  gaps.forEach(gap => {
    rows.push({
      'Keyword Term': gap.targetPrimaryKeyword,
      'Keyword Type': 'Gap Opportunity (Primary)',
      'Site': 'Competitor Advantage (Missing on Own Site)',
      'Page Category': gap.suggestedPageType.toUpperCase(),
      'Page Title': gap.workingTitle,
      'Page URL': `/services/${gap.suggestedSlug}`,
      'Est Search Volume': gap.searchVolume || (gap.isVolumeBacked ? 'Volume-Backed' : 'N/A'),
      'TF-IDF Score': 'High Gap Weight'
    });

    gap.targetSecondaryKeywords.forEach(sec => {
      rows.push({
        'Keyword Term': sec,
        'Keyword Type': 'Gap Opportunity (Secondary)',
        'Site': 'Competitor Advantage (Missing on Own Site)',
        'Page Category': gap.suggestedPageType.toUpperCase(),
        'Page Title': gap.workingTitle,
        'Page URL': `/services/${gap.suggestedSlug}`,
        'Est Search Volume': 'N/A',
        'TF-IDF Score': 'Gap Weight'
      });
    });
  });

  const csvString = Papa.unparse(rows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvString, `Extracted-Keywords-Report-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

export function exportPlanToCsv(
  ownPages: ClassifiedPage[],
  gaps: GapOpportunity[]
) {
  const rows: Record<string, string | number>[] = [];

  // Existing Pages
  ownPages.forEach(p => {
    const checklist = generatePlacementChecklist(p);
    const passRate = `${checklist.scorePercent}%`;

    rows.push({
      'Plan Status': 'Existing Page',
      'URL / Path': p.metadata.url,
      'Page Category': p.category.toUpperCase(),
      'Primary Keyword': p.primaryKeyword?.term || '',
      'Keyword Volume': p.primaryKeyword?.volume || (p.primaryKeyword?.isVolumeBacked ? 'Volume-backed' : 'N/A'),
      'Secondary Keywords': p.secondaryKeywords.map(k => k.term).join(', '),
      'Optimization Score': passRate,
      'Title Tag Status': checklist.items.find(i => i.element === 'Title Tag')?.status === 'passed' ? 'PASS' : 'FAIL',
      'H1 Status': checklist.items.find(i => i.element === 'H1 Heading')?.status === 'passed' ? 'PASS' : 'FAIL',
      'Slug Status': checklist.items.find(i => i.element === 'URL Slug')?.status === 'passed' ? 'PASS' : 'FAIL',
      'First 100 Words Status': checklist.items.find(i => i.element === 'First 100 Words')?.status === 'passed' ? 'PASS' : 'FAIL',
      'Image Alt Status': checklist.items.find(i => i.element === 'Image Alt Text')?.status === 'passed' ? 'PASS' : 'FAIL',
      'Word Count': p.metadata.wordCount,
      'Classification Rationale': p.classificationReason
    });
  });

  // Gap Opportunities
  gaps.forEach(gap => {
    rows.push({
      'Plan Status': 'RECOMMENDED NEW PAGE (GAP)',
      'URL / Path': `/services/${gap.suggestedSlug}`,
      'Page Category': gap.suggestedPageType.toUpperCase(),
      'Primary Keyword': gap.targetPrimaryKeyword,
      'Keyword Volume': gap.searchVolume || (gap.isVolumeBacked ? 'Volume-backed' : 'N/A'),
      'Secondary Keywords': gap.targetSecondaryKeywords.join(', '),
      'Optimization Score': '0% (Needs Creation)',
      'Title Tag Status': 'RECOMMENDED',
      'H1 Status': 'RECOMMENDED',
      'Slug Status': 'RECOMMENDED',
      'First 100 Words Status': 'RECOMMENDED',
      'Image Alt Status': 'RECOMMENDED',
      'Word Count': 0,
      'Classification Rationale': `Gap Opportunity vs Competitor (${gap.competitorPageUrl})`
    });
  });

  const csvString = Papa.unparse(rows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvString, `SEO-Keyword-Targeting-Plan-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Content Writer Briefs as Markdown
 */
export function exportWriterBriefsMarkdown(
  ownPages: ClassifiedPage[],
  gaps: GapOpportunity[]
) {
  let md = `# SEO Content Writer Briefs & Placement Plan\n`;
  md += `*Generated 100% Client-Side on ${new Date().toLocaleDateString()}*\n\n`;

  md += `---
## Table of Contents
1. [Recommended New Pages (Content Gaps)](#1-recommended-new-pages-content-gaps)
2. [Existing Page Optimization Briefs](#2-existing-page-optimization-briefs)

---

## 1. Recommended New Pages (Content Gaps)

`;

  if (gaps.length === 0) {
    md += `*No missing page gaps identified between competitor and own site.*\n\n`;
  } else {
    gaps.forEach((gap, idx) => {
      md += `### ${idx + 1}. [${gap.suggestedPageType.toUpperCase()}] ${gap.workingTitle}\n`;
      md += `- **Suggested Slug**: \`/${gap.suggestedPageType === 'service' ? 'services' : 'blog'}/${gap.suggestedSlug}\`
- **Target Primary Keyword**: \`${gap.targetPrimaryKeyword}\` ${gap.searchVolume ? `(Est. Vol: ${gap.searchVolume}/mo)` : ''}
- **Secondary Keywords**: ${gap.targetSecondaryKeywords.map(k => `\`${k}\``).join(', ')}
- **Strategic Reason**: ${gap.reasoning}
- **Competitor Reference**: [Competitor Page](${gap.competitorPageUrl}) (${gap.competitorWordCount} words)

#### Placement & Optimization Checklist:
`;
      gap.placementChecklist.forEach(item => {
        md += `- [ ] **${item.element}**: ${item.recommendation}\n`;
      });
      md += `\n---\n\n`;
    });
  }

  md += `## 2. Existing Page Optimization Briefs\n\n`;

  ownPages.forEach((page, idx) => {
    const checklist = generatePlacementChecklist(page);
    md += `### 2.${idx + 1}. [${page.category.toUpperCase()}] ${page.metadata.title || page.metadata.url}\n`;
    md += `- **URL**: ${page.metadata.url}
- **Primary Keyword**: \`${page.primaryKeyword?.term || 'Unassigned'}\` ${page.primaryKeyword?.volume ? `(Est. Vol: ${page.primaryKeyword.volume}/mo)` : ''}
- **Secondary Keywords**: ${page.secondaryKeywords.map(k => `\`${k.term}\``).join(', ')}
- **Current Compliance Score**: ${checklist.scorePercent}%
- **Word Count**: ${page.metadata.wordCount} words

#### Actionable Writer Checklist:
`;
    checklist.items.forEach(item => {
      const mark = item.status === 'passed' ? '[x]' : '[ ]';
      md += `- ${mark} **${item.element}** (${item.importance.toUpperCase()}): ${item.recommendation}\n`;
    });
    md += `\n---\n\n`;
  });

  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(md, `SEO-Writer-Briefs-${dateStr}.md`, 'text/markdown;charset=utf-8;');
}
