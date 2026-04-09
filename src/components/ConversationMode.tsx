import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Loader2, ArrowRightLeft, Trash2, Info, FlipVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '@/src/services/geminiService';
import { toast } from 'sonner';
import { cn, generateId } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { buttonVariants } from '@/components/ui/button';

type Message = {
  id: string;
  sender: 'user1' | 'user2';
  text: string;
  translation: string;
  timestamp: number;
  fromLang: string;
  toLang: string;
};

const LANGUAGES = [
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

export function ConversationMode() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState<'user1' | 'user2' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const [lang1, setLang1] = useState('en');
  const [lang2, setLang2] = useState('ru');
  const activeSenderRef = useRef<'user1' | 'user2' | null>(null);

  const getLocale = (code: string) => {
    const locales: Record<string, string> = {
      en: 'en-US',
      ru: 'ru-RU',
      uz: 'uz-UZ',
      tr: 'tr-TR',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ar: 'ar-SA',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR'
    };
    return locales[code] || code;
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        const sender = activeSenderRef.current;
        if (sender) {
          setIsListening(null);
          activeSenderRef.current = null;
          handleNewMessage(sender, transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(null);
        activeSenderRef.current = null;
        if (event.error !== 'no-speech') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(null);
        activeSenderRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleNewMessage = async (sender: 'user1' | 'user2', text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    const from = sender === 'user1' ? lang1 : lang2;
    const to = sender === 'user1' ? lang2 : lang1;

    try {
      const res = await geminiService.translate(text, from, to);
      const newMessage: Message & { details?: any } = {
        id: generateId('msg'),
        sender,
        text,
        translation: res.translation,
        timestamp: Date.now(),
        fromLang: from,
        toLang: to,
        details: res // Store full result for details view
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Auto speak translation
      handleSpeak(res.translation, to);
    } catch (error) {
      toast.error('Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLocale(lang);
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  const startListening = (sender: 'user1' | 'user2') => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(null);
      activeSenderRef.current = null;
    } else {
      const langCode = sender === 'user1' ? lang1 : lang2;
      recognitionRef.current.lang = getLocale(langCode);
      try {
        activeSenderRef.current = sender;
        setIsListening(sender);
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech recognition start error:', e);
        setIsListening(null);
        activeSenderRef.current = null;
        // If already started, just stop it first
        try { recognitionRef.current.stop(); } catch(err) {}
      }
    }
  };

  const handleSwap = () => {
    const temp = lang1;
    setLang1(lang2);
    setLang2(temp);
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Conversation cleared');
  };

  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden h-[750px] flex flex-col relative">
      <CardHeader className="border-b bg-white dark:bg-slate-900 z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Conversation
            </CardTitle>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Real-time Translator</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger 
                onClick={() => setIsFlipped(!isFlipped)} 
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  "rounded-full", 
                  isFlipped && "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <FlipVertical className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Face-to-face mode</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger 
                onClick={clearChat} 
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  "rounded-full text-slate-400 hover:text-red-500"
                )}
              >
                <Trash2 className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>Clear conversation</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="flex-1 flex items-center justify-end gap-2">
            <Select value={lang1} onValueChange={setLang1}>
              <SelectTrigger className="w-full max-w-[140px] h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-semibold text-sm shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSwap} className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:rotate-180 transition-transform duration-500">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 flex items-center justify-start gap-2">
            <Select value={lang2} onValueChange={setLang2}>
              <SelectTrigger className="w-full max-w-[140px] h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-semibold text-sm shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50/30 dark:bg-slate-950/30">
        <ScrollArea className="flex-1 px-6 py-8">
          <div className="space-y-8">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
                  <Mic className="w-10 h-10 text-blue-500 opacity-40" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Voice Conversation</h3>
                <p className="text-sm text-slate-400 max-w-[300px]">
                  1. Select languages for both speakers.<br/>
                  2. Tap the <span className="text-blue-600 font-bold">Blue</span> or <span className="text-slate-600 dark:text-slate-300 font-bold">Grey</span> button to start speaking.<br/>
                  3. AI will automatically translate and speak back.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "flex w-full",
                    msg.sender === 'user1' ? 'justify-start' : 'justify-end',
                    isFlipped && msg.sender === 'user1' && "rotate-180"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] space-y-2",
                    msg.sender === 'user1' ? 'items-start' : 'items-end flex flex-col'
                  )}>
                    <div className={cn(
                      "p-5 rounded-[2rem] shadow-sm relative group",
                      msg.sender === 'user1' 
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700' 
                        : 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/20'
                    )}>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50",
                        msg.sender === 'user2' && "text-blue-100"
                      )}>
                        {msg.fromLang}
                      </p>
                      <p className="text-sm opacity-80 mb-3 italic leading-relaxed">{msg.text}</p>
                      <div className={cn(
                        "h-px w-full mb-3",
                        msg.sender === 'user1' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white/20'
                      )} />
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50",
                        msg.sender === 'user2' && "text-blue-100"
                      )}>
                        {msg.toLang}
                      </p>
                      <p className="font-bold text-xl leading-tight tracking-tight">{msg.translation}</p>
                      
                      <div className="flex items-center gap-1 mt-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-8 w-8 rounded-full shadow-sm transition-transform hover:scale-110",
                            msg.sender === 'user1' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-blue-600 hover:bg-slate-50'
                          )}
                          onClick={() => handleSpeak(msg.translation, msg.toLang)}
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                        
                        {(msg as any).details?.dictionary?.length > 0 || (msg as any).details?.alternatives?.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                  "h-8 w-8 rounded-full shadow-sm transition-transform hover:scale-110",
                                  msg.sender === 'user1' ? 'bg-slate-100 text-slate-600' : 'bg-blue-500 text-white'
                                )}
                                onClick={() => {
                                  const details = (msg as any).details;
                                  let info = `Dictionary:\n`;
                                  details.dictionary.forEach((d: any) => {
                                    info += `• ${d.partOfSpeech}: ${d.meaning}\n`;
                                  });
                                  if (details.alternatives.length > 0) {
                                    info += `\nAlternatives: ${details.alternatives.join(', ')}`;
                                  }
                                  toast.info(info, { duration: 5000 });
                                }}
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Show word details</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-xs font-medium text-slate-400">AI is translating...</span>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Control Panel */}
        <div className="p-8 border-t bg-white dark:bg-slate-900 grid grid-cols-2 gap-6 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-lg z-20">
            Push to Talk
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => startListening('user1')}
              className={cn(
                "h-36 rounded-[2.5rem] flex flex-col gap-3 transition-all duration-500 relative overflow-hidden group border-2",
                isListening === 'user1' 
                  ? 'bg-red-500 hover:bg-red-600 border-red-400 shadow-2xl shadow-red-500/40' 
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-100 dark:border-slate-800 shadow-lg'
              )}
            >
              <div className="absolute top-4 left-4">
                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-50">Speaker 1</Badge>
              </div>
              {isListening === 'user1' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 4, opacity: 0.2 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-white rounded-full"
                />
              )}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                isListening === 'user1' ? 'bg-white text-red-500' : 'bg-blue-600 text-white'
              )}>
                {isListening === 'user1' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Speaker 1</p>
                <p className="font-bold text-lg">{LANGUAGES.find(l => l.code === lang1)?.name}</p>
              </div>
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => startListening('user2')}
              className={cn(
                "h-36 rounded-[2.5rem] flex flex-col gap-3 transition-all duration-500 relative overflow-hidden group border-2",
                isListening === 'user2' 
                  ? 'bg-red-500 hover:bg-red-600 border-red-400 shadow-2xl shadow-red-500/40' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/20'
              )}
            >
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-50 text-blue-100 border-blue-400">Speaker 2</Badge>
              </div>
              {isListening === 'user2' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 4, opacity: 0.2 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-white rounded-full"
                />
              )}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                isListening === 'user2' ? 'bg-white text-red-500' : 'bg-white text-blue-600'
              )}>
                {isListening === 'user2' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1",
                  isListening === 'user2' || !isListening ? "text-blue-100" : ""
                )}>Speaker 2</p>
                <p className="font-bold text-lg">{LANGUAGES.find(l => l.code === lang2)?.name}</p>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
