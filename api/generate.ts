import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { finalPrompt, uploadedImage, aspectRatio } = req.body;

    try {
        let response;
        if (uploadedImage) {
            const base64Data = uploadedImage.split(',')[1];
            const mimeType = uploadedImage.split(';')[0].split(':')[1];

            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: finalPrompt || "Describe this image" },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ],
                },
            });
        } else {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: finalPrompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: aspectRatio,
                    }
                }
            });
        }

        let imageUrl = '';
        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }

        if (imageUrl) {
            return res.status(200).json({ imageUrl });
        } else {
            return res.status(500).json({ error: "No image data found." });
        }
    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message || "Something went wrong" });
    }
}
