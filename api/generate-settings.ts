
import { GoogleGenAI, Type } from "@google/genai";

// This function is designed to be deployed as a serverless function (e.g., on Vercel, Netlify).
// It creates a secure backend endpoint at `/api/generate-settings`.
// It expects a POST request with a JSON body: { "prompt": "your sound description" }

const audioSettingsSchema = {
    type: Type.OBJECT,
    properties: {
        bassGain: { type: Type.NUMBER, description: 'Gain for low frequencies. Range: -20 to 20 dB.' },
        midGain: { type: Type.NUMBER, description: 'Gain for mid-range frequencies. Range: -20 to 20 dB.' },
        trebleGain: { type: Type.NUMBER, description: 'Gain for high frequencies. Range: -20 to 20 dB.' },
        compressorThreshold: { type: Type.NUMBER, description: 'Compressor threshold. Range: -60 to 0 dB.' },
        compressorRatio: { type: Type.NUMBER, description: 'Compressor ratio. Range: 1 to 20.' },
        reverb: { type: Type.NUMBER, description: 'Amount of reverb (wet/dry mix). Range: 0 (dry) to 1 (fully wet).' },
        noiseGateThreshold: { type: Type.NUMBER, description: 'Noise gate threshold. Range: -100 to 0 dB.' },
        deesserFrequency: { type: Type.NUMBER, description: 'Center frequency for the de-esser. Range: 2000 to 12000 Hz.' },
        deesserCut: { type: Type.NUMBER, description: 'Gain reduction for the de-esser. Range: -40 to 0 dB.' },
        saturation: { type: Type.NUMBER, description: 'Amount of harmonic saturation/excitement. Range: 0 to 1.' },
        stereoWidth: { type: Type.NUMBER, description: 'Amount of stereo widening. Range: 0 (mono) to 1 (wide).' },
    },
};


// Consolidate instructions into a single, robust prompt for the model
const createFullPrompt = (userPrompt: string) => `You are an expert audio engineer AI. Your task is to generate a JSON object of audio effect settings based on the following desired vocal sound: "${userPrompt}".

You must adhere strictly to the provided JSON schema and the valid range for each parameter.

- bassGain, midGain, trebleGain: Range from -20 to 20.
- compressorThreshold: Range from -60 to 0.
- compressorRatio: Range from 1 to 20.
- reverb: Range from 0 to 1. A little goes a long way; typical values are 0.1-0.3.
- noiseGateThreshold: Range from -100 to 0. A typical value is around -70.
- deesserFrequency: Range from 2000 to 12000. Common values are between 6000-9000Hz.
- deesserCut: Range from -40 to 0.
- saturation: Range from 0 to 1. Use subtly for warmth.
- stereoWidth: Range from 0 to 1. 0 is mono, 1 is very wide.

Generate a complete JSON object that includes all specified properties based on the request: "${userPrompt}".`;


// This is a platform-agnostic handler that works with most modern serverless environments (Vercel, Netlify, etc.)
// that use the Web Standard Request and Response objects.
export default async function handler(req: Request): Promise<Response> {
    // 1. Check for POST method and ensure API key is configured on the server
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
        });
    }

    if (!process.env.API_KEY) {
        console.error('API_KEY environment variable not set.');
        return new Response(JSON.stringify({ error: 'API key not configured on server. Deployment is missing the API_KEY environment variable.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 2. Parse the prompt from the request body
        const { prompt } = await req.json();
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'A valid prompt is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const fullPrompt = createFullPrompt(prompt);

        // 3. Initialize the Gemini client and generate content
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt, // Use the new, consolidated prompt
            config: {
                responseMimeType: "application/json",
                responseSchema: audioSettingsSchema,
                temperature: 0.5,
            },
        });
        
        const jsonText = response.text;
        
        // 4. Return the generated JSON settings to the frontend
        return new Response(jsonText, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in generate-settings API:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred on the server.";
        
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// This config is specific to Vercel to ensure the function is run on the edge for speed.
// It can be omitted for other platforms.
export const config = {
  runtime: 'edge',
};
