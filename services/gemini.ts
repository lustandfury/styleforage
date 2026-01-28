import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize specific model as requested
const MODEL_NAME = 'gemini-3-flash-preview';

export const getStyleAdvice = async (userQuery: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API_KEY is missing.");
    return "I'm currently offline (API Key missing), but I'd love to help you with your style in person! Please book a consultation.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userQuery,
      config: {
        systemInstruction: `You are a high-end personal fashion stylist for 'Style Forage'. 
        Your tone is encouraging, chic, sophisticated, yet accessible. 
        Keep answers concise (under 100 words) and actionable. 
        Focus on timeless style, color theory, and body positivity.`,
      }
    });

    return response.text || "I couldn't come up with a tip right now, but let's chat during a session!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a brief wardrobe malfunction (connection error). Please try again later.";
  }
};
