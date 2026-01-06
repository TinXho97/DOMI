
import { GoogleGenAI } from "@google/genai";

export const getSmartAssistantStream = async (prompt: string, context: string) => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Eres DOMI-AI, un asistente inteligente para una super-app urbana.
        Contexto actual del usuario: ${context}.
        Ayuda al usuario a decidir qué comer, cómo viajar o qué servicios usar en su ciudad.
        Sé breve, amigable y usa emojis. Solo responde en español.`,
        temperature: 0.7,
      },
    });
    return responseStream;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
