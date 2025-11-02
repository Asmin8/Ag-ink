import { GoogleGenAI, Type } from "@google/genai";
import type { AiApp, Plan, AnalysisResult, Tone, Style, Length } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

export const generateOptimizedPrompt = async (
    app: AiApp,
    plan: Plan,
    userInput: string,
    tone: Tone,
    style: Style,
    length: Length
): Promise<string> => {
    try {
        const needsGrounding = userInput.length < 100; // Use grounding for shorter, less specific prompts

        const geminiPrompt = `
        You are AG ink, a world-class AI assistant specializing in prompt engineering.
        Your task is to refine a user's idea into a highly effective, detailed, and context-aware prompt for a specific AI model.

        AI Platform: ${app.name}
        Plan: ${plan}
        Platform Capabilities: ${app.capabilities}

        Refinement Parameters:
        - Tone: ${tone}
        - Style: ${style}
        - Desired Length: ${length}

        User's initial idea: "${userInput}"

        Instructions:
        1. Analyze the user's idea, the target AI platform's capabilities, and the refinement parameters (Tone, Style, Length).
        2. If the user's idea is vague, incomplete, or relates to recent events, use your search capabilities to find relevant, up-to-date information to enrich the prompt.
        3. Craft a new, optimized prompt that is clear, specific, and structured to elicit the best possible response from the selected AI, adhering strictly to the specified tone, style, and length.
        4. The final prompt should be ready to be copied and pasted.
        5. Your response must contain ONLY the generated prompt as plain text, with no extra formatting, explanations, or conversational text.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: geminiPrompt,
            config: {
                tools: needsGrounding ? [{ googleSearch: {} }] : [],
                temperature: 0.7,
            },
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error generating optimized prompt:", error);
        return "Sorry, an error occurred while generating the prompt. Please try again later.";
    }
};

export const analyzeImagesAndGeneratePrompt = async (images: File[]): Promise<AnalysisResult> => {
    try {
        const imageParts = await Promise.all(
            images.map(async (file) => {
                const base64Data = await fileToBase64(file);
                return {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                };
            })
        );

        const prompt = `
        You are AG ink, an expert visual analysis AI.
        Your task is to analyze a set of user-provided images and generate two things: a human-readable summary and a consolidated, descriptive prompt for another AI model.

        Instructions:
        1. Carefully examine all the provided images. Identify key objects, scenes, actions, text, colors, and overall composition.
        2. Write a concise, natural-language summary of your findings.
        3. Create a single, consolidated, and highly descriptive "ready-to-use" prompt. This prompt should effectively communicate the visual content of all images to an AI model (either text-to-image or a multimodal text model).
        4. Your response must be a single, valid JSON object with two keys: "summary" and "prompt".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: 'A concise, natural-language summary of the findings from the images.'
                        },
                        prompt: {
                            type: Type.STRING,
                            description: 'A consolidated, descriptive prompt ready for use in another AI model.'
                        }
                    },
                    required: ['summary', 'prompt'],
                },
            },
        });
        
        const resultText = response.text;
        return JSON.parse(resultText);
    } catch (error) {
        console.error("Error analyzing images:", error);
        return {
            summary: "Sorry, an error occurred while analyzing the images. Please ensure they are valid image files and try again.",
            prompt: "Analysis failed."
        };
    }
};