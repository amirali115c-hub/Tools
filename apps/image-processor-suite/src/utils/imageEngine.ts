import {
  CompressionSettings,
  ConversionSettings,
  CropSettings,
  FilterSettings,
  ImageFileItem,
  OutputFormat,
  ProcessedResult,
} from '../types';
import JSZip from 'jszip';

/**
 * Load image safely into HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image into canvas: ' + String(e)));
    img.src = src;
  });
}

/**
 * Format bytes into human readable format
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get image metadata & create item
 */
export async function createMetadataItem(file: File): Promise<ImageFileItem> {
  const objectUrl = URL.createObjectURL(file);
  const img = await loadImage(objectUrl);
  return {
    id: 'img_' + Math.random().toString(36).substring(2, 9),
    file,
    name: file.name,
    originalSize: file.size,
    type: file.type || 'image/jpeg',
    objectUrl,
    width: img.naturalWidth,
    height: img.naturalHeight,
    aspectRatio: img.naturalWidth / img.naturalHeight,
    lastModified: file.lastModified,
  };
}

/**
 * Convert canvas to Blob with fallback
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Quality parameter is between 0 and 1
    const q = Math.max(0.01, Math.min(1, quality));
    
    // Normalize format
    let mimeType = format;
    if (format === 'auto') {
      mimeType = 'image/jpeg';
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to JPEG if browser doesn't support target format canvas output
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob);
              else reject(new Error('Canvas export failed'));
            },
            'image/jpeg',
            q
          );
        }
      },
      mimeType,
      q
    );
  });
}

/**
 * Apply filters & watermark to Canvas Context
 */
export function applyCanvasFiltersAndWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: FilterSettings
) {
  const {
    brightness,
    contrast,
    saturation,
    blur,
    grayscale,
    sepia,
    invert,
    watermarkText,
    watermarkColor,
    watermarkOpacity,
    watermarkPosition,
    watermarkFontSize,
  } = filters;

  // Build CSS Filter string
  const filterParts: string[] = [];
  if (brightness !== 0) filterParts.push(`brightness(${100 + brightness}%)`);
  if (contrast !== 0) filterParts.push(`contrast(${100 + contrast}%)`);
  if (saturation !== 0) filterParts.push(`saturate(${100 + saturation}%)`);
  if (blur > 0) filterParts.push(`blur(${blur}px)`);
  if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`);
  if (sepia > 0) filterParts.push(`sepia(${sepia}%)`);
  if (invert) filterParts.push(`invert(100%)`);

  if (filterParts.length > 0) {
    ctx.filter = filterParts.join(' ');
  }

  // Draw Watermark if present
  if (watermarkText.trim()) {
    ctx.save();
    ctx.globalAlpha = watermarkOpacity / 100;
    ctx.fillStyle = watermarkColor || '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, Math.round(watermarkFontSize / 12));
    ctx.font = `bold ${watermarkFontSize}px sans-serif`;

    const padding = Math.max(16, Math.round(width * 0.02));
    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width;
    const textHeight = watermarkFontSize;

    if (watermarkPosition === 'tile') {
      const stepX = textWidth + 80;
      const stepY = textHeight + 60;
      for (let x = 0; x < width + stepX; x += stepX) {
        for (let y = 0; y < height + stepY; y += stepY) {
          ctx.strokeText(watermarkText, x, y);
          ctx.fillText(watermarkText, x, y);
        }
      }
    } else {
      let x = padding;
      let y = padding + textHeight;

      if (watermarkPosition === 'center') {
        x = (width - textWidth) / 2;
        y = (height + textHeight) / 2;
      } else if (watermarkPosition === 'top-right') {
        x = width - textWidth - padding;
        y = padding + textHeight;
      } else if (watermarkPosition === 'bottom-left') {
        x = padding;
        y = height - padding;
      } else if (watermarkPosition === 'bottom-right') {
        x = width - textWidth - padding;
        y = height - padding;
      }

      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
    }
    ctx.restore();
  }
}

/**
 * Process single image compression
 */
export async function processCompress(
  item: ImageFileItem,
  settings: CompressionSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.objectUrl);
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  // Max Dimension Resizing
  if (settings.maxWidth > 0 || settings.maxHeight > 0) {
    const scaleW = settings.maxWidth > 0 ? settings.maxWidth / w : 1;
    const scaleH = settings.maxHeight > 0 ? settings.maxHeight / h : 1;
    const scale = Math.min(scaleW, scaleH, 1);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill background for JPEG
  const targetFormat =
    settings.outputFormat === 'auto' ? item.type || 'image/jpeg' : settings.outputFormat;

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0, w, h);

  let finalBlob: Blob;
  let usedQuality = settings.quality / 100;

  if (settings.mode === 'auto') {
    // Auto WebP at 80% quality
    const autoFormat = 'image/webp';
    finalBlob = await canvasToBlob(canvas, autoFormat, 0.8);
  } else if (settings.mode === 'target') {
    // Binary search to match target byte size
    const targetBytes =
      settings.targetSizeValue * (settings.targetSizeUnit === 'MB' ? 1048576 : 1024);

    let lo = 0.05;
    let hi = 0.98;
    let bestBlob = await canvasToBlob(canvas, targetFormat, 0.5);

    for (let step = 0; step < 8; step++) {
      const mid = (lo + hi) / 2;
      const testBlob = await canvasToBlob(canvas, targetFormat, mid);
      if (Math.abs(testBlob.size - targetBytes) < targetBytes * 0.03) {
        bestBlob = testBlob;
        usedQuality = mid;
        break;
      }
      if (testBlob.size > targetBytes) {
        hi = mid;
      } else {
        lo = mid;
      }
      bestBlob = testBlob;
      usedQuality = mid;
    }
    finalBlob = bestBlob;
  } else {
    // Direct quality mode
    finalBlob = await canvasToBlob(canvas, targetFormat, usedQuality);
  }

  const extension = (targetFormat.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  const filename = `${baseName}_compressed.${extension}`;

  const savedBytes = item.originalSize - finalBlob.size;
  const savedPercent = Math.max(0, Math.round((savedBytes / item.originalSize) * 100));

  return {
    id: item.id,
    blob: finalBlob,
    objectUrl: URL.createObjectURL(finalBlob),
    filename,
    format: targetFormat,
    originalSize: item.originalSize,
    compressedSize: finalBlob.size,
    savedBytes,
    savedPercent,
    width: w,
    height: h,
    processedAt: Date.now(),
    status: 'done',
  };
}

/**
 * Process image conversion
 */
export async function processConvert(
  item: ImageFileItem,
  settings: ConversionSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.objectUrl);
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (settings.enableResize) {
    if (settings.resizeWidth > 0 && settings.resizeHeight > 0) {
      w = settings.resizeWidth;
      h = settings.resizeHeight;
    } else if (settings.resizeWidth > 0) {
      w = settings.resizeWidth;
      h = Math.round(w / item.aspectRatio);
    } else if (settings.resizeHeight > 0) {
      h = settings.resizeHeight;
      w = Math.round(h * item.aspectRatio);
    } else if (settings.scalePercent !== 100) {
      const factor = settings.scalePercent / 100;
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const targetFormat = settings.outputFormat;

  if (!settings.transparentBackground || targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const qualityDecimal = settings.quality / 100;
  const finalBlob = await canvasToBlob(canvas, targetFormat, qualityDecimal);

  const extension = (targetFormat.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  const filename = `${baseName}_converted.${extension}`;

  const savedBytes = item.originalSize - finalBlob.size;
  const savedPercent = Math.round((savedBytes / item.originalSize) * 100);

  return {
    id: item.id,
    blob: finalBlob,
    objectUrl: URL.createObjectURL(finalBlob),
    filename,
    format: targetFormat,
    originalSize: item.originalSize,
    compressedSize: finalBlob.size,
    savedBytes,
    savedPercent,
    width: canvas.width,
    height: canvas.height,
    processedAt: Date.now(),
    status: 'done',
  };
}

/**
 * Process Crop and Transform
 */
export async function processCrop(
  item: ImageFileItem,
  cropSettings: CropSettings,
  filterSettings?: FilterSettings
): Promise<ProcessedResult> {
  const img = await loadImage(item.objectUrl);

  const {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    rotation,
    flipX,
    flipY,
    roundCrop,
    targetWidth,
    targetHeight,
    outputFormat,
    quality,
  } = cropSettings;

  // Source Crop dimensions in natural image coordinates
  const sx = Math.max(0, Math.min(cropX, img.naturalWidth - 1));
  const sy = Math.max(0, Math.min(cropY, img.naturalHeight - 1));
  const sw = Math.min(cropWidth, img.naturalWidth - sx);
  const sh = Math.min(cropHeight, img.naturalHeight - sy);

  // Determine output width & height
  let destW = targetWidth && targetWidth > 0 ? targetWidth : sw;
  let destH = targetHeight && targetHeight > 0 ? targetHeight : sh;

  // Account for 90 or 270 deg rotations swapping dimensions
  const is90or270 = Math.abs(rotation) % 180 === 90;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, is90or270 ? destH : destW);
  canvas.height = Math.max(1, is90or270 ? destW : destH);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();

  // Handle round crop mask
  if (roundCrop) {
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      Math.min(canvas.width, canvas.height) / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();
  }

  // Translate to center for rotation & scale
  ctx.translate(canvas.width / 2, canvas.height / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

  // Draw cropped sub-rectangle centered
  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    -destW / 2,
    -destH / 2,
    destW,
    destH
  );

  ctx.restore();

  // Optional Filters & Watermark
  if (filterSettings) {
    applyCanvasFiltersAndWatermark(ctx, canvas.width, canvas.height, filterSettings);
  }

  const finalBlob = await canvasToBlob(canvas, outputFormat, quality / 100);

  const ext = (outputFormat.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  const filename = `${baseName}_cropped.${ext}`;

  const savedBytes = item.originalSize - finalBlob.size;
  const savedPercent = Math.round((savedBytes / item.originalSize) * 100);

  return {
    id: item.id,
    blob: finalBlob,
    objectUrl: URL.createObjectURL(finalBlob),
    filename,
    format: outputFormat,
    originalSize: item.originalSize,
    compressedSize: finalBlob.size,
    savedBytes,
    savedPercent,
    width: canvas.width,
    height: canvas.height,
    processedAt: Date.now(),
    status: 'done',
  };
}

/**
 * Process Filters & Enhancement
 */
export async function processEnhance(
  item: ImageFileItem,
  filterSettings: FilterSettings,
  outputFormat: OutputFormat = 'image/jpeg',
  quality = 90
): Promise<ProcessedResult> {
  const img = await loadImage(item.objectUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  applyCanvasFiltersAndWatermark(ctx, canvas.width, canvas.height, filterSettings);

  const finalBlob = await canvasToBlob(canvas, outputFormat, quality / 100);
  const ext = (outputFormat.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
  const filename = `${baseName}_enhanced.${ext}`;

  return {
    id: item.id,
    blob: finalBlob,
    objectUrl: URL.createObjectURL(finalBlob),
    filename,
    format: outputFormat,
    originalSize: item.originalSize,
    compressedSize: finalBlob.size,
    savedBytes: item.originalSize - finalBlob.size,
    savedPercent: Math.round(((item.originalSize - finalBlob.size) / item.originalSize) * 100),
    width: canvas.width,
    height: canvas.height,
    processedAt: Date.now(),
    status: 'done',
  };
}

/**
 * Create downloadable ZIP archive for batch processed files
 */
export async function downloadBatchZip(
  results: ProcessedResult[],
  zipFilename = 'processed_images.zip'
) {
  const zip = new JSZip();

  results.forEach((res, index) => {
    let name = res.filename;
    // ensure unique names
    if (!name) name = `image_${index + 1}.${res.format.split('/')[1] || 'jpg'}`;
    zip.file(name, res.blob);
  });

  const zipContent = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipContent, zipFilename);
}

/**
 * Trigger immediate browser download for single blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
