import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3-flash-preview';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Service unavailable',
        message: "I'm currently offline. Please book a consultation to get personalized style advice!",
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

    // Rate limiting: Basic check for query length
    if (query.length > 500) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query too long. Please keep it under 500 characters.' }),
      };
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
      },
    });

    const text = response.text || "I couldn't come up with a tip right now, but let's chat during a session!";

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text }),
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Service error',
        message: "I'm having a brief wardrobe malfunction. Please try again later.",
      }),
    };
  }
};

export { handler };
