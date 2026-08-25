import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, GEMINI_MODEL } from "./config/env.js";

console.log(GEMINI_API_KEY)

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: "Say hello in one sentence.",
});

console.log(response.text);