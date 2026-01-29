import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3-flash-preview';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ 
      error: 'Service unavailable',
      message: "I'm currently offline. Please book a consultation to get personalized style advice!"
    });
  }

  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Rate limiting: Basic check for query length
    if (query.length > 500) {
      return res.status(400).json({ error: 'Query too long. Please keep it under 500 characters.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        systemInstruction: `You are a high-end personal fashion stylist for 'Style Forage'. 
        Your tone is encouraging, chic, sophisticated, yet accessible. 
        Keep answers concise (under 100 words) and actionable. 
        Focus on timeless style, color theory, and body positivity.`,
      }
    });

    const text = response.text || "I couldn't come up with a tip right now, but let's chat during a session!";
    
    return res.status(200).json({ message: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: 'Service error',
      message: "I'm having a brief wardrobe malfunction. Please try again later."
    });
  }
}
