import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Privacy & Metadata Audit Route
app.post("/api/privacy-audit", async (req, res) => {
  try {
    const { imageBase64, mimeType, clientMetadata, fileName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const promptText = `You are a world-class Cybersecurity, Digital Forensics, and AI Image Metadata Specialist.
Analyze the provided image and its extracted raw metadata tags.

File Name: ${fileName || "Unknown"}
Extracted Metadata Tags: ${JSON.stringify(clientMetadata || [], null, 2)}

Perform a thorough forensic audit and return a structured JSON evaluation matching this exact schema:
1. "privacyScore": number (0 to 100, where 100 means extreme privacy risk due to exact GPS, serial numbers, personal prompts, or identifying data; 0 means totally anonymous/safe).
2. "riskLevel": string ("Low", "Medium", "High", "Critical").
3. "aiDetectionResult":
   - "isAiGenerated": boolean
   - "confidence": number (0 to 100)
   - "detectedEngine": string (e.g., "Midjourney v6", "Stable Diffusion WebUI", "Flux.1", "DALL-E 3", "ComfyUI", "Photographic / Human Created", etc.)
   - "visualReasoning": string explaining key visual clues or metadata flags.
4. "privacyFindings": array of objects { "category": string, "severity": "low"|"medium"|"high"|"critical", "description": string, "recommendation": string }
5. "reconstructedPromptInfo":
   - "positivePrompt": string or null
   - "negativePrompt": string or null
   - "generationParameters": string or null
6. "socialSharingSafety":
   - "safeForPublic": boolean
   - "summary": string
   - "platformRecommendations": object with strings for "reddit", "twitter", "discord", "instagram", "portfolio"

Return ONLY raw JSON, no markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: imageBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            privacyScore: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING },
            aiDetectionResult: {
              type: Type.OBJECT,
              properties: {
                isAiGenerated: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER },
                detectedEngine: { type: Type.STRING },
                visualReasoning: { type: Type.STRING },
              },
              required: ["isAiGenerated", "confidence", "detectedEngine", "visualReasoning"],
            },
            privacyFindings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["category", "severity", "description", "recommendation"],
              },
            },
            reconstructedPromptInfo: {
              type: Type.OBJECT,
              properties: {
                positivePrompt: { type: Type.STRING },
                negativePrompt: { type: Type.STRING },
                generationParameters: { type: Type.STRING },
              },
            },
            socialSharingSafety: {
              type: Type.OBJECT,
              properties: {
                safeForPublic: { type: Type.BOOLEAN },
                summary: { type: Type.STRING },
                platformRecommendations: {
                  type: Type.OBJECT,
                  properties: {
                    reddit: { type: Type.STRING },
                    twitter: { type: Type.STRING },
                    discord: { type: Type.STRING },
                    instagram: { type: Type.STRING },
                    portfolio: { type: Type.STRING },
                  },
                },
              },
              required: ["safeForPublic", "summary"],
            },
          },
          required: ["privacyScore", "riskLevel", "aiDetectionResult", "privacyFindings", "socialSharingSafety"],
        },
      },
    });

    const resultText = response.text || "{}";
    const auditData = JSON.parse(resultText);
    res.json({ success: true, audit: auditData });
  } catch (err: any) {
    console.error("Error in /api/privacy-audit:", err);
    res.status(500).json({ error: err.message || "Failed to analyze image privacy" });
  }
});

// Prompt & Workflow Parameter Unpacker API
app.post("/api/unpack-parameters", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "Raw text is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are an expert AI prompt engineer. Parse the following raw AI metadata or parameter string into clean structured elements.

Raw Input:
${rawText}

Return a structured JSON with:
1. "prompt": main positive text prompt
2. "negativePrompt": negative prompt if present, or null
3. "model": model name or checkpoint hash
4. "seed": string or number
5. "steps": number or null
6. "cfgScale": number or null
7. "sampler": sampler name or null
8. "dimensions": e.g. "1024x1024" or null
9. "loras": array of string loras
10. "extraFlags": object with key-values for other params (e.g. Denoising, Hires fix, Clip skip)`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to unpack parameters" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
