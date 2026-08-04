export type PageCategory = 'service' | 'blog' | 'other';

export interface KeywordVolumeItem {
  keyword: string;
  volume: number;
  cpc?: number;
  competition?: number | string;
}

export interface ExtractedKeyword {
  term: string;
  score: number;
  frequency: number;
  isVolumeBacked: boolean;
  volume?: number;
  sourceFields: string[]; // e.g. ['title', 'h1', 'body']
}

export interface PageMetadata {
  id: string;
  url: string;
  path: string;
  title: string;
  h1: string;
  h2s: string[];
  h3s: string[];
  metaDescription: string;
  first150Words: string;
  bodyText: string;
  wordCount: number;
  imageAlts: string[];
  internalLinkAnchors: string[];
  ctaMentions: string[];
  ctaDensity: 'high' | 'medium' | 'low' | 'none';
  isSpaOrEmpty: boolean; // warning flag if < 30 words or missing tags
  rawHtml?: string;
  sourceType: 'html_paste' | 'sitemap_xml' | 'csv_upload' | 'url_list';
}

export interface ClassifiedPage {
  metadata: PageMetadata;
  category: PageCategory;
  isManualOverride: boolean;
  classificationReason: string;
  primaryKeyword?: ExtractedKeyword;
  secondaryKeywords: ExtractedKeyword[];
}

export interface PlacementItem {
  element: 'Title Tag' | 'H1 Heading' | 'URL Slug' | 'First 100 Words' | 'Image Alt Text' | 'Internal Link Anchor';
  status: 'passed' | 'failed' | 'recommended';
  currentText?: string;
  recommendation: string;
  importance: 'critical' | 'high' | 'medium';
}

export interface PlacementChecklist {
  pageId: string;
  url: string;
  pageType: PageCategory;
  targetPrimaryKeyword: string;
  targetSecondaryKeywords: string[];
  items: PlacementItem[];
  scorePercent: number;
}

export interface GapOpportunity {
  id: string;
  competitorPageUrl: string;
  competitorPageTitle: string;
  suggestedPageType: 'service' | 'blog';
  workingTitle: string;
  suggestedSlug: string;
  targetPrimaryKeyword: string;
  targetSecondaryKeywords: string[];
  searchVolume?: number;
  isVolumeBacked: boolean;
  reasoning: string;
  competitorWordCount: number;
  placementChecklist: PlacementItem[];
}

// ==================== NEW MILESTONE TYPES ====================

// Milestone 1: Topic Clusters & Topical Authority
export interface TopicCluster {
  id: string;
  pillarName: string; // e.g. "B2B SaaS Lead Generation"
  description: string;
  totalVolume: number;
  keywordsCount: number;
  keywords: string[];
  competitorPageCount: number;
  ownPageCount: number;
  competitorCoverageScore: number; // 0-100%
  ownCoverageScore: number; // 0-100%
  authorityGapScore: number; // competitor - own
  status: 'Dominating' | 'Competitive' | 'Urgent Gap' | 'Opportunity';
  pagesInCluster: {
    url: string;
    title: string;
    siteType: 'Competitor' | 'Own Site';
    role: 'Pillar Page' | 'Cluster Article';
  }[];
}

// Milestone 2: Entities & Schema
export type EntityCategory = 'Organization' | 'Technology' | 'Methodology' | 'Industry Concept' | 'E-E-A-T Signal' | 'Location';

export interface ExtractedEntity {
  id: string;
  entityName: string;
  category: EntityCategory;
  competitorMentions: number;
  ownMentions: number;
  isMissingInOwnSite: boolean;
  relevanceScore: number; // 0-100
  recommendedSchemaType?: string;
  sampleSourceUrls: string[];
}

export interface SchemaMarkupOutput {
  pageUrl: string;
  pageTitle: string;
  schemaType: 'Organization' | 'Service' | 'Article' | 'FAQPage' | 'HowTo' | 'BreadcrumbList';
  jsonLd: Record<string, any>;
  formattedJson: string;
}

// Milestone 3: Internal Links & Cannibalization
export interface CannibalizationAlert {
  id: string;
  keyword: string;
  competingPages: {
    url: string;
    title: string;
    category: PageCategory;
    tfidfScore: number;
  }[];
  riskLevel: 'Critical' | 'Moderate' | 'Low';
  impactDescription: string;
  recommendedAction: 'Canonicalize to Main Page' | '301 Redirect & Merge' | 'De-optimize Secondary Page' | 'Add Internal Links to Hierarchy';
  primaryTargetUrl: string;
}

export interface InternalLinkRecommendation {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  targetUrl: string;
  targetTitle: string;
  suggestedAnchorText: string;
  relevancyScore: number; // 0-100%
  placementContext: string;
  targetType: 'Existing Page' | 'New Gap Page';
}

// Milestone 4: SERP Intent & E-E-A-T Quality
export type SerpIntentType = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';

export interface SerpIntentDistribution {
  intent: SerpIntentType;
  percentage: number;
  count: number;
  color: string;
}

export interface EeattSignal {
  category: 'Experience' | 'Expertise' | 'Authoritativeness' | 'Trustworthiness';
  signalName: string;
  status: 'Present' | 'Missing' | 'Needs Enhancement';
  recommendation: string;
  weight: number;
}

export interface EeattAuditResult {
  pageUrl: string;
  pageTitle: string;
  overallScore: number; // 0-100
  experienceScore: number;
  expertiseScore: number;
  authoritativenessScore: number;
  trustworthinessScore: number;
  signals: EeattSignal[];
}

export interface ComprehensiveBrief {
  id: string;
  title: string;
  targetSlug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SerpIntentType;
  suggestedWordCount: fontRange;
  topicCluster: string;
  targetEntities: string[];
  outline: {
    headingType: 'H1' | 'H2' | 'H3';
    text: string;
    guidance: string;
  }[];
  eeattRequirements: string[];
  internalLinksToInclude: { anchor: string; targetUrl: string }[];
  schemaMarkup: Record<string, any>;
}

export interface fontRange {
  min: number;
  target: number;
  max: number;
}

export interface SiteData {
  rootDomain: string;
  pages: ClassifiedPage[];
  rawSitemapUrls?: string[];
}

export interface AppState {
  competitorSite: SiteData;
  ownSite: SiteData;
  keywordVolumeData: Map<string, KeywordVolumeItem>;
  volumeDataList: KeywordVolumeItem[];
  seedKeywords: string[];
  activeTab: 'intake' | 'inventory' | 'gaps' | 'clusters' | 'entities' | 'linking' | 'intent' | 'plan';
  lastUpdated: string;
}
