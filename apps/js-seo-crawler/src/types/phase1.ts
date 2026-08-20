export type RenderingStrategy = 'CSR' | 'SSR' | 'SSG' | 'ISR' | 'SSG+ISR' | 'Dynamic' | 'Unknown';

export interface FrameworkDetection {
  framework: string;
  version?: string;
  renderer: string;
  router?: string;
  confidence: number;
  evidence: string[];
}

export interface RenderingAnalysis {
  strategy: RenderingStrategy;
  confidence: number;
  evidence: string[];
  framework: FrameworkDetection;
  rawHtmlLength: number;
  renderedHtmlLength: number;
  contentDelta: number;
  contentDeltaPercent: number;
  missingInRender: string[];
  addedByJs: string[];
  linksOnlyAfterRender: number;
  imagesOnlyAfterRender: number;
  criticalContentMissing: boolean;
  seoImpact: 'critical' | 'high' | 'medium' | 'low' | 'none';
  seoImpactExplanation: string;
  recommendations: string[];
}

export interface AICrawlerResult {
  crawler: string;
  userAgent: string;
  canAccess: boolean;
  seesContent: boolean;
  seesJsContent: boolean;
  issues: string[];
}

export interface LlmsTxtValidation {
  exists: boolean;
  url: string;
  content?: string;
  isValid: boolean;
  hasOrganization: boolean;
  hasDescription: boolean;
  hasPages: boolean;
  issues: string[];
  suggestions: string[];
}

export interface Phase1Data {
  rendering: RenderingAnalysis;
  aiCrawlers: AICrawlerResult[];
  llmsTxt: LlmsTxtValidation;
}
