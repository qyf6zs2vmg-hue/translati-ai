export type Language = {
  code: string;
  name: string;
  flag?: string;
};

export type TranslationResult = {
  translation: string;
  detectedLanguage?: string;
  alternatives?: string[];
  dictionary?: {
    word: string;
    meaning: string;
    partOfSpeech: string;
    examples: string[];
  }[];
  contextNote?: string;
};

export type HistoryItem = {
  id: string;
  from: string;
  to: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
  isFavorite: boolean;
};

export type Tone = 'formal' | 'casual' | 'slang' | 'professional';

export type Theme = 'light' | 'dark' | 'system';

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  example?: string;
};

export type Phrase = {
  id: string;
  category: string;
  text: string;
  translation: string;
};
