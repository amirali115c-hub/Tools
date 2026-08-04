export type ActiveTool = 'compress' | 'convert' | 'crop' | 'enhance' | 'batch';

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'image/gif' | 'image/bmp' | 'auto';

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  type: string;
  objectUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  lastModified: number;
}

export interface CompressionSettings {
  mode: 'quality' | 'target' | 'auto';
  quality: number; // 10 to 100
  targetSizeValue: number;
  targetSizeUnit: 'KB' | 'MB';
  outputFormat: OutputFormat;
  maxWidth: number;
  maxHeight: number;
  stripMeta: boolean;
  maintainAspectRatio: boolean;
}

export interface ConversionSettings {
  outputFormat: OutputFormat;
  quality: number; // 10 to 100
  enableResize: boolean;
  resizeWidth: number;
  resizeHeight: number;
  scalePercent: number;
  lockAspectRatio: boolean;
  transparentBackground: boolean;
  stripMetadata: boolean;
}

export interface CropSettings {
  aspectRatio: number; // 0 for free, 1 for 1:1, 1.333 for 4:3, 1.778 for 16:9, etc.
  cropX: number; // in original image pixel space
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  rotation: number; // 0, 90, 180, 270
  flipX: boolean;
  flipY: boolean;
  roundCrop: boolean;
  targetWidth?: number;
  targetHeight?: number;
  zoom: number; // 50 to 300
  outputFormat: OutputFormat;
  quality: number;
}

export interface FilterSettings {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  blur: number; // 0 to 20
  sharpen: boolean;
  grayscale: number; // 0 to 100
  sepia: number; // 0 to 100
  invert: boolean;
  watermarkText: string;
  watermarkColor: string;
  watermarkOpacity: number; // 0 to 100
  watermarkPosition: 'center' | 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' | 'tile';
  watermarkFontSize: number;
}

export interface ProcessedResult {
  id: string;
  blob: Blob;
  objectUrl: string;
  filename: string;
  format: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
  width: number;
  height: number;
  processedAt: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export interface SocialPreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  aspectRatio: number;
  iconName: string;
}
