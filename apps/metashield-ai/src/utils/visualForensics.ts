import { ForensicFilter } from '../types';

export async function processForensicAnalysis(
  imgUrl: string,
  filter: ForensicFilter,
  multiplier: number = 15
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      ctx.drawImage(img, 0, 0);

      if (filter === 'normal') {
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      if (filter === 'ela') {
        // Error Level Analysis (ELA): Re-compress at 90% quality and calculate absolute delta
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return resolve(canvas.toDataURL());

        tempCtx.drawImage(img, 0, 0);

        const compressedJpeg = tempCanvas.toDataURL('image/jpeg', 0.9);
        const compImg = new Image();

        compImg.onload = () => {
          tempCtx.drawImage(compImg, 0, 0);
          const compData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;

          for (let i = 0; i < data.length; i += 4) {
            const diffR = Math.abs(data[i] - compData[i]) * multiplier;
            const diffG = Math.abs(data[i + 1] - compData[i + 1]) * multiplier;
            const diffB = Math.abs(data[i + 2] - compData[i + 2]) * multiplier;

            data[i] = Math.min(255, diffR);
            data[i + 1] = Math.min(255, diffG);
            data[i + 2] = Math.min(255, diffB);
            data[i + 3] = 255;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };

        compImg.src = compressedJpeg;
        return;
      }

      if (filter === 'channel-r') {
        for (let i = 0; i < data.length; i += 4) {
          data[i + 1] = 0;
          data[i + 2] = 0;
        }
      } else if (filter === 'channel-g') {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 0;
          data[i + 2] = 0;
        }
      } else if (filter === 'channel-b') {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 0;
          data[i + 1] = 0;
        }
      } else if (filter === 'alpha') {
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          data[i] = a;
          data[i + 1] = a;
          data[i + 2] = a;
          data[i + 3] = 255;
        }
      } else if (filter === 'luminance') {
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = lum;
          data[i + 1] = lum;
          data[i + 2] = lum;
        }
      } else if (filter === 'noise') {
        // High-pass noise analysis
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const noise = (avg % 16) * 16;
          data[i] = noise;
          data[i + 1] = noise;
          data[i + 2] = noise;
        }
      } else if (filter === 'lsb-bitplane') {
        // Least Significant Bit (LSB) inspection for steganography
        for (let i = 0; i < data.length; i += 4) {
          const lsbR = (data[i] & 1) * 255;
          const lsbG = (data[i + 1] & 1) * 255;
          const lsbB = (data[i + 2] & 1) * 255;
          data[i] = lsbR;
          data[i + 1] = lsbG;
          data[i + 2] = lsbB;
        }
      } else if (filter === 'edges') {
        // Sobel Edge Detection
        const width = canvas.width;
        const height = canvas.height;
        const copy = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            // Simple gradient
            const gx =
              -copy[((y - 1) * width + (x - 1)) * 4] +
              copy[((y - 1) * width + (x + 1)) * 4] -
              2 * copy[(y * width + (x - 1)) * 4] +
              2 * copy[(y * width + (x + 1)) * 4] -
              copy[((y + 1) * width + (x - 1)) * 4] +
              copy[((y + 1) * width + (x + 1)) * 4];

            const gy =
              -copy[((y - 1) * width + (x - 1)) * 4] -
              2 * copy[((y - 1) * width + x) * 4] -
              copy[((y - 1) * width + (x + 1)) * 4] +
              copy[((y + 1) * width + (x - 1)) * 4] +
              2 * copy[((y + 1) * width + x) * 4] +
              copy[((y + 1) * width + (x + 1)) * 4];

            const val = Math.min(255, Math.sqrt(gx * gx + gy * gy));
            data[idx] = val;
            data[idx + 1] = val;
            data[idx + 2] = val;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject('Failed to load image for forensic processing');
    img.src = imgUrl;
  });
}
