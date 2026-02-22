import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Gemini API key is not configured on the server." });
        }
        const ai = new GoogleGenAI({ apiKey });

        const { prompt } = req.body;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: `Rewrite this image prompt to be more detailed, artistic, and descriptive for an AI image generator. Keep it under 40 words. Prompt: "${prompt}"` }] },
        });

        const enhancedText = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (enhancedText) {
            return res.status(200).json({ enhancedText });
        } else {
            return res.status(500).json({ error: "No enhanced text generated." });
        }
    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}
