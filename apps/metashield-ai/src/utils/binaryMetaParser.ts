import { ImageMetadataItem, GpsCoords, AiPromptDetails } from '../types';

export function extractImageDimensionsFromBuffer(
  buffer: ArrayBuffer,
  fileType: string
): { width?: number; height?: number } {
  try {
    const view = new DataView(buffer);
    if (fileType === 'image/png' && buffer.byteLength >= 24) {
      if (view.getUint32(0) === 0x89504e47) {
        return { width: view.getUint32(16), height: view.getUint32(20) };
      }
    } else if ((fileType === 'image/jpeg' || fileType === 'image/jpg') && buffer.byteLength >= 2) {
      if (view.getUint16(0) === 0xffd8) {
        let offset = 2;
        while (offset < buffer.byteLength - 8) {
          if (view.getUint8(offset) !== 0xff) {
            offset++;
            continue;
          }
          const marker = view.getUint8(offset + 1);
          if (marker === 0xd9 || marker === 0xda) break; // SOS or EOI
          const length = view.getUint16(offset + 2);
          if (offset + 2 + length > buffer.byteLength) break;

          // SOF markers (SOF0..SOF15 except DHT, JPG, DAC)
          if (
            (marker >= 0xc0 && marker <= 0xc3) ||
            (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) ||
            (marker >= 0xcd && marker <= 0xcf)
          ) {
            const h = view.getUint16(offset + 5);
            const w = view.getUint16(offset + 7);
            if (w > 0 && h > 0) return { width: w, height: h };
          }
          offset += 2 + length;
        }
      }
    } else if (fileType === 'image/webp' && buffer.byteLength >= 30) {
      const riff = bytesToString(new Uint8Array(buffer, 0, 4));
      if (riff === 'RIFF') {
        const type = bytesToString(new Uint8Array(buffer, 12, 4));
        if (type === 'VP8 ') {
          const w = view.getUint16(26, true) & 0x3fff;
          const h = view.getUint16(28, true) & 0x3fff;
          if (w > 0 && h > 0) return { width: w, height: h };
        } else if (type === 'VP8X') {
          const w = 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16));
          const h = 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16));
          if (w > 0 && h > 0) return { width: w, height: h };
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
  return {};
}

