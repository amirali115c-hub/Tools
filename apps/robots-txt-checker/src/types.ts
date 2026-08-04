export type ParserMode = 'google' | 'rfc9309';

export type DirectiveType =
  | 'user-agent'
  | 'allow'
  | 'disallow'
  | 'sitemap'
  | 'crawl-delay'
  | 'clean-param'
  | 'host'
  | 'comment'
  | 'unknown';

export interface ParsedLine {
  lineNumber: number;
  raw: string;
  type: DirectiveType;
  key?: string;
  value?: string;
  comment?: string;
  warning?: string;
}

export interface Rule {
  type: 'allow' | 'disallow';
  pattern: string;
  lineNumber: number;
  raw: string;
}

export interface UserAgentGroup {
  id: string;
  userAgents: string[];
  userAgentLineNumbers: number[];
  rules: Rule[];
  crawlDelay?: number;
  crawlDelayLineNumber?: number;
  cleanParams?: string[];
}

export interface DiagnosticIssue {
  id: string;
  severity: 'critical' | 'warning' | 'notice' | 'syntax';
  title: string;
  message: string;
  explanation: string;
  lineNumber?: number;
  groupIndex?: number;
}

export interface RuleMatchCandidate {
  rule: Rule;
  uaGroup: string;
  pattern: string;
  patternLength: number;
  isMatch: boolean;
  type: 'allow' | 'disallow';
  reason: string;
  won: boolean;
}

export interface UrlTestResult {
  urlOrPath: string;
  userAgent: string;
  matchedGroup: UserAgentGroup | null;
  matchedGroupUA: string;
  status: 'allowed' | 'blocked';
  winningRule: Rule | null;
  reason: string;
  candidates: RuleMatchCandidate[];
  parserMode: ParserMode;
}

export interface ParsedRobots {
  rawText: string;
  hasBOM: boolean;
  byteSize: number;
  lines: ParsedLine[];
  groups: UserAgentGroup[];
  sitemaps: { url: string; lineNumber: number; isAbsolute: boolean }[];
  syntaxIssues: DiagnosticIssue[];
  orphanedDirectives: ParsedLine[];
}

export type StarterTemplateKey = 'wordpress' | 'shopify' | 'woocommerce' | 'staging' | 'default';

export interface StarterTemplate {
  key: StarterTemplateKey;
  name: string;
  description: string;
  content: string;
  sitemap?: string;
  groups?: Array<{
    userAgents: string[];
    rules: Array<{ type: 'allow' | 'disallow'; pattern: string }>;
    crawlDelay?: number;
  }>;
}

export type CrawlerCategory = 'search' | 'ai' | 'social';
export type CrawlerAccessStatus = 'allow' | 'block' | 'default';

export interface CrawlerInfo {
  id: string;
  userAgent: string;
  name: string;
  owner: string;
  category: CrawlerCategory;
  description: string;
}

