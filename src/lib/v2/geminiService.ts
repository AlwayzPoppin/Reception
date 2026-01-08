
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Email, AIClassification, MaintenanceAction, Category, CustomCategory, SignatureStyle, ToneType } from "../../types/v2/types";

// Cache the AI instance to avoid repeated initialization attempts
let cachedAi: GoogleGenAI | null = null;
let aiInitAttempted = false;

const getAi = (): GoogleGenAI | null => {
  // Only attempt initialization once
  if (aiInitAttempted) return cachedAi;
  aiInitAttempted = true;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    return null;
  }
  try {
    cachedAi = new GoogleGenAI({ apiKey });
    return cachedAi;
  } catch (e) {
    // Silently fail - this is expected if the key is invalid
    return null;
  }
};

const getModel = (modelName: string = "gemini-1.5-flash") => {
  const ai = getAi();
  return ai ? ai.getGenerativeModel({ model: modelName }) : null;
};

export const generateDraftImage = async (prompt: string): Promise<string> => {
  const model = getModel('gemini-2.0-flash');
  if (!model) throw new Error("Google AI API Key missing. Please add NEXT_PUBLIC_GOOGLE_AI_API_KEY to .env.local");
  const response = await model.generateContent({
    contents: {
      parts: [
        { text: `A professional, clean, minimalistic high-end corporate illustration or 3D render representing: ${prompt}. Cinematic lighting, studio background, soft colors.` },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate image");
};

export const generateSmartReplies = async (emailBody: string): Promise<string[]> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return ["No AI Key", "Check Env", "Update Key"];
  const response = await model.generateContent({
    contents: [{
      role: "user", parts: [{
        text: `Based on this email, provide 3 short (under 5 words each) professional smart reply options.
    Email: "${emailBody}"`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text.trim());
};

export const classifyEmail = async (
  email: { subject: string; body: string; sender: string },
  customCategories: CustomCategory[] = []
): Promise<AIClassification> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) throw new Error("Gemini AI API Key missing.");
  const customContext = customCategories.length > 0
    ? `Also, check if the email fits into any of these custom user categories:
       ${customCategories.map(c => `- ${c.name} (ID: ${c.id}): ${c.description}`).join('\n')}
       If it fits a custom category, provide its ID in 'userCategoryId'.`
    : "";

  const response = await model.generateContent({
    contents: [{
      role: "user", parts: [{
        text: `Analyze the following email and categorize it.
      Determine if it is 'isPriority' (High importance/needs immediate attention).
      Identify the 'detectedLanguage'.
      Sender: ${email.sender}
      Subject: ${email.subject}
      Body: ${email.body}
      ${customContext}`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          userCategoryId: { type: Type.STRING },
          summary: { type: Type.STRING },
          sentiment: { type: Type.STRING },
          detectedLanguage: { type: Type.STRING },
          isSpam: { type: Type.BOOLEAN },
          isPriority: { type: Type.BOOLEAN },
          suspiciousReason: { type: Type.STRING },
          isMailingList: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER },
        },
        required: ["category", "summary", "sentiment", "isSpam", "isMailingList", "confidence", "isPriority"],
      },
    },
  });

  return JSON.parse(response.text.trim());
};

export const translateText = async (text: string, targetLanguage: string = "English"): Promise<string> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return text;
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Translate the following email content into ${targetLanguage}. Maintain the formatting and tone: \n\n${text}` }] }],
  });
  return response.response.text();
};

export const refineTone = async (text: string, tone: ToneType): Promise<string> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return text;
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Rewrite the following email draft to be more ${tone.toLowerCase()}. Draft: "${text}"` }] }],
  });
  return response.response.text();
};

export const researchAndDraft = async (topic: string): Promise<string> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return `Draft for ${topic}: AI research unavailable.`;
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Research "${topic}" and write a professional draft.` }] }],
    // config: { tools: [{ googleSearch: {} }] } // Removed tools for simplicity/compatibility for now
  });
  return response.response.text();
};

export const extractTasks = async (body: string): Promise<string[]> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return [];
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Extract actionable tasks from: ${body}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.response.text().trim());
};

export const getMapsContext = async (text: string): Promise<string> => {
  const model = getModel("gemini-1.5-flash"); // Maps tool usually needs specific model, but let's be safe
  if (!model) return "Location research unavailable.";
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Find the location status for: ${text}` }] }],
    // config: { tools: [{ googleMaps: {} }] } // Only if available for this model/tier
  });
  return response.response.text();
};

export const summarizeEmailLong = async (body: string): Promise<string> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return body.substring(0, 100) + "...";
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Summarize this email in bullet points: \n\n${body}` }] }],
  });
  return response.response.text();
};

export const generateSpeech = async (text: string): Promise<string> => {
  const model = getAi(); // TTS might need different handling in some SDK versions
  if (!model) return "";
  // Note: Standard Gemini SDK doesn't always support direct TTS modulo. 
  // For now return empty to avoid crashes if SDK doesn't support .models
  return "";
};

export const performMaintenanceAudit = async (emails: Email[]): Promise<MaintenanceAction[]> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return [];
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Audit these emails for cleanup: ${JSON.stringify(emails.map(e => ({ id: e.id, subject: e.subject })))}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            impact: { type: Type.STRING },
            actionLabel: { type: Type.STRING },
            emailIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "title", "description", "impact", "actionLabel", "emailIds"]
        }
      }
    }
  });
  return JSON.parse(response.response.text().trim());
};

export const generateSignatures = async (profile: { name: string; role: string; company: string; extra?: string }): Promise<{ style: SignatureStyle; text: string }[]> => {
  const model = getModel("gemini-1.5-flash");
  if (!model) return [];
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Generate signatures for ${profile.name} at ${profile.company}` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { style: { type: Type.STRING }, text: { type: Type.STRING } },
          required: ["style", "text"]
        }
      }
    }
  });
  return JSON.parse(response.response.text().trim());
};