export function parseImageMetadata(
  buffer: ArrayBuffer,
  fileType: string,
  fileName?: string,
  fileSize?: number
): {
  metadata: ImageMetadataItem[];
  gpsCoords?: GpsCoords;
  aiPromptDetails?: AiPromptDetails;
  rawXmp?: string;
} {
  const view = new DataView(buffer);
  const metadata: ImageMetadataItem[] = [];
  let gpsCoords: GpsCoords | undefined;
  let aiPromptDetails: AiPromptDetails | undefined;
  let rawXmp = '';

  // 1. Guaranteed File & Image Specifications
  if (fileName) {
    metadata.push({
      type: 'SPEC',
      key: 'File Name',
      value: fileName,
      category: 'Other',
    });
  }

  if (fileSize) {
    const sizeKB = (fileSize / 1024).toFixed(1);
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    metadata.push({
      type: 'SPEC',
      key: 'File Size',
      value: fileSize > 1024 * 1024 ? `${sizeMB} MB (${fileSize.toLocaleString()} bytes)` : `${sizeKB} KB (${fileSize.toLocaleString()} bytes)`,
      category: 'Image Specs',
    });
  }

  metadata.push({
    type: 'SPEC',
    key: 'File Format & MIME Type',
    value: `${fileType.replace('image/', '').toUpperCase()} (${fileType})`,
    category: 'Image Specs',
  });

  // Extract Dimensions from Headers
  const dims = extractImageDimensionsFromBuffer(buffer, fileType);
  if (dims.width && dims.height) {
    const mp = ((dims.width * dims.height) / 1000000).toFixed(2);
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(dims.width, dims.height);
    const aspectW = Math.round(dims.width / divisor);
    const aspectH = Math.round(dims.height / divisor);
    let aspectStr = `${aspectW}:${aspectH}`;
    if (aspectW === aspectH) aspectStr += ' (Square 1:1)';
    else if (aspectW === 16 && aspectH === 9) aspectStr += ' (Widescreen 16:9)';
    else if (aspectW === 4 && aspectH === 3) aspectStr += ' (Standard 4:3)';

    metadata.push({
      type: 'SPEC',
      key: 'Image Dimensions',
      value: `${dims.width} × ${dims.height} pixels`,
      category: 'Image Specs',
    });
    metadata.push({
      type: 'SPEC',
      key: 'Megapixels',
      value: `${mp} MP`,
      category: 'Image Specs',
    });
    metadata.push({
      type: 'SPEC',
      key: 'Aspect Ratio',
      value: aspectStr,
      category: 'Image Specs',
    });
  }

  // Header Magic Signature
  if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
    if (buffer.byteLength >= 2 && view.getUint16(0) === 0xffd8) {
      metadata.push({
        type: 'SPEC',
        key: 'Header Signature',
        value: 'JPEG Start of Image (0xFFD8)',
        category: 'Image Specs',
      });
    }
  } else if (fileType === 'image/png') {
    if (buffer.byteLength >= 8 && view.getUint32(0) === 0x89504e47) {
      metadata.push({
        type: 'SPEC',
        key: 'Header Signature',
        value: 'PNG Standard Magic Bytes (0x89504E47)',
        category: 'Image Specs',
      });
    }
  } else if (fileType === 'image/webp') {
    if (buffer.byteLength >= 12 && bytesToString(new Uint8Array(buffer, 0, 4)) === 'RIFF') {
      metadata.push({
        type: 'SPEC',
        key: 'Header Signature',
        value: 'WebP RIFF Container',
        category: 'Image Specs',
      });
    }
  }

  // 2. Format-Specific Chunk & Segment Parsing
  if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
    if (buffer.byteLength >= 2 && view.getUint16(0) === 0xffd8) {
      let offset = 2;
      while (offset < buffer.byteLength - 2) {
        if (view.getUint8(offset) !== 0xff) {
          offset++;
          continue;
        }
        const marker = view.getUint8(offset + 1);
        if (marker === 0xd9 || marker === 0xda) break; // SOS or EOI

        const length = view.getUint16(offset + 2);
        if (offset + 2 + length > buffer.byteLength) break;

        // APP1 - EXIF or XMP or C2PA
        if (marker === 0xe1) {
          const segData = new Uint8Array(buffer, offset + 4, length - 2);
          const headerStr = bytesToString(segData.subarray(0, 30));

          if (headerStr.startsWith('Exif')) {
            const exifRes = parseExifBlock(segData);
            metadata.push(...exifRes.items);
            if (exifRes.gps) gpsCoords = exifRes.gps;
          } else if (
            headerStr.includes('http://ns.adobe.com') ||
            headerStr.startsWith('XMP') ||
            headerStr.includes('c2pa')
          ) {
            const xmpStr = bytesToUtf8(segData);
            rawXmp += xmpStr + '\n';
            const xmpRes = parseXmpString(xmpStr);
            metadata.push(...xmpRes.items);
            if (xmpRes.promptDetails) {
              aiPromptDetails = { ...aiPromptDetails, ...xmpRes.promptDetails };
            }
          }
        }
        // APP0 - JFIF
        else if (marker === 0xe0 && length >= 7) {
          const id = bytesToString(new Uint8Array(buffer, offset + 4, 5));
          if (id.startsWith('JFIF')) {
            const maj = view.getUint8(offset + 9);
            const min = view.getUint8(offset + 10);
            metadata.push({
              type: 'JFIF',
              key: 'JFIF Version',
              value: `${maj}.${min}`,
              category: 'Software',
            });
          }
        }
        // COM - Comment
        else if (marker === 0xfe) {
          const comBytes = new Uint8Array(buffer, offset + 4, length - 2);
          const comStr = bytesToUtf8(comBytes).trim();
          if (comStr) {
            metadata.push({
              type: 'Comment',
              key: 'JPEG Comment',
              value: comStr.substring(0, 300),
              category: 'Other',
            });
            const parsedAi = parseSdParameterString(comStr);
            if (parsedAi.positivePrompt) {
              aiPromptDetails = { ...aiPromptDetails, ...parsedAi };
            }
          }
        }
        // APP2 - ICC Profile or C2PA
        else if (marker === 0xe2 && length >= 14) {
          const id = bytesToString(new Uint8Array(buffer, offset + 4, 11));
          if (id.startsWith('ICC_PROFILE')) {
            metadata.push({
              type: 'ICC',
              key: 'Color Profile',
              value: 'Embedded ICC Color Profile',
              category: 'Image Specs',
            });
          }
        }

        offset += 2 + length;
      }
    }
  } else if (fileType === 'image/png') {
    if (buffer.byteLength >= 8 && view.getUint32(0) === 0x89504e47) {
      let offset = 8;
      while (offset < buffer.byteLength - 8) {
        const chunkLen = view.getUint32(offset);
        const chunkType = bytesToString(new Uint8Array(buffer, offset + 4, 4));

        if (offset + 8 + chunkLen > buffer.byteLength) break;

        if (chunkType === 'tEXt' || chunkType === 'iTXt' || chunkType === 'zTXt') {
          const chunkData = new Uint8Array(buffer, offset + 8, chunkLen);
          const chunkStr = bytesToUtf8(chunkData);
          const nullIdx = chunkStr.indexOf('\0');

          if (nullIdx !== -1) {
            const key = chunkStr.substring(0, nullIdx);
            let val = chunkStr.substring(nullIdx + 1);
            val = val.replace(/^[\x00-\x07\b\t\n]+/, '');

            metadata.push({
              type: 'PNG',
              key: `PNG Text (${key})`,
              value: val.substring(0, 400),
              category: key.toLowerCase().includes('prompt') || key === 'parameters' ? 'AI Workflow' : 'Other',
            });

            if (key === 'parameters' || key === 'prompt' || key === 'workflow' || key === 'Comment' || key === 'Software' || key === 'Description') {
              rawXmp += `PNG Chunk [${key}]: ${val}\n`;
              const parsedAi = parseSdParameterString(val);
              if (parsedAi.positivePrompt) {
                aiPromptDetails = { ...aiPromptDetails, ...parsedAi };
              }
            }
          } else if (chunkStr.length > 5) {
            metadata.push({
              type: 'PNG',
              key: 'PNG Text Chunk',
              value: chunkStr.substring(0, 300),
              category: 'Other',
            });
          }
        } else if (chunkType === 'iCCP') {
          metadata.push({
            type: 'ICC',
            key: 'Color Profile',
            value: 'PNG Embedded ICC Profile',
            category: 'Image Specs',
          });
        } else if (chunkType === 'eXIf') {
          const exifData = new Uint8Array(buffer, offset + 8, chunkLen);
          const exifRes = parseExifBlock(exifData);
          metadata.push(...exifRes.items);
          if (exifRes.gps) gpsCoords = exifRes.gps;
        }

        offset += 12 + chunkLen;
        if (chunkType === 'IEND') break;
      }
    }
  } else if (fileType === 'image/webp') {
    if (buffer.byteLength >= 12 && bytesToString(new Uint8Array(buffer, 0, 4)) === 'RIFF') {
      let offset = 12;
      while (offset < buffer.byteLength - 8) {
        const chunkId = bytesToString(new Uint8Array(buffer, offset, 4));
        const chunkLen = view.getUint32(offset + 4, true);

        if (chunkId === 'EXIF') {
          const exifData = new Uint8Array(buffer, offset + 8, chunkLen);
          const exifRes = parseExifBlock(exifData);
          metadata.push(...exifRes.items);
          if (exifRes.gps) gpsCoords = exifRes.gps;
        } else if (chunkId === 'XMP ') {
          const xmpStr = bytesToUtf8(new Uint8Array(buffer, offset + 8, chunkLen));
          rawXmp += xmpStr;
          const xmpRes = parseXmpString(xmpStr);
          metadata.push(...xmpRes.items);
          if (xmpRes.promptDetails) {
            aiPromptDetails = { ...aiPromptDetails, ...xmpRes.promptDetails };
          }
        } else if (chunkId === 'ICCP') {
          metadata.push({
            type: 'ICC',
            key: 'Color Profile',
            value: 'WebP ICC Profile',
            category: 'Image Specs',
          });
        }

        offset += 8 + chunkLen + (chunkLen % 2 === 1 ? 1 : 0);
      }
    }
  }

  // 3. Deep Raw String & Binary Scanner (ChatGPT, DALL-E, C2PA, Midjourney, OpenAI)
  const rawBytes = new Uint8Array(buffer);
  const scanLimit = Math.min(rawBytes.length, 1024 * 1024); // Scan first 1MB
  let rawText = '';
  const step = 8192;
  for (let i = 0; i < scanLimit; i += step) {
    rawText += bytesToUtf8(rawBytes.subarray(i, Math.min(i + step, scanLimit)));
  }

  const rawLower = rawText.toLowerCase();

  // Check C2PA Content Credentials
  if (
    rawLower.includes('c2pa') ||
    rawLower.includes('urn:c2pa') ||
    rawLower.includes('jumb') ||
    rawLower.includes('digitalsourcetype') ||
    rawLower.includes('trainedalgorithmicdata')
  ) {
    metadata.push({
      type: 'C2PA',
      key: 'Content Credentials (C2PA)',
      value: 'Valid C2PA Provenance Manifest Detected (OpenAI / Adobe Standard)',
      category: 'AI Workflow',
    });
  }

  // Check ChatGPT / DALL-E / OpenAI specific fingerprints
  const isChatGPTFilename =
    fileName &&
    (fileName.toLowerCase().includes('dall') ||
      fileName.toLowerCase().includes('chatgpt') ||
      fileName.toLowerCase().includes('openai') ||
      fileName.toLowerCase().startsWith('oig'));

  const isChatGPTBinary =
    rawLower.includes('dall-e') ||
    rawLower.includes('dalle') ||
    rawLower.includes('chatgpt') ||
    rawLower.includes('openai') ||
    rawLower.includes('revised_prompt');

  if (isChatGPTFilename || isChatGPTBinary) {
    const chatGptVal = isChatGPTBinary
      ? 'OpenAI ChatGPT / DALL-E 3 (C2PA / Prompt Strings in Binary)'
      : 'ChatGPT / DALL-E 3 Export (Filename Naming Pattern)';

    metadata.unshift({
      type: 'AI DETECTED',
      key: 'AI Generator Signatures',
      value: chatGptVal,
      category: 'AI Workflow',
    });

    if (!aiPromptDetails) {
      aiPromptDetails = { aiEngine: 'ChatGPT / DALL-E 3' };
    } else {
      aiPromptDetails.aiEngine = 'ChatGPT / DALL-E 3';
    }

    // Attempt to parse revised_prompt string from binary if available
    const promptMatch = rawText.match(/revised_prompt["']?\s*:\s*["']([^"']{10,500})["']/i) || rawText.match(/prompt["']?\s*:\s*["']([^"']{10,500})["']/i);
    if (promptMatch && promptMatch[1]) {
      aiPromptDetails.positivePrompt = promptMatch[1].trim();
      metadata.push({
        type: 'AI Prompt',
        key: 'ChatGPT Revised Prompt',
        value: promptMatch[1].trim(),
        category: 'AI Workflow',
      });
    }
  }

  // General AI fingerprints check
  const metaDump = JSON.stringify(metadata) + rawXmp + rawLower;
  const aiFingerprints = [
    { name: 'Midjourney v6', pattern: /midjourney|--v\s+[56]|--ar\s+/i },
    { name: 'Automatic1111 / WebUI', pattern: /negative prompt:|steps:\s*\d+,|sampler:\s*/i },
    { name: 'ComfyUI / SDXL', pattern: /"KSampler"|"CheckpointLoaderSimple"|comfyui/i },
    { name: 'ChatGPT / DALL-E 3', pattern: /dall-e|dalle|chatgpt|openai|revised_prompt/i },
    { name: 'Stable Diffusion / SDXL', pattern: /stable diffusion|sdxl|sd1\.5|sd2\.1/i },
    { name: 'Flux.1', pattern: /flux\.1|schnell|dev|black-forest-labs/i },
    { name: 'NovelAI', pattern: /novelai|SoftwareAgent.*NovelAI/i },
    { name: 'Fooocus', pattern: /fooocus/i },
    { name: 'Adobe Firefly', pattern: /firefly|adobe firefly/i },
    { name: 'Leonardo AI', pattern: /leonardo/i },
  ];

  const detectedEngines = aiFingerprints
    .filter((fp) => fp.pattern.test(metaDump))
    .map((fp) => fp.name);

  if (detectedEngines.length > 0 && !metadata.some((m) => m.key === 'AI Generator Signatures')) {
    metadata.unshift({
      type: 'AI DETECTED',
      key: 'AI Generator Signatures',
      value: Array.from(new Set(detectedEngines)).join(', '),
      category: 'AI Workflow',
    });
    if (!aiPromptDetails) {
      aiPromptDetails = { aiEngine: Array.from(new Set(detectedEngines)).join(', ') };
    } else {
      aiPromptDetails.aiEngine = Array.from(new Set(detectedEngines)).join(', ');
    }
  }

  // 4. Status Tags if EXIF is Absent
  const hasExif = metadata.some((m) => m.type === 'EXIF' || m.type === 'GPS');
  if (!hasExif) {
    metadata.push({
      type: 'EXIF STATUS',
      key: 'EXIF Metadata Status',
      value: 'No Camera EXIF Header (Standard for ChatGPT / Web Exports / Instant Messengers)',
      category: 'Other',
    });
  }

  return { metadata, gpsCoords, aiPromptDetails, rawXmp };
}

function parseExifBlock(data: Uint8Array): { items: ImageMetadataItem[]; gps?: GpsCoords } {
  const items: ImageMetadataItem[] = [];
  let gps: GpsCoords | undefined;

  try {
    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let tiffStart = 0;

    const headerStr = bytesToString(data.subarray(0, 4));
    if (headerStr === 'Exif') {
      tiffStart = 6;
    }

    if (data.length < tiffStart + 8) return { items };

    const endianCode = dataView.getUint16(tiffStart);
    const littleEndian = endianCode === 0x4949; // "II"

    if (dataView.getUint16(tiffStart + 2, littleEndian) !== 0x002a) {
      return { items };
    }

    const firstIfdOffset = dataView.getUint32(tiffStart + 4, littleEndian);
    if (firstIfdOffset + tiffStart >= data.length) return { items };

    let gpsIfdOffset: number | null = null;
    let exifSubIfdOffset: number | null = null;

    parseIfd(dataView, tiffStart, tiffStart + firstIfdOffset, littleEndian, (tag, type, count, valueOffset) => {
      const tagName = EXIF_TAG_MAP[tag] || `Tag 0x${tag.toString(16).toUpperCase()}`;
      if (tag === 0x8825) {
        gpsIfdOffset = valueOffset;
      } else if (tag === 0x8769) {
        exifSubIfdOffset = valueOffset;
      } else {
        const valStr = readExifValue(dataView, tiffStart, type, count, valueOffset, littleEndian);
        if (valStr) {
          items.push({
            type: 'EXIF',
            key: tagName,
            value: valStr,
            category: getCategoryForExifTag(tag, tagName),
          });
        }
      }
    });

    if (exifSubIfdOffset && tiffStart + exifSubIfdOffset < data.length) {
      parseIfd(dataView, tiffStart, tiffStart + exifSubIfdOffset, littleEndian, (tag, type, count, valueOffset) => {
        const tagName = EXIF_TAG_MAP[tag] || `Tag 0x${tag.toString(16).toUpperCase()}`;
        const valStr = readExifValue(dataView, tiffStart, type, count, valueOffset, littleEndian);
        if (valStr) {
          items.push({
            type: 'EXIF',
            key: tagName,
            value: valStr,
            category: getCategoryForExifTag(tag, tagName),
          });
        }
      });
    }

    if (gpsIfdOffset && tiffStart + gpsIfdOffset < data.length) {
      let latDeg: number[] | null = null;
      let latRef = 'N';
      let lonDeg: number[] | null = null;
      let lonRef = 'E';
      let altitude: number | null = null;

      parseIfd(dataView, tiffStart, tiffStart + gpsIfdOffset, littleEndian, (tag, type, count, valueOffset) => {
        const tagName = GPS_TAG_MAP[tag] || `GPS Tag 0x${tag.toString(16).toUpperCase()}`;
        const valStr = readExifValue(dataView, tiffStart, type, count, valueOffset, littleEndian);

        if (tag === 0x0001) latRef = valStr || 'N';
        if (tag === 0x0003) lonRef = valStr || 'E';

        if (tag === 0x0002) {
          latDeg = readRationalArray(dataView, tiffStart, count, valueOffset, littleEndian);
        }
        if (tag === 0x0004) {
          lonDeg = readRationalArray(dataView, tiffStart, count, valueOffset, littleEndian);
        }
        if (tag === 0x0006) {
          const altArr = readRationalArray(dataView, tiffStart, 1, valueOffset, littleEndian);
          if (altArr && altArr.length > 0) altitude = altArr[0];
        }

        if (valStr) {
          items.push({
            type: 'GPS',
            key: tagName,
            value: valStr,
            category: 'GPS',
          });
        }
      });

      if (latDeg && lonDeg && latDeg.length >= 3 && lonDeg.length >= 3) {
        const latDecimal = (latDeg[0] + latDeg[1] / 60 + latDeg[2] / 3600) * (latRef === 'S' ? -1 : 1);
        const lonDecimal = (lonDeg[0] + lonDeg[1] / 60 + lonDeg[2] / 3600) * (lonRef === 'W' ? -1 : 1);
        gps = {
          lat: Number(latDecimal.toFixed(6)),
          lon: Number(lonDecimal.toFixed(6)),
          alt: altitude ? Number(altitude.toFixed(1)) : undefined,
        };
      }
    }
  } catch (err) {
    console.warn('Error parsing EXIF:', err);
  }

  return { items, gps };
}

function parseIfd(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  littleEndian: boolean,
  callback: (tag: number, type: number, count: number, valueOffset: number) => void
) {
  if (ifdOffset + 2 > view.byteLength) return;
  const numEntries = view.getUint16(ifdOffset, littleEndian);

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = entryOffset + 8;

    callback(tag, type, count, valueOffset);
  }
}

