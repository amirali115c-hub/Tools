import { CleanOptions } from '../types';

export async function cleanImageMetadata(
  arrayBuffer: ArrayBuffer,
  fileType: string,
  options: CleanOptions,
  originalBlobUrl: string
): Promise<Blob> {
  if (options.useCanvasReencode) {
    return cleanViaCanvas(originalBlobUrl, options);
  }

  try {
    const bytes = new Uint8Array(arrayBuffer);
    let cleanedBytes: Uint8Array;

    if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
      cleanedBytes = stripJpegBytes(bytes, options);
    } else if (fileType === 'image/png') {
      cleanedBytes = stripPngBytes(bytes, options);
    } else if (fileType === 'image/webp') {
      cleanedBytes = stripWebpBytes(bytes, options);
    } else {
      // Fallback for unsupported formats
      return cleanViaCanvas(originalBlobUrl, options);
    }

    return new Blob([cleanedBytes], { type: fileType });
  } catch (err) {
    console.warn('Binary segment stripping failed, falling back to canvas re-encoding:', err);
    return cleanViaCanvas(originalBlobUrl, options);
  }
}

function stripJpegBytes(bytes: Uint8Array, options: CleanOptions): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Invalid JPEG magic number');
  }

  const parts: Uint8Array[] = [bytes.slice(0, 2)]; // Keep SOI marker
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    if (marker === 0xd9) {
      // EOI
      parts.push(bytes.slice(offset, offset + 2));
      break;
    }

    if (marker === 0xda) {
      // SOS (Start of Scan - image pixel data starts here)
      parts.push(bytes.slice(offset));
      break;
    }

    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const totalLen = 2 + segLen;
    let skip = false;

    // APP1 (EXIF / XMP / C2PA)
    if (marker === 0xe1 && (options.stripExif || options.stripXmp)) {
      skip = true;
    }
    // APP0 (JFIF)
    else if (marker === 0xe0 && options.stripJfif) {
      skip = true;
    }
    // COM (Comment)
    else if (marker === 0xfe && options.stripComments) {
      skip = true;
    }
    // APP2 (ICC Profile)
    else if (marker === 0xe2 && (options.stripIcc || options.stripExif || options.stripXmp)) {
      skip = true;
    }
    // APP3 through APP15 (Photoshop IRB / Adobe / Extended metadata)
    else if (marker >= 0xe3 && marker <= 0xef && (options.stripExif || options.stripXmp)) {
      skip = true;
    }

    if (!skip) {
      parts.push(bytes.slice(offset, offset + totalLen));
    }

    offset += totalLen;
  }

  let totalSize = 0;
  for (const p of parts) totalSize += p.length;

  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }

  return result;
}

function stripPngBytes(bytes: Uint8Array, options: CleanOptions): Uint8Array {
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50) {
    throw new Error('Invalid PNG magic number');
  }

  const parts: Uint8Array[] = [bytes.slice(0, 8)]; // Keep PNG signature
  let offset = 8;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  while (offset < bytes.length - 8) {
    const chunkLen = view.getUint32(offset);
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    const totalLen = 12 + chunkLen;
    let skip = false;

    if (
      (options.stripPngChunks || options.stripXmp || options.stripComments) &&
      (chunkType === 'tEXt' || chunkType === 'iTXt' || chunkType === 'zTXt')
    ) {
      skip = true;
    }
    if (options.stripIcc && chunkType === 'iCCP') {
      skip = true;
    }
    if ((options.stripExif || options.stripXmp) && (chunkType === 'eXIf' || chunkType === 'tIME')) {
      skip = true;
    }

    if (!skip) {
      parts.push(bytes.slice(offset, offset + totalLen));
    }

    offset += totalLen;
    if (chunkType === 'IEND') break;
  }

  let totalSize = 0;
  for (const p of parts) totalSize += p.length;

  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }

  return result;
}

function stripWebpBytes(bytes: Uint8Array, options: CleanOptions): Uint8Array {
  const header = String.fromCharCode(...bytes.slice(0, 4));
  if (header !== 'RIFF') {
    throw new Error('Invalid WebP magic number');
  }

  const parts: Uint8Array[] = [bytes.slice(0, 12)]; // RIFF + size + WEBP
  let offset = 12;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  while (offset < bytes.length - 8) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkLen = view.getUint32(offset + 4, true);

    let totalLen = 8 + chunkLen;
    if (chunkLen % 2 === 1) totalLen++; // WebP padded chunks

    let skip = false;
    if (options.stripExif && chunkId === 'EXIF') skip = true;
    if (options.stripXmp && chunkId === 'XMP ') skip = true;
    if (options.stripIcc && chunkId === 'ICCP') skip = true;

    if (!skip) {
      parts.push(bytes.slice(offset, offset + totalLen));
    }

    offset += totalLen;
  }

  let totalSize = 0;
  for (const p of parts) totalSize += p.length;

  const result = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }

  // Update overall RIFF size in header bytes 4..7
  const newRiffSize = totalSize - 8;
  const viewRes = new DataView(result.buffer);
  viewRes.setUint32(4, newRiffSize, true);

  return result;
}

function cleanViaCanvas(blobUrl: string, options: CleanOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const targetFormat = options.canvasFormat || 'image/jpeg';
      const targetQuality = options.quality ?? 0.92;

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to encode clean canvas image blob'));
        },
        targetFormat,
        targetQuality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for canvas scrubbing'));
    img.src = blobUrl;
  });
}
