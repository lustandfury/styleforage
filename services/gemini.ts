// API endpoint for style advice - calls serverless function to keep API key secure
const API_ENDPOINT = '/api/style-advice';

export const getStyleAdvice = async (userQuery: string): Promise<string> => {
  // Basic input validation
  if (!userQuery.trim()) {
    return "Please ask me a style question!";
  }

  if (userQuery.length > 500) {
    return "Your question is a bit long. Could you keep it under 500 characters?";
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: userQuery }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', response.status, errorData);
      return errorData.message || "I'm having a brief wardrobe malfunction. Please try again later.";
    }

    const data = await response.json();
    return data.message || "I couldn't come up with a tip right now, but let's chat during a session!";
  } catch (error) {
    console.error("Style Advice API Error:", error);
    return "I'm having a brief wardrobe malfunction (connection error). Please try again later.";
  }
};