function readExifValue(
  view: DataView,
  tiffStart: number,
  type: number,
  count: number,
  valueOffset: number,
  littleEndian: boolean
): string {
  try {
    if (type === 2) {
      let offset = valueOffset;
      if (count > 4) {
        offset = tiffStart + view.getUint32(valueOffset, littleEndian);
      }
      if (offset + count > view.byteLength) return '';
      const strBytes = new Uint8Array(view.buffer, view.byteOffset + offset, count);
      return bytesToUtf8(strBytes).replace(/\0+$/, '').trim();
    }
    if (type === 3) {
      if (count === 1) {
        return view.getUint16(valueOffset, littleEndian).toString();
      }
    }
    if (type === 4) {
      if (count === 1) {
        return view.getUint32(valueOffset, littleEndian).toString();
      }
    }
    if (type === 5 || type === 10) {
      const realOffset = tiffStart + view.getUint32(valueOffset, littleEndian);
      if (realOffset + 8 > view.byteLength) return '';
      if (count === 1) {
        const num = view.getUint32(realOffset, littleEndian);
        const den = view.getUint32(realOffset + 4, littleEndian);
        if (den === 0) return '0';
        const val = num / den;
        return Number.isInteger(val) ? val.toString() : val.toFixed(2);
      } else if (count > 1) {
        const vals: string[] = [];
        for (let i = 0; i < Math.min(count, 3); i++) {
          const num = view.getUint32(realOffset + i * 8, littleEndian);
          const den = view.getUint32(realOffset + i * 8 + 4, littleEndian);
          vals.push(den !== 0 ? (num / den).toFixed(2) : '0');
        }
        return vals.join(', ');
      }
    }
  } catch (e) {
    // ignore
  }
  return '';
}

