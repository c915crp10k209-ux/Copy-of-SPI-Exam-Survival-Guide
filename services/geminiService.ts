
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { NumerologyData } from "./numerology";
import { getCachedGenData, setCachedGenData } from "./storageService";

const MODEL_NAME = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';
// Updated to the correct model name per coding guidelines
export const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Initialize AI
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const decryptIdentity = async (name: string, dob: string, time: string, numerology: NumerologyData): Promise<any> => {
  const ai = getAI();
  const prompt = `Act as RAV_OS Core. Decrypt the vibrational signature for:
  Name: ${name}
  DOB: ${dob}
  Time: ${time}
  
  Vibrational Coordinates:
  - Life Path: ${numerology.lifePath}
  - Expression: ${numerology.expression}
  - Soul Urge: ${numerology.soulUrge}
  - Special Attribute: ${numerology.isWealth ? 'High-Frequency Wealth Potential' : 'Standard Alignment'}
  
  Provide a tactical performance profile including:
  - User Type (e.g. Architect, Catalyst, Investigator - choose based on numerology archetype)
  - Core Strategy (How to win in high-stakes environments)
  - Decision Authority (Logic source, e.g., Instinct, Analysis, Empathy)
  - 3 Key Strengths as "System Assets"
  - 1 Primary Hazard as "System Vulnerability"
  - A short signature phrase summarizing their essence.
  
  Format as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            strategy: { type: Type.STRING },
            authority: { type: Type.STRING },
            assets: { type: Type.ARRAY, items: { type: Type.STRING } },
            vulnerability: { type: Type.STRING },
            signature: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const getTacticalDirective = async (profile: any): Promise<string> => {
  const cacheKey = `directive_${profile.type}`;
  const cached = await getCachedGenData(cacheKey);
  if (cached) return cached;

  const ai = getAI();
  const prompt = `As RAV_OS Advisor, providing a "Quick Win" directive for a ${profile.type}. 
  Current System Cycle: Strike Phase. 
  Tone: Tactical, high-stakes, elite. 60 words max.`;
  
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt
  });
  
  const result = response.text || "Execute primary directive. Maintain silence.";
  await setCachedGenData(cacheKey, result);
  return result;
};

export const analyzeSimState = async (visualId: string, state: any): Promise<string> => {
  const ai = getAI();
  const prompt = `Act as VECTRON, Tactical Physics AI.
  Analyze the following Ultrasound Simulation parameters for the visual module "${visualId}":
  - Frequency: ${state.frequency}
  - Amplitude: ${state.amplitude}
  - Target Depth: ${state.targetDepth}
  - Damping: ${state.damping}
  - Velocity: ${state.velocity}
  
  Provide a sharp, high-energy arcade-style "Tactical Analysis" (max 80 words).
  What is the clinical trade-off the operator has created? (e.g., high res vs low penetration).
  Warn of any "Physics Anomalies" like aliasing or bioeffects if parameters are extreme.
  Tone: Intense, clinical, futuristic.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt
    });
    return response.text || "Analysis link dropped. Maintain manual calibration.";
  } catch (e) {
    return "Error: Neural link corrupted during analysis.";
  }
};

export const chatWithTutor = async (topic: string, message: string, history: any[] = []): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [
      { role: 'user', parts: [{ text: `You are VECTRON, an elite AI tutor for ultrasound physics. Topic: ${topic}. Maintain a tactical, high-energy arcade persona.` }] },
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ]
  });
  return response.text || "Core link unstable. Re-transmitting...";
};

export const getMnemonics = async (topic: string, concept?: string): Promise<string> => {
  const ai = getAI();
  const target = concept ? `${concept} within ${topic}` : topic;
  const prompt = `Act as VECTRON. Generate a high-fidelity "Tactical Mnemonic Powerup" for the concept: ${target}.
  
  Format the response as a punchy, arcade-style data packet with:
  1. POWERUP_NAME: (A cool name for the mnemonic)
  2. CODE_PHRASE: (The actual mnemonic)
  3. LOGIC_KEY: (1-sentence explanation of why it works)
  
  Persona: Intense, elite sonographer. Max 60 words total.`;
  
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt
  });
  
  return response.text || "Powerup link failure. Manual study required.";
};

export const getDailyInsight = async (): Promise<string> => {
  const dateKey = `insight_${new Date().toDateString()}`;
  const cached = await getCachedGenData(dateKey);
  if (cached) return cached;

  const ai = getAI();
  const prompt = `Generate a 1-sentence tactical daily insight for an elite sonographer. Tone: Futuristic, sharp, inspiring.`;
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt
  });
  
  const result = response.text || "Stay calibrated.";
  await setCachedGenData(dateKey, result);
  return result;
};

export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const getHarveyScript = async (title: string, content: string): Promise<string> => {
    return `Say with high-intensity arcade energy: ${title}. ${content}`;
};

export const getHarveyModuleIntro = async (id: string, description: string): Promise<string> => {
    return `Greetings Operator. Syncing with Sector ${id}. ${description}. Prepare for tactical immersion.`;
};

export const generateQuizQuestions = async (topic: string, count: number): Promise<any[]> => {
  const cacheKey = `quiz_${topic}_v2`; // Bumped version for new schema
  const cached = await getCachedGenData(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed.length >= count) return parsed.slice(0, count);
  }

  const ai = getAI();
  const prompt = `Generate ${count} high-quality ARDMS SPI exam level multiple choice questions for topic: ${topic}. 
  CRITICAL: You must assign each question one of the following 5 Official Domains as a "domain" property: 
  "Clinical Safety", "Physical Principles", "Transducers", "Instrumentation", "Doppler & Hemodynamics".
  Return as a JSON array of objects with fields: question, options (array of 4), correctAnswerIndex (0-3), explanation, and domain.`;
  
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              domain: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctAnswerIndex', 'explanation', 'domain']
          }
        }
      }
    });
    const questions = JSON.parse(response.text || '[]');
    if (questions.length > 0) {
      await setCachedGenData(cacheKey, JSON.stringify(questions));
    }
    return questions;
  } catch (e) {
    return [];
  }
};
