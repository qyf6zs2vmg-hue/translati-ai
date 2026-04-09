import Tesseract from 'tesseract.js';
import { TranslationResult, Tone } from "../types";

export const geminiService = {
  async translate(
    text: string,
    from: string,
    to: string,
    tone: Tone = 'casual'
  ): Promise<TranslationResult> {
    if (!text.trim()) return { translation: "" };

    const sl = from === 'Auto' ? 'auto' : from;
    const tl = to;

    // Try MyMemory API first
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}`;
      const response = await fetch(myMemoryUrl);
      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        return {
          translation: data.responseData.translatedText,
          detectedLanguage: from === 'Auto' ? 'Detected' : from,
          alternatives: data.matches?.map((m: any) => m.translation).filter((t: string) => t !== data.responseData.translatedText).slice(0, 3) || [],
          dictionary: [],
          contextNote: `Translated using MyMemory Engine (${tone} style applied where possible)`
        };
      }
      throw new Error("MyMemory failed");
    } catch (error) {
      console.warn("MyMemory failed, falling back to Google Translate Unofficial:", error);
      
      // Fallback to Google Translate Unofficial API
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        const translation = data[0].map((x: any) => x[0]).join("");
        return {
          translation,
          detectedLanguage: data[2] || from,
          alternatives: [],
          dictionary: [],
          contextNote: "Translated using Lingua Free Engine (Fallback)"
        };
      } catch (fallbackError) {
        console.error("All translation engines failed:", fallbackError);
        return {
          translation: text,
          detectedLanguage: from,
          alternatives: [],
          dictionary: [],
          contextNote: "Translation failed. Showing original text."
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
        original: "Error extracting text",
        translated: "Error translating text"
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
          example: `Usage of ${word}`
        });
      } catch (e) {
        console.error("Flashcard word translation error:", e);
      }
    }

    return cards;
  }
};
