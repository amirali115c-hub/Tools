export interface SampleFileDef {
  id: string;
  name: string;
  type: 'image/jpeg' | 'image/png';
  title: string;
  description: string;
  tagBadge: string;
  svgContent: string;
}

export const SAMPLE_FILES: SampleFileDef[] = [
  {
    id: 'sample-ai-midjourney',
    name: 'cyberpunk_neon_city_mj_v6.png',
    type: 'image/png',
    title: 'Midjourney v6 AI Generation',
    description: 'Embedded with --v 6.0 prompts, Seed 8472910, Stylize 250, Chaos 10, and aspect ratio flags.',
    tagBadge: 'AI Generated (Midjourney)',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#31104b" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
        <linearGradient id="neon" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ec4899" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#bg)" />
      <circle cx="400" cy="350" r="180" fill="none" stroke="url(#neon)" stroke-width="6" />
      <path d="M 200 600 L 400 350 L 600 600 Z" fill="none" stroke="#ec4899" stroke-width="4" opacity="0.8" />
      <text x="400" y="400" font-family="sans-serif" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle">MIDJOURNEY v6.0 SAMPLE</text>
      <text x="400" y="440" font-family="monospace" font-size="16" fill="#e2e8f0" text-anchor="middle">prompt: Cyberpunk metropolis at dusk --v 6.0 --ar 1:1</text>
    </svg>`,
  },
  {
    id: 'sample-camera-gps',
    name: 'tokyo_shibuya_canon_eos.jpg',
    type: 'image/jpeg',
    title: 'Photographic EXIF + GPS Location',
    description: 'Contains Canon EOS R5 camera metadata, ISO 400, f/1.8, 50mm, plus Shibuya GPS coordinates.',
    tagBadge: 'EXIF + GPS Leak',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="camBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#camBg)" />
      <rect x="250" y="250" width="300" height="200" rx="20" fill="#334155" stroke="#38bdf8" stroke-width="4" />
      <circle cx="400" cy="350" r="60" fill="#0f172a" stroke="#f59e0b" stroke-width="6" />
      <text x="400" y="520" font-family="sans-serif" font-weight="bold" font-size="22" fill="#38bdf8" text-anchor="middle">CANON EOS R5 • 50mm f/1.8</text>
      <text x="400" y="560" font-family="monospace" font-size="15" fill="#f59e0b" text-anchor="middle">GPS: 35.6595° N, 139.7004° E (Shibuya, Tokyo)</text>
    </svg>`,
  },
  {
    id: 'sample-comfyui-node',
    name: 'fantasy_dragon_comfyui_sdxl.png',
    type: 'image/png',
    title: 'ComfyUI / SDXL Node Workflow',
    description: 'Full JSON workflow graph, KSampler settings, positive & negative prompt text chunks.',
    tagBadge: 'ComfyUI Workflow Embedded',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#020617" />
      <path d="M 100 200 Q 400 100 700 300 T 400 700" fill="none" stroke="#a855f7" stroke-width="4" opacity="0.6" />
      <rect x="200" y="200" width="180" height="120" rx="10" fill="#1e1b4b" stroke="#a855f7" stroke-width="2" />
      <text x="290" y="240" font-family="sans-serif" font-weight="bold" font-size="16" fill="#c084fc" text-anchor="middle">Load Checkpoint</text>
      <text x="290" y="270" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">sd_xl_base_1.0.safetensors</text>
      
      <rect x="420" y="320" width="180" height="120" rx="10" fill="#1e1b4b" stroke="#06b6d4" stroke-width="2" />
      <text x="510" y="360" font-family="sans-serif" font-weight="bold" font-size="16" fill="#22d3ee" text-anchor="middle">KSampler</text>
      <text x="510" y="390" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="middle">Steps: 30 | Euler a</text>
      <text x="400" y="580" font-family="sans-serif" font-weight="bold" font-size="20" fill="#e2e8f0" text-anchor="middle">COMFYUI SDXL WORKFLOW SAMPLE</text>
    </svg>`,
  },
  {
    id: 'sample-chatgpt-dalle',
    name: 'DALL·E_2024-ChatGPT_Image_futuristic_city.png',
    type: 'image/png',
    title: 'ChatGPT / DALL-E 3 Image',
    description: 'Generated via ChatGPT OpenAI, with DALL-E filename conventions, C2PA claims, and prompt signatures.',
    tagBadge: 'ChatGPT / DALL-E 3 Detected',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="dalleBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#064e3b" />
          <stop offset="100%" stop-color="#022c22" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#dalleBg)" />
      <circle cx="400" cy="380" r="140" fill="none" stroke="#10b981" stroke-width="8" />
      <text x="400" y="390" font-family="sans-serif" font-weight="900" font-size="28" fill="#a7f3d0" text-anchor="middle">ChatGPT / DALL-E 3</text>
      <text x="400" y="430" font-family="monospace" font-size="14" fill="#6ee7b7" text-anchor="middle">OpenAI C2PA Manifest &amp; Revised Prompt Signature</text>
    </svg>`,
  },
];

export async function createSampleFileRecord(sample: SampleFileDef): Promise<File> {
  // Convert SVG string to PNG/Blob
  const svgBlob = new Blob([sample.svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        const finalBlob = blob || svgBlob;
        const file = new File([finalBlob], sample.name, {
          type: sample.type,
          lastModified: Date.now(),
        });
        resolve(file);
      }, sample.type);
    };
    img.src = url;
  });
}
