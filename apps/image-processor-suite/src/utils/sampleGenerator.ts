/**
 * Generates a high-definition sample canvas image file client-side
 * for instant demonstration without requiring any local uploads or external URLs.
 */
export async function generateSampleFile(): Promise<File> {
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context unavailable');

  // Background Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(0.5, '#1e1b4b');
  bgGradient.addColorStop(1, '#311042');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Decorative glowing geometric shapes
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 40 + Math.random() * 160;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sample Typography Banner
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('Image Processor Suite', width / 2, height / 2 - 20);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '32px sans-serif';
  ctx.fillText('100% Client-Side Private • HD Demo Image', width / 2, height / 2 + 50);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '24px sans-serif';
  ctx.fillText('1920 × 1080 px Resolution', width / 2, height / 2 + 100);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob!], 'sample_hd_photo.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      resolve(file);
    }, 'image/jpeg', 0.95);
  });
}
