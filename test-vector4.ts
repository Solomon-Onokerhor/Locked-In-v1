import { GoogleGenAI } from '@google/genai';
require('dotenv').config({ path: '.env.local' });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-2',
            contents: 'Hello world',
            config: { outputDimensionality: 768 }
        });
        console.log('Success!', response.embeddings?.[0]?.values?.length);
    } catch(e: any) {
        console.error('Error:', e.message || e);
    }
}
test();