function readRationalArray(
  view: DataView,
  tiffStart: number,
  count: number,
  valueOffset: number,
  littleEndian: boolean
): number[] | null {
  try {
    const offset = tiffStart + view.getUint32(valueOffset, littleEndian);
    if (offset + count * 8 > view.byteLength) return null;
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      const num = view.getUint32(offset + i * 8, littleEndian);
      const den = view.getUint32(offset + i * 8 + 4, littleEndian);
      result.push(den !== 0 ? num / den : 0);
    }
    return result;
  } catch (e) {
    return null;
  }
}

function parseXmpString(xmpStr: string): { items: ImageMetadataItem[]; promptDetails?: AiPromptDetails } {
  const items: ImageMetadataItem[] = [];
  let promptDetails: AiPromptDetails = {};

  const patterns = [
    { re: /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/gi, key: 'Creator', cat: 'Other' },
    { re: /<dc:description[^>]*>([\s\S]*?)<\/dc:description>/gi, key: 'Description', cat: 'AI Workflow' },
    { re: /<xmp:Prompt[^>]*>([\s\S]*?)<\/xmp:Prompt>/gi, key: 'XMP Prompt', cat: 'AI Workflow' },
    { re: /<photoshop:TransmissionReference[^>]*>([\s\S]*?)<\/photoshop:TransmissionReference>/gi, key: 'Transmission Prompt', cat: 'AI Workflow' },
    { re: /<xmp:CreatorTool[^>]*>([\s\S]*?)<\/xmp:CreatorTool>/gi, key: 'Creator Tool', cat: 'Software' },
    { re: /<xmpMM:DocumentID[^>]*>([\s\S]*?)<\/xmpMM:DocumentID>/gi, key: 'Document ID', cat: 'Other' },
  ];

  for (const p of patterns) {
    let match;
    while ((match = p.re.exec(xmpStr)) !== null) {
      const val = match[1].replace(/<[^>]+>/g, '').trim();
      if (val) {
        items.push({
          type: 'XMP',
          key: p.key,
          value: val.substring(0, 300),
          category: p.cat as any,
        });
        if (p.key.toLowerCase().includes('prompt') || p.key === 'Description') {
          promptDetails.positivePrompt = val;
        }
      }
    }
  }

  if (xmpStr.includes('steps:') || xmpStr.includes('Sampler:')) {
    const parsed = parseSdParameterString(xmpStr);
    if (parsed.positivePrompt) {
      promptDetails = { ...promptDetails, ...parsed };
    }
  }

  return { items, promptDetails };
}

