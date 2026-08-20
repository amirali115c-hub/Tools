import {Phase1Data} from './types/phase1';

export interface MetaTag {
  name?: string;
  property?: string;
  content?: string;
  httpEquiv?: string;
  charset?: string;
}

export interface HeadingTag {
  level: number;
  text: string;
  index: number;
}

export interface LinkInfo {
  href: string;
  text: string;
  isInternal: boolean;
  isBroken?: boolean;
  statusCode?: number;
  rel?: string;
  index: number;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  width?: string;
  height?: string;
  loading?: string;
  index: number;
}

export interface SchemaOrgData {
  type: string;
  data: Record<string, unknown>;
  isValid: boolean;
  errors: string[];
}

export interface OpenGraphTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
  missing: string[];
}

export interface TwitterCardTags {
  card?: string;
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
  missing: string[];
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  value?: string;
}

export interface JSHealthData {
  consoleErrors: string[];
  consoleWarnings: string[];
  hydrationMismatches: string[];
  dynamicImports: string[];
  lazyLoadedAboveFold: {src: string; impact: string}[];
  infiniteScrollDetected: boolean;
  clientSideRouting: boolean;
}

export interface CWVData {
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  score?: number;
  opportunities: {metric: string; savings: string; description: string}[];
}

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  canonical: string;
  robots: string;
  metaTags: MetaTag[];
  headings: HeadingTag[];
  links: LinkInfo[];
  images: ImageInfo[];
  schemas: SchemaOrgData[];
  openGraph: OpenGraphTags;
  twitterCard: TwitterCardTags;
  issues: SEOIssue[];
  wordCount: number;
  htmlSize: number;
  loadTime: number;
  statusCode?: number;
  phase1?: Phase1Data;
  jsHealth?: JSHealthData;
  cwv?: CWVData;
}

export type InputMode = 'url' | 'html' | 'sitemap';
export type AnalysisTab =
  | 'overview'
  | 'meta'
  | 'headings'
  | 'links'
  | 'images'
  | 'schema'
  | 'social'
  | 'issues'
  | 'rendering'
  | 'ai-crawlers'
  | 'llms-txt'
  | 'cwv'
  | 'js-health'
  | 'migration';
