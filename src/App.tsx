import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Translator } from './components/Translator';
import { History } from './components/History';
import { ConversationMode } from './components/ConversationMode';
import { Flashcards } from './components/Flashcards';
import { OCR } from './components/OCR';
import { QuickPhrases } from './components/QuickPhrases';
import { Onboarding } from './components/Onboarding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, History as HistoryIcon, MessageSquare, BookOpen, Camera, Settings as SettingsIcon, Sun, Moon, Monitor, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem, Flashcard, Theme } from './types';
import { Button, buttonVariants } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const savedHistory = localStorage.getItem('lingua_history');
    const savedFavorites = localStorage.getItem('lingua_favorites');
    const savedFlashcards = localStorage.getItem('lingua_flashcards');
    const savedTheme = localStorage.getItem('lingua_theme') as Theme;

    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      const unique = parsed.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
      setHistory(unique);
    }
    if (savedFavorites) {
      const parsed = JSON.parse(savedFavorites);
      const unique = parsed.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
      setFavorites(unique);
    }
    if (savedFlashcards) {
      const parsed = JSON.parse(savedFlashcards);
      const unique = parsed.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
      setFlashcards(unique);
    }
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('lingua_history', JSON.stringify(history));
    localStorage.setItem('lingua_favorites', JSON.stringify(favorites));
    localStorage.setItem('lingua_flashcards', JSON.stringify(flashcards));
    localStorage.setItem('lingua_theme', theme);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [history, favorites, flashcards, theme]);

  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== item.id);
      return [item, ...filtered].slice(0, 50);
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    const item = history.find(h => h.id === id) || favorites.find(f => f.id === id);
    if (!item) return;

    if (favorites.some(f => f.id === id)) {
      setFavorites(prev => prev.filter(f => f.id !== id));
      setHistory(prev => prev.map(h => h.id === id ? { ...h, isFavorite: false } : h));
    } else {
      const newItem = { ...item, isFavorite: true };
      setFavorites(prev => {
        const filtered = prev.filter(f => f.id !== id);
        return [newItem, ...filtered];
      });
      setHistory(prev => prev.map(h => h.id === id ? { ...h, isFavorite: true } : h));
    }
  }, [history, favorites]);

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans`}>
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Languages className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Lingua AI</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "rounded-full")}>
                  {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="w-4 h-4 mr-2" /> Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="w-4 h-4 mr-2" /> Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="w-4 h-4 mr-2" /> System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="rounded-full">
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-2 md:px-4 py-4 md:py-8 max-w-5xl">
          <Tabs defaultValue="translate" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-6 w-full max-w-3xl bg-white dark:bg-slate-900 border shadow-sm rounded-full p-1">
                <TabsTrigger value="translate" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Languages className="w-4 h-4 mr-2 hidden sm:inline" />
                  Translate
                </TabsTrigger>
                <TabsTrigger value="conversation" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <MessageSquare className="w-4 h-4 mr-2 hidden sm:inline" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="ocr" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Camera className="w-4 h-4 mr-2 hidden sm:inline" />
                  OCR
                </TabsTrigger>
                <TabsTrigger value="phrases" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Quote className="w-4 h-4 mr-2 hidden sm:inline" />
                  Phrases
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <HistoryIcon className="w-4 h-4 mr-2 hidden sm:inline" />
                  History
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BookOpen className="w-4 h-4 mr-2 hidden sm:inline" />
                  Cards
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="translate">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Translator onTranslate={addToHistory} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="conversation">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ConversationMode />
                </motion.div>
              </TabsContent>

              <TabsContent value="ocr">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <OCR />
                </motion.div>
              </TabsContent>

              <TabsContent value="phrases">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuickPhrases />
                </motion.div>
              </TabsContent>

              <TabsContent value="history">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <History 
                    history={history} 
                    favorites={favorites} 
                    onToggleFavorite={toggleFavorite}
                    onClearHistory={() => setHistory([])}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="flashcards">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Flashcards 
                    flashcards={flashcards} 
                    onAddFlashcards={(cards) => setFlashcards(prev => [...cards, ...prev])}
                    onRemoveFlashcard={(id) => setFlashcards(prev => prev.filter(c => c.id !== id))}
                  />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </main>

        <footer className="py-8 border-t bg-white dark:bg-slate-900 mt-auto">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p>© 2026 Lingua AI. Professional Translation Reimagined.</p>
          </div>
        </footer>
        
        <Toaster position="bottom-right" richColors />
        <Onboarding />
      </div>
    </TooltipProvider>
  );
}