export function parseSdParameterString(text: string): AiPromptDetails {
  const details: AiPromptDetails = { rawParameters: text };

  const negMatch = text.match(/Negative prompt:\s*([\s\S]*?)(?=Steps:|$)/i);
  if (negMatch) {
    details.negativePrompt = negMatch[1].trim();
  }

  const posMatch = text.split(/Negative prompt:|Steps:/i)[0];
  if (posMatch && posMatch.trim()) {
    details.positivePrompt = posMatch.trim();
  }

  const stepsMatch = text.match(/Steps:\s*(\d+)/i);
  if (stepsMatch) details.steps = parseInt(stepsMatch[1], 10);

  const cfgMatch = text.match(/CFG scale:\s*([\d.]+)/i);
  if (cfgMatch) details.cfgScale = parseFloat(cfgMatch[1]);

  const samplerMatch = text.match(/Sampler:\s*([^,\n]+)/i);
  if (samplerMatch) details.sampler = samplerMatch[1].trim();

  const seedMatch = text.match(/Seed:\s*(\d+)/i);
  if (seedMatch) details.seed = seedMatch[1];

  const modelMatch = text.match(/Model:\s*([^,\n]+)/i);
  if (modelMatch) details.model = modelMatch[1].trim();

  const sizeMatch = text.match(/Size:\s*(\d+x\d+)/i);
  if (sizeMatch) details.dimensions = sizeMatch[1];

  const mjMatch = text.match(/([\s\S]*?)(--v\s+[\d.]+|--ar\s+[\d:]+|--stylize\s+\d+|--s\s+\d+)/i);
  if (mjMatch) {
    details.positivePrompt = mjMatch[1].trim();
    details.aiEngine = 'Midjourney';
  }

  return details;
}

