import { ImageFileRecord, AiPrivacyAudit } from '../types';

/**
 * Performs a comprehensive, 100% Client-Side Privacy, Forensics, and AI Audit.
 * Requires ZERO server calls or external API keys.
 */
export function performClientSidePrivacyAudit(record: ImageFileRecord): AiPrivacyAudit {
  const metadata = record.metadata || [];
  const gps = record.gpsCoords;
  const aiDetails = record.aiPromptDetails;
  const fileName = record.name.toLowerCase();
  const fileType = record.type.toLowerCase();

  // 1. Calculate Privacy Score (0 to 100, where higher means HIGHER RISK)
  let privacyScore = 0;
  const findings: AiPrivacyAudit['privacyFindings'] = [];

  // GPS Leak Detection
  if (gps) {
    privacyScore += 45;
    findings.push({
      category: 'GPS Location Leak',
      severity: 'critical',
      description: `Exact latitude (${gps.lat}) and longitude (${gps.lon}) embedded in EXIF. Anyone downloading this image can trace your home, school, or location.`,
      recommendation: 'Strip GPS metadata immediately before sharing online or sending to third parties.',
    });
  }

  // Camera Serial / Device Owner Leak
  const serialTag = metadata.find(
    (m) =>
      m.key.toLowerCase().includes('serial') ||
      m.key.toLowerCase().includes('owner') ||
      m.key.toLowerCase().includes('artist') ||
      m.key.toLowerCase().includes('copyright')
  );

  if (serialTag) {
    privacyScore += 25;
    findings.push({
      category: 'Device & Owner Signature',
      severity: 'high',
      description: `Device identity found: "${serialTag.key}: ${serialTag.value}". Can be cross-referenced across internet uploads to link your anonymous profiles.`,
      recommendation: 'Remove camera owner and serial number tags.',
    });
  }

  // AI Prompt & Workflow Leakage
  if (aiDetails?.positivePrompt || aiDetails?.rawParameters) {
    privacyScore += 20;
    findings.push({
      category: 'AI Prompt / IP Leakage',
      severity: 'medium',
      description: `Full AI generation prompt embedded in file: "${(aiDetails.positivePrompt || aiDetails.rawParameters || '').substring(0, 120)}..."`,
      recommendation: 'Scrub AI workflow text chunks to protect creative prompts and parameters.',
    });
  }

  // Camera Equipment & Timestamps
  const cameraTag = metadata.find((m) => m.category === 'Camera');
  if (cameraTag) {
    privacyScore += 10;
    findings.push({
      category: 'Hardware & Lens Profile',
      severity: 'low',
      description: `Exposes specific camera model and focal/shutter settings (${cameraTag.key}: ${cameraTag.value}).`,
      recommendation: 'Optional: Strip EXIF if you want full anonymity.',
    });
  }

  // C2PA / Content Credentials
  const c2paTag = metadata.find((m) => m.key.toLowerCase().includes('c2pa') || m.value.toLowerCase().includes('c2pa'));
  if (c2paTag) {
    privacyScore += 10;
    findings.push({
      category: 'Content Credentials (C2PA)',
      severity: 'low',
      description: 'Contains C2PA cryptographic provenance claim indicating digital or AI creation history.',
      recommendation: 'Preserve C2PA if attribution is required, or scrub for complete binary privacy.',
    });
  }

  // Default clean finding if score is low
  if (findings.length === 0) {
    findings.push({
      category: 'Basic File Structure',
      severity: 'low',
      description: 'No sensitive GPS, camera serials, or explicit personal identity metadata detected.',
      recommendation: 'Image is safe for general sharing.',
    });
  }

  // Cap score
  privacyScore = Math.min(100, Math.max(5, privacyScore));

  let riskLevel: AiPrivacyAudit['riskLevel'] = 'Low';
  if (privacyScore >= 70) riskLevel = 'Critical';
  else if (privacyScore >= 45) riskLevel = 'High';
  else if (privacyScore >= 25) riskLevel = 'Medium';

  // 2. Client-Side AI Generator Detection Engine
  const metaString = JSON.stringify(metadata).toLowerCase();
  let isAi = false;
  let confidence = 0;
  let detectedEngine = 'Photographic / Human Created';
  let reasoning = 'No AI generator tags or workflow parameters were detected in the file headers.';

  if (
    fileName.includes('dall') ||
    fileName.includes('chatgpt') ||
    fileName.includes('openai') ||
    metaString.includes('dall-e') ||
    metaString.includes('chatgpt') ||
    metaString.includes('openai') ||
    metaString.includes('revised_prompt')
  ) {
    isAi = true;
    confidence = 98;
    detectedEngine = 'ChatGPT / DALL-E 3';
    reasoning = 'Detected ChatGPT / DALL-E 3 naming signatures, C2PA claims, or OpenAI revised_prompt tags.';
  } else if (
    metaString.includes('midjourney') ||
    metaString.includes('--v 6') ||
    metaString.includes('--ar') ||
    fileName.includes('midjourney') ||
    fileName.includes('mj_')
  ) {
    isAi = true;
    confidence = 95;
    detectedEngine = 'Midjourney v6';
    reasoning = 'Found Midjourney parameter flags (--v, --ar, --stylize) or filename signatures.';
  } else if (
    metaString.includes('comfyui') ||
    metaString.includes('ksampler') ||
    metaString.includes('checkpointloadersimple')
  ) {
    isAi = true;
    confidence = 99;
    detectedEngine = 'ComfyUI / SDXL Workflow';
    reasoning = 'Full ComfyUI node graph and KSampler parameters embedded in PNG text chunk / XMP.';
  } else if (
    metaString.includes('negative prompt:') ||
    metaString.includes('steps:') ||
    metaString.includes('sampler:') ||
    metaString.includes('stable diffusion') ||
    metaString.includes('sdxl')
  ) {
    isAi = true;
    confidence = 92;
    detectedEngine = 'Stable Diffusion (A1111 / WebUI)';
    reasoning = 'Automatic1111 parameter block found with steps, sampler, and CFG scale specs.';
  } else if (aiDetails?.aiEngine) {
    isAi = true;
    confidence = 90;
    detectedEngine = aiDetails.aiEngine;
    reasoning = `AI generator signature identified as ${aiDetails.aiEngine}.`;
  } else if (fileType === 'image/png' && metadata.some((m) => m.key.includes('PNG Text'))) {
    // Check if text chunk looks like prompt
    const textChunk = metadata.find((m) => m.key.includes('PNG Text'))?.value || '';
    if (textChunk.length > 50 && (textChunk.includes('masterpiece') || textChunk.includes('rendering') || textChunk.includes('prompt'))) {
      isAi = true;
      confidence = 85;
      detectedEngine = 'Generative AI Engine';
      reasoning = 'PNG text chunk contains descriptive prompt keywords.';
    }
  }

  // 3. Social Media Sharing Safety
  const safeForPublic = privacyScore < 35;
  const socialSummary = safeForPublic
    ? 'This image contains minimal personal metadata and is safe for public distribution.'
    : `Warning: This file exhibits a ${riskLevel} privacy risk. Scrub metadata before posting publicly.`;

  return {
    privacyScore,
    riskLevel,
    aiDetectionResult: {
      isAiGenerated: isAi,
      confidence,
      detectedEngine,
      visualReasoning: reasoning,
    },
    privacyFindings: findings,
    reconstructedPromptInfo: {
      positivePrompt: aiDetails?.positivePrompt || null,
      negativePrompt: aiDetails?.negativePrompt || null,
      generationParameters: aiDetails?.rawParameters || null,
    },
    socialSharingSafety: {
      safeForPublic,
      summary: socialSummary,
      platformRecommendations: {
        reddit: safeForPublic
          ? 'Safe: Reddit strips most EXIF, but embedded AI prompts remain accessible in raw downloads.'
          : 'Caution: Strip GPS and camera serials before uploading to Reddit.',
        twitter: safeForPublic
          ? 'Safe: Twitter re-compresses images and strips standard EXIF tags.'
          : 'Recommended: Perform 100% metadata scrub to remove C2PA or prompt leaks.',
        discord: safeForPublic
          ? 'Safe: Discord preserves original files when downloaded directly.'
          : 'High Risk on Discord: Discord passes original file binaries to users intact.',
        instagram: 'Instagram automatically strips EXIF, but canvas re-encoding is advised for full privacy.',
        portfolio: 'Scrub metadata to protect prompt IP and location details on personal portfolio sites.',
      },
    },
  };
}
