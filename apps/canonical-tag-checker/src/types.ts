export type Severity = 'pass' | 'warning' | 'fail' | 'info' | 'unverified';

export type IssueCategory =
  | 'presence'
  | 'placement'
  | 'url_structure'
  | 'canonical_target'
  | 'conflict'
  | 'bulk_cluster';

export interface AuditIssue {
  id: string;
  category: IssueCategory;
  title: string;
  severity: Severity;
  summary: string;
  extractedTag: string;
  parsedMeaning: string;
  seoConsequence: string;
  recommendedAction: string;
}

export interface HeaderSignal {
  hasCanonical: boolean;
  url: string | null;
  rawHeader: string;
}

export interface ParsedPageData {
  url: string;
  html: string;
  headers: string;
  title: string;
  h1: string;
  headCanonicalTags: Array<{ href: string; raw: string; location: 'head' }>;
  bodyCanonicalTags: Array<{ href: string; raw: string; location: 'body' }>;
  headerCanonical: HeaderSignal | null;
  metaRobots: string[];
  hreflangTags: Array<{ lang: string; href: string; raw: string }>;
  pagination: {
    relNext: string | null;
    relPrev: string | null;
    pageParam: number | null;
  };
  urlParams: Record<string, string>;
}

export interface PageAuditResult {
  id: string;
  pageUrl: string;
  htmlSource: string;
  headersSource: string;
  title: string;
  h1: string;
  issues: AuditIssue[];
  score: number;
  stats: {
    passes: number;
    warnings: number;
    fails: number;
    unverified: number;
  };
  canonicalTarget: string | null;
  isSelfCanonical: boolean;
  isCrossDomain: boolean;
  isRelative: boolean;
  parsedData: ParsedPageData;
  targetOverride?: {
    statusCode?: number;
    hasNoIndex?: boolean;
  };
}

export interface BulkCluster {
  canonicalTarget: string;
  pages: Array<{
    pageId: string;
    url: string;
    title: string;
    h1: string;
    canonicalTarget: string;
  }>;
  isOrphaned: boolean;
}

export interface DuplicateTitleCluster {
  text: string;
  type: 'title' | 'h1';
  pages: Array<{
    pageId: string;
    url: string;
    canonicalTarget: string | null;
  }>;
  hasDifferentCanonicals: boolean;
}

export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  pageUrl: string;
  html: string;
  headers?: string;
  targetOverride?: {
    statusCode?: number;
    hasNoIndex?: boolean;
  };
}

export interface BulkSamplePreset {
  id: string;
  title: string;
  description: string;
  pages: Array<{
    url: string;
    html: string;
    headers?: string;
  }>;
}