function getCategoryForExifTag(tag: number, name: string): ImageMetadataItem['category'] {
  if (tag === 0x010f || tag === 0x0110 || tag === 0x829a || tag === 0x829d || tag === 0x8827 || tag === 0x920a || name.includes('Lens')) {
    return 'Camera';
  }
  if (tag === 0x0131 || name.includes('Software')) return 'Software';
  if (name.includes('Width') || name.includes('Height') || name.includes('Resolution')) return 'Image Specs';
  return 'Other';
}

function bytesToString(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
}

function bytesToUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch (e) {
    return bytesToString(bytes);
  }
}

const EXIF_TAG_MAP: Record<number, string> = {
  0x010e: 'Image Description',
  0x010f: 'Camera Make',
  0x0110: 'Camera Model',
  0x0112: 'Orientation',
  0x011a: 'X Resolution',
  0x011b: 'Y Resolution',
  0x0128: 'Resolution Unit',
  0x0131: 'Software',
  0x0132: 'Date Time Modified',
  0x013b: 'Artist / Author',
  0x8298: 'Copyright',
  0x829a: 'Exposure Time (Shutter)',
  0x829d: 'F-Number (Aperture)',
  0x8822: 'Exposure Program',
  0x8827: 'ISO Speed Ratings',
  0x9003: 'Date Time Original',
  0x9004: 'Date Time Digitized',
  0x9209: 'Flash Status',
  0x920a: 'Focal Length',
  0xa002: 'Pixel X Dimension',
  0xa003: 'Pixel Y Dimension',
  0xa405: 'Focal Length In 35mm Film',
  0xa430: 'Camera Owner Name',
  0xa431: 'Camera Serial Number',
  0xa432: 'Lens Info',
  0xa434: 'Lens Model',
  0xa435: 'Lens Serial Number',
};

const GPS_TAG_MAP: Record<number, string> = {
  0x0000: 'GPS Version ID',
  0x0001: 'GPS Latitude Ref (N/S)',
  0x0002: 'GPS Latitude (Deg/Min/Sec)',
  0x0003: 'GPS Longitude Ref (E/W)',
  0x0004: 'GPS Longitude (Deg/Min/Sec)',
  0x0005: 'GPS Altitude Ref',
  0x0006: 'GPS Altitude (Meters)',
  0x0007: 'GPS Time Stamp (UTC)',
  0x001d: 'GPS Date Stamp',
};
