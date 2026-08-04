export type MetaType = 
  | 'EXIF' 
  | 'XMP' 
  | 'ICC' 
  | 'JFIF' 
  | 'Comment' 
  | 'AI DETECTED' 
  | 'PNG' 
  | 'IPTC' 
  | 'GPS'
  | 'SPEC'
  | 'C2PA'
  | 'AI Prompt'
  | 'EXIF STATUS';

export interface ImageMetadataItem {
  type: MetaType;
  key: string;
  value: string;
  category?: 'Camera' | 'GPS' | 'AI Workflow' | 'Software' | 'Image Specs' | 'Other';
}

export interface GpsCoords {
  lat: number;
  lon: number;
  alt?: number;
}

export interface AiPromptDetails {
  positivePrompt?: string;
  negativePrompt?: string;
  model?: string;
  seed?: string | number;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  dimensions?: string;
  loras?: string[];
  rawParameters?: string;
  aiEngine?: string;
}

export interface ImageFileRecord {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  arrayBuffer: ArrayBuffer;
  metadata: ImageMetadataItem[];
  gpsCoords?: GpsCoords;
  aiPromptDetails?: AiPromptDetails;
  cleanedBlob?: Blob;
  cleanedPreviewUrl?: string;
  isCleaned: boolean;
  cleanSavedBytes?: number;
  privacyAudit?: AiPrivacyAudit;
  isAuditing?: boolean;
}

export interface CleanOptions {
  stripExif: boolean;
  stripXmp: boolean;
  stripIcc: boolean;
  stripJfif: boolean;
  stripComments: boolean;
  stripPngChunks: boolean;
  useCanvasReencode: boolean;
  canvasFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  customAuthor?: string;
  customCopyright?: string;
}

export interface PrivacyFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface AiPrivacyAudit {
  privacyScore: number; // 0 (safe) to 100 (high risk)
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  aiDetectionResult: {
    isAiGenerated: boolean;
    confidence: number;
    detectedEngine: string;
    visualReasoning: string;
  };
  privacyFindings: PrivacyFinding[];
  reconstructedPromptInfo?: {
    positivePrompt?: string;
    negativePrompt?: string;
    generationParameters?: string;
  };
  socialSharingSafety: {
    safeForPublic: boolean;
    summary: string;
    platformRecommendations?: {
      reddit?: string;
      twitter?: string;
      discord?: string;
      instagram?: string;
      portfolio?: string;
    };
  };
}

export type ForensicFilter = 
  | 'normal' 
  | 'ela' 
  | 'noise' 
  | 'edges' 
  | 'channel-r' 
  | 'channel-g' 
  | 'channel-b' 
  | 'alpha' 
  | 'luminance' 
  | 'lsb-bitplane';
