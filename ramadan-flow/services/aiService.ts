import { GoogleGenAI, Type } from "@google/genai";
import { DuaResult, VideoResult, SpiritInsight, Recipe } from '../types';

import axios from 'axios';

// NEW: Session management
const SESSION_STORAGE_KEY = 'hafiz_session_id';

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://127.0.0.1:8000 ';


function getSessionId(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

function setSessionId(sessionId: string) {
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export const aiService = {
  // Unified chat endpoint handles routing to Dua, Chat, or Video
  chatWithHafiz: async (message: string): Promise<any> => {
    try {
      // NEW: Include session_id for memory
      const sessionId = getSessionId();


      const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://127.0.0.1:8000';

        const response = await axios.post(`${AI_BASE_URL}/chat/`, { 
            message,
            session_id: sessionId
    });
      
      // NEW: Store session_id from response
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }

      return response.data;
    } catch (error) {
      console.error("AI Backend Error:", error);
      return {
        response: "I apologize, but I am currently unavailable. Please check your connection.",
        type: "text"
      };
    }
  },

  // NEW: Clear conversation history
  clearConversation: async (): Promise<void> => {
    const sessionId = getSessionId();
    if (sessionId) {
      try {
        await axios.delete(`${AI_BASE_URL}/chat/session/${sessionId}`);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing conversation:', error);
      }
    }
  },

  // NEW: Get conversation history
  getConversationHistory: async (): Promise<any> => {
    const sessionId = getSessionId();
    if (!sessionId) return { messages: [] };
    try {
      const response = await axios.get(`${AI_BASE_URL}/chat/session/${sessionId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      return { messages: [] };
    }
  },

  // Legacy wrappers for compatibility if needed, but 'chatWithHafiz' is now the main entry
  findDua: async (query: string): Promise<DuaResult> => {
    const res = await aiService.chatWithHafiz(query);
    if (res.type === 'dua_card') return res.metadata as DuaResult;
    throw new Error("Backend did not return a Dua result");
  },

  findVideos: async (query: string): Promise<VideoResult[]> => {
    const res = await aiService.chatWithHafiz(query);
    if (res.type === 'video_card') return res.metadata as VideoResult[];
    return [];
  },

  generateRecipe: async (ingredients: string): Promise<Recipe | null> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Create a healthy, nutritious, and simple recipe for Suhoor or Iftar using these ingredients: ${ingredients}.
                   The recipe should be suitable for fasting (hydrating, slow-release energy).
                   Return a JSON with title, description (max 2 sentences), tags (e.g. "High Protein", "Sunnah"), and prepTime.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              prepTime: { type: Type.STRING },
            },
            required: ['title', 'description', 'tags', 'prepTime']
          }
        }
      });
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text) as Recipe;
    } catch (error) {
      console.error("AI Error:", error);
      return null;
    }
  },

  getSpiritInsight: async (mood: string): Promise<SpiritInsight> => {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `The user is feeling "${mood}". Provide spiritual counseling.
                   1. Wisdom: A short, profound quote or concept from Islamic tradition relevant to this mood.
                   2. Dua: A specific short Dua (Arabic, Transliteration, Translation) to recite.
                   3. Action: A very small, actionable good deed (Sunnah) they can do right now.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mood: { type: Type.STRING },
              wisdom: { type: Type.STRING },
              action: { type: Type.STRING },
              dua: {
                type: Type.OBJECT,
                properties: {
                  arabic: { type: Type.STRING },
                  transliteration: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  source: { type: Type.STRING },
                  context: { type: Type.STRING },
                },
                required: ['arabic', 'transliteration', 'translation', 'source', 'context']
              }
            },
            required: ['mood', 'wisdom', 'action', 'dua']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No data");
      return JSON.parse(text) as SpiritInsight;
    } catch (error) {
      return {
        mood: mood,
        dua: {
          arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
          transliteration: "La yukallifullahu nafsan illa wus'aha",
          translation: "Allah does not burden a soul beyond that it can bear.",
          source: "Quran 2:286",
          context: "Remembrance for patience."
        },
        wisdom: "This feeling is temporary, but Allah's mercy is permanent.",
        action: "Take a deep breath and say Alhamdulillah for what remains."
      };
    }
  }
};