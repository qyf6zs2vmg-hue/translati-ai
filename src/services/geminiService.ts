import Tesseract from 'tesseract.js';
import { TranslationResult, Tone } from "../types";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async processText(text: string, action: 'simplify' | 'explain' | 'summarize' | 'rephrase' | 'translateSimplify', targetLang?: string): Promise<string> {
    if (!text.trim()) return "";

    const prompts = {
      simplify: "Rewrite the following text in very simple language that is easy to understand for everyone. Keep the core meaning but use basic vocabulary and shorter sentences.",
      explain: "Explain the meaning of the following text as if you were talking to a complete beginner. Use simple words and provide a short real-life example if possible to illustrate the concept.",
      summarize: "Provide a concise summary of the following text. Capture only the key meaning and essential points, removing any unnecessary detail.",
      rephrase: "Rephrase the following text using different wording but maintaining the exact same meaning and tone.",
      translateSimplify: `Translate the following text into ${targetLang || 'the target language'} and simplify it at the same time. The result should be easy to understand for a non-native speaker or a beginner.`
    };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${prompts[action]}\n\nText: "${text}"`,
      });

      return response.text || "Не удалось обработать текст.";
    } catch (error) {
      console.error(`Gemini process error (${action}):`, error);
      return "Ошибка: ИИ-помощник временно недоступен. Пожалуйста, попробуйте позже.";
    }
  },

  async translate(
    text: string,
    from: string,
    to: string,
    tone: Tone = 'casual'
  ): Promise<TranslationResult> {
    if (!text.trim()) return { translation: "" };

    const sl = from === 'Auto' ? 'auto' : from;
    const tl = to;

    try {
      // Use the more comprehensive Google Translate endpoint
      // dt=t (translation), dt=at (alternatives), dt=bd (dictionary), dt=ex (examples), dt=md (definitions), dt=ss (synonyms)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=at&dt=bd&dt=ex&dt=md&dt=ss&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data || !data[0]) throw new Error("Invalid response from translation engine");

      // 1. Extract Primary Translation
      const translation = data[0].map((x: any) => x[0]).join("");
      
      // 2. Extract Alternatives
      let alternatives: string[] = [];
      if (data[1] && Array.isArray(data[1])) {
        alternatives = data[1].map((x: any) => x[0]).filter((t: string) => t.toLowerCase() !== translation.toLowerCase());
      }

      // 3. Extract Dictionary Info (Definitions, Synonyms, Examples)
      let dictionary: any[] = [];
      
      // Definitions and Parts of Speech (data[12])
      if (data[12] && Array.isArray(data[12])) {
        data[12].forEach((entry: any) => {
          const partOfSpeech = entry[0];
          entry[1].forEach((def: any) => {
            dictionary.push({
              word: text,
              meaning: def[0],
              partOfSpeech: partOfSpeech,
              examples: def[2] ? [def[2]] : []
            });
          });
        });
      }

      // Synonyms (data[11])
      if (data[11] && Array.isArray(data[11])) {
        data[11].forEach((synGroup: any) => {
          const partOfSpeech = synGroup[0];
          const synonyms = synGroup[1].flatMap((s: any) => s[0]).slice(0, 5);
          if (synonyms.length > 0) {
            dictionary.push({
              word: text,
              meaning: `Синонимы: ${synonyms.join(', ')}`,
              partOfSpeech: `${partOfSpeech} (синонимы)`,
              examples: []
            });
          }
        });
      }

      // Examples (data[13])
      if (data[13] && Array.isArray(data[13][0])) {
        const examples = data[13][0].map((ex: any) => ex[0].replace(/<\/?[^>]+(>|$)/g, "")).slice(0, 3);
        if (examples.length > 0) {
          dictionary.push({
            word: text,
            meaning: "Примеры использования",
            partOfSpeech: "контекст",
            examples: examples
          });
        }
      }

      return {
        translation,
        detectedLanguage: data[2] || from,
        alternatives: alternatives.filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
        dictionary: dictionary.slice(0, 6),
        contextNote: `Переведено с помощью Lingua Pro Engine (режим: ${tone})`
      };

    } catch (error) {
      console.error("Translation engine failed:", error);
      
      // Last resort fallback to MyMemory if Google fails
      try {
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}`;
        const response = await fetch(myMemoryUrl);
        const data = await response.json();
        return {
          translation: data.responseData.translatedText || text,
          detectedLanguage: from,
          alternatives: [],
          dictionary: [],
          contextNote: "Переведено с помощью Lingua Basic Engine (резервный)"
        };
      } catch (e) {
        return {
          translation: text,
          detectedLanguage: from,
          alternatives: [],
          dictionary: [],
          contextNote: "Ошибка перевода. Показан исходный текст."
        };
      }
    }
  },

  async ocrAndTranslate(imageData: string, targetLang: string): Promise<{ original: string; translated: string }> {
    try {
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng+rus+uzb');
      
      const translationRes = await this.translate(text, 'Auto', targetLang);
      
      return {
        original: text,
        translated: translationRes.translation
      };
    } catch (error) {
      console.error("OCR error:", error);
      return {
        original: "Ошибка извлечения текста",
        translated: "Ошибка перевода текста"
      };
    }
  },

  async generateFlashcards(text: string, targetLang: string): Promise<any[]> {
    // Simple rule-based flashcard generation since we don't have an LLM
    const words = text.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
    const cards = [];

    for (const word of words) {
      try {
        const res = await this.translate(word, 'Auto', targetLang);
        cards.push({
          front: word,
          back: res.translation,
          example: `Использование ${word}`
        });
      } catch (e) {
        console.error("Flashcard word translation error:", e);
      }
    }

    return cards;
  }
};
