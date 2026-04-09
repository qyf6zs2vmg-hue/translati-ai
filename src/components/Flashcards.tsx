import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Plus, Trash2, Brain, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard } from '@/src/types';
import { geminiService } from '@/src/services/geminiService';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { generateId } from '@/lib/utils';

interface FlashcardsProps {
  flashcards: Flashcard[];
  onAddFlashcards: (cards: Flashcard[]) => void;
  onRemoveFlashcard: (id: string) => void;
}

export function Flashcards({ flashcards, onAddFlashcards, onRemoveFlashcard }: FlashcardsProps) {
  const [isStudying, setIsStudying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateInput, setGenerateInput] = useState('');

  const handleGenerate = async () => {
    if (!generateInput.trim()) return;
    setIsGenerating(true);
    try {
      const cards = await geminiService.generateFlashcards(generateInput, 'target language');
      const newCards = cards.map((c, i) => ({ 
        ...c, 
        id: generateId('card', i)
      }));
      onAddFlashcards(newCards);
      setGenerateInput('');
      toast.success(`Generated ${newCards.length} flashcards!`);
    } catch (error) {
      toast.error('Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setIsStudying(false);
      setCurrentIndex(0);
      toast.success('Session complete! Great job!');
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  if (isStudying && flashcards.length > 0) {
    const currentCard = flashcards[currentIndex];
    return (
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setIsStudying(false)} className="rounded-full">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Exit Study
          </Button>
          <span className="text-sm font-bold text-slate-400">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>

        <div className="perspective-1000 h-[400px] w-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            className="relative w-full h-full preserve-3d"
          >
            {/* Front */}
            <Card className="absolute inset-0 backface-hidden border-none shadow-2xl rounded-[2rem] flex items-center justify-center p-8 bg-white dark:bg-slate-900">
              <CardContent className="text-center space-y-4">
                <Badge variant="secondary" className="mb-4">Original</Badge>
                <h2 className="text-4xl font-bold tracking-tight">{currentCard.front}</h2>
                <p className="text-slate-400 text-sm animate-pulse mt-8">Click to flip</p>
              </CardContent>
            </Card>

            {/* Back */}
            <Card className="absolute inset-0 backface-hidden border-none shadow-2xl rounded-[2rem] flex items-center justify-center p-8 bg-blue-600 text-white rotate-y-180">
              <CardContent className="text-center space-y-6">
                <Badge variant="outline" className="text-white border-white/20 mb-4">Translation</Badge>
                <h2 className="text-4xl font-bold tracking-tight">{currentCard.back}</h2>
                {currentCard.example && (
                  <p className="text-blue-100 italic text-lg mt-4">"{currentCard.example}"</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" size="lg" onClick={handlePrev} disabled={currentIndex === 0} className="rounded-full w-16 h-16">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button size="lg" onClick={handleNext} className="rounded-full px-12 h-16 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
            {currentIndex === flashcards.length - 1 ? 'Finish' : 'Next Card'}
            <ChevronRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Card Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Paste text or a list of words to generate learning cards automatically.</p>
            <Input 
              placeholder="e.g. hello, world, apple..." 
              value={generateInput}
              onChange={(e) => setGenerateInput(e.target.value)}
              className="rounded-xl"
            />
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl" 
              onClick={handleGenerate}
              disabled={isGenerating || !generateInput.trim()}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Generate Cards
            </Button>
          </CardContent>
        </Card>

        {flashcards.length > 0 && (
          <Button 
            size="lg" 
            className="w-full h-20 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/20 text-xl font-bold"
            onClick={() => setIsStudying(true)}
          >
            <Brain className="w-6 h-6 mr-3" />
            Start Study Session
          </Button>
        )}
      </div>

      <div className="lg:col-span-2">
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden min-h-[500px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Your Flashcards
            </CardTitle>
            <Badge variant="secondary" className="rounded-full">{flashcards.length} Cards</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {flashcards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                  <RotateCcw className="w-12 h-12 opacity-20" />
                  <p className="text-sm italic">No cards yet. Generate some to start learning!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcards.map((card) => (
                    <Card key={card.id} className="border-none bg-slate-50 dark:bg-slate-800/50 rounded-2xl group relative overflow-hidden">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg">{card.front}</h4>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemoveFlashcard(card.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{card.back}</p>
                        {card.example && <p className="text-xs text-slate-400 italic">"{card.example}"</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
