import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowRightLeft, 
  Volume2, 
  Copy, 
  Share2, 
  Sparkles, 
  Info, 
  Book, 
  ListRestart,
  Mic,
  MicOff,
  Loader2,
  Check,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '@/src/services/geminiService';
import { Language, TranslationResult, HistoryItem, Tone } from '@/src/types';
import { toast } from 'sonner';
import { cn, generateId } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const LANGUAGES: Language[] = [
  { code: 'Auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'tr', name: 'Turkish' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

interface TranslatorProps {
  onTranslate: (item: HistoryItem) => void;
}

export function Translator({ onTranslate }: TranslatorProps) {
  const [inputText, setInputText] = useState('');
  const [fromLang, setFromLang] = useState(() => localStorage.getItem('lingua_from') || 'Auto');
  const [toLang, setToLang] = useState(() => localStorage.getItem('lingua_to') || 'uz');
  const [tone, setTone] = useState<Tone>('casual');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('lingua_from', fromLang);
    localStorage.setItem('lingua_to', toLang);
  }, [fromLang, toLang]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleTranslate = useCallback(async (text: string = inputText) => {
    if (!text.trim()) {
      setResult(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await geminiService.translate(text, fromLang, toLang, tone);
      setResult(res);
      
      onTranslate({
        id: generateId('trans'),
        from: fromLang === 'Auto' ? res.detectedLanguage || 'Auto' : fromLang,
        to: toLang,
        originalText: text,
        translatedText: res.translation,
        timestamp: Date.now(),
        isFavorite: false,
      });
    } catch (error) {
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, fromLang, toLang, tone, onTranslate]);

  useEffect(() => {
    if (autoTranslate && inputText.trim()) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        handleTranslate(inputText);
      }, 800);
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [inputText, fromLang, toLang, tone, autoTranslate, handleTranslate]);

  const handleSwap = () => {
    if (fromLang === 'Auto') return;
    const oldFrom = fromLang;
    const oldTo = toLang;
    setFromLang(oldTo);
    setToLang(oldFrom);
    setInputText(result?.translation || '');
    setResult(null);
  };

  const handleCopy = () => {
    if (!result?.translation) return;
    navigator.clipboard.writeText(result.translation);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-2xl md:rounded-3xl">
        <CardContent className="p-0">
          <div className="flex flex-col md:grid md:grid-cols-2 h-auto md:h-[500px]">
            {/* Input Section */}
            <div className="p-3 md:p-6 space-y-2 md:space-y-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col min-h-[180px] md:min-h-0">
              <div className="flex items-center justify-between">
                <Select value={fromLang} onValueChange={setFromLang}>
                  <SelectTrigger className="w-[120px] md:w-[180px] border-none bg-slate-50 dark:bg-slate-800 font-medium rounded-xl h-8 md:h-10 text-xs md:text-sm">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger 
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }), 
                        "rounded-full h-7 w-7 md:h-10 md:w-10",
                        autoTranslate ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400'
                      )}
                      onClick={() => setAutoTranslate(!autoTranslate)}
                    >
                      <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </TooltipTrigger>
                    <TooltipContent>Auto-translate as you type</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger 
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }), 
                        "rounded-full h-8 w-8 md:h-12 md:w-12",
                        isListening ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse ring-2 ring-red-500' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      )}
                      onClick={toggleListening}
                    >
                      {isListening ? <MicOff className="w-4 h-4 md:w-6 md:h-6" /> : <Mic className="w-4 h-4 md:w-6 md:h-6" />}
                    </TooltipTrigger>
                    <TooltipContent>{isListening ? 'Stop listening' : 'Voice translation'}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Textarea
                placeholder="Enter text to translate..."
                className="flex-1 min-h-[80px] md:min-h-0 border-none bg-transparent text-sm md:text-lg resize-none focus-visible:ring-0 p-0 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] md:text-xs text-slate-400">{inputText.length} / 5000</span>
                {!autoTranslate && (
                  <Button 
                    onClick={() => handleTranslate()} 
                    disabled={isLoading || !inputText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 md:px-6 h-8 md:h-10 shadow-lg shadow-blue-500/20 text-xs"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Translate
                  </Button>
                )}
              </div>
            </div>

            {/* Output Section */}
            <div className="p-3 md:p-6 space-y-2 md:space-y-4 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col min-h-[180px] md:min-h-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 md:gap-2">
                  <Select value={toLang} onValueChange={setToLang}>
                    <SelectTrigger className="w-[120px] md:w-[180px] border-none bg-white dark:bg-slate-800 font-medium rounded-xl shadow-sm h-8 md:h-10 text-xs md:text-sm">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.filter(l => l.code !== 'Auto').map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="ghost" size="icon" onClick={handleSwap} disabled={fromLang === 'Auto'} className="rounded-full h-7 w-7 md:h-10 md:w-10">
                    <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Button>
                </div>

                <Select value={tone} onValueChange={(v: Tone) => setTone(v)}>
                  <SelectTrigger className="w-[80px] md:w-[120px] border-none bg-white dark:bg-slate-800 text-[9px] md:text-xs rounded-xl shadow-sm h-7 md:h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="slang">Slang</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-h-[80px] md:min-h-0 text-sm md:text-lg font-medium overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-xs animate-pulse">Translating...</p>
                  </div>
                ) : result ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 md:space-y-4"
                  >
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {result.translation}
                    </p>
                    
                    {result.contextNote && (
                      <div className="flex items-start gap-1 p-1.5 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <Info className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[9px] md:text-xs text-blue-700 dark:text-blue-300 italic">
                          {result.contextNote}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <p className="text-slate-300 dark:text-slate-600 italic text-xs md:text-base">Translation will appear here...</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 md:gap-2 pt-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleSpeak(result?.translation || '', toLang)}
                  disabled={!result}
                  className="rounded-full h-7 w-7 md:h-10 md:w-10"
                >
                  <Volume2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCopy}
                  disabled={!result}
                  className="rounded-full h-7 w-7 md:h-10 md:w-10"
                >
                  {copied ? <Check className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-500" /> : <Copy className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                </Button>
                <Button variant="ghost" size="icon" disabled={!result} className="rounded-full h-7 w-7 md:h-10 md:w-10">
                  <Share2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Features Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            key={`result-features-${result.translation.substring(0, 20)}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Dictionary */}
            {result.dictionary && result.dictionary.length > 0 && (
              <Card className="border-none shadow-lg rounded-3xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Book className="w-5 h-5" />
                    <h3 className="font-bold">Dictionary</h3>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {result.dictionary.map((item, i) => {
                      const dictId = `dict-${i}-${item.word}`;
                      return (
                        <div key={dictId} className="space-y-2 group">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg group-hover:text-blue-600 transition-colors">{item.word}</span>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{item.partOfSpeech}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.meaning}</p>
                          <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                            {item.examples.map((ex, j) => (
                              <p key={`${dictId}-ex-${j}`} className="text-xs text-slate-400 italic">"{ex}"</p>
                            ))}
                          </div>
                          {i < result.dictionary.length - 1 && <Separator className="my-4" />}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <Card className="border-none shadow-lg rounded-3xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-purple-600">
                    <ListRestart className="w-5 h-5" />
                    <h3 className="font-bold">Alternatives</h3>
                  </div>
                  <div className="space-y-3">
                    {result.alternatives.map((alt, i) => (
                      <div 
                        key={`alt-${i}-${alt.substring(0, 10)}`} 
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                        onClick={() => {
                          setResult({ ...result, translation: alt });
                          toast.info('Translation updated with alternative');
                        }}
                      >
                        <p className="text-sm text-slate-700 dark:text-slate-300">{alt}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
