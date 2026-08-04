export type RedirectMode = 'manual' | 'curl' | 'automated';

export type HttpStatusType = '2xx' | '3xx' | '4xx' | '5xx' | 'other';

export type FlagSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AuditFlag {
  id: string;
  severity: FlagSeverity;
  title: string;
  description: string;
  recommendation: string;
  category: 'seo' | 'security' | 'performance' | 'architecture';
}

export interface Hop {
  id: string;
  stepNumber: number;
  url: string;
  statusCode?: number;
  statusText?: string;
  redirectType?: '301 Permanent' | '302 Found' | '303 See Other' | '307 Temporary' | '308 Permanent' | '200 OK' | 'Meta Refresh' | 'JS Redirect' | '404 Not Found' | '500 Server Error' | 'Opaque/Blocked' | 'Custom';
  responseTimeMs?: number;
  headers?: Record<string, string>;
  note?: string;
  isOpaque?: boolean;
}

export interface ChainAnalysis {
  id: string;
  title: string;
  createdAt: string;
  startingUrl: string;
  finalUrl: string;
  hops: Hop[];
  totalHops: number;
  totalRedirects: number;
  totalTimeMs?: number;
  mode: RedirectMode;
  flags: AuditFlag[];
  canonicalTarget?: string;
  matchesCanonical?: boolean;
  hasLoop: boolean;
  hasDowngrade: boolean;
  hasMixedTypes: boolean;
  endsInError: boolean;
  endsInRedirect: boolean;
  opaqueDetected?: boolean;
  rawCurlInput?: string;
}

export interface BulkItemResult {
  id: string;
  url: string;
  analysis?: ChainAnalysis;
  status: 'pending' | 'completed' | 'error';
  errorMessage?: string;
}
