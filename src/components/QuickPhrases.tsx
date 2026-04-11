import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Volume2, 
  Copy, 
  Plane, 
  Utensils, 
  Hotel, 
  ShoppingBag, 
  HeartPulse, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  Loader2,
  Plus,
  Languages
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Phrase } from '../types';
import { geminiService } from '../services/geminiService';
import { generateId, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'all', name: 'Все', icon: Search },
  { id: 'travel', name: 'Путешествия', icon: Plane },
  { id: 'food', name: 'Еда', icon: Utensils },
  { id: 'hotel', name: 'Отель', icon: Hotel },
  { id: 'shopping', name: 'Шопинг', icon: ShoppingBag },
  { id: 'health', name: 'Здоровье', icon: HeartPulse },
];

const LANGUAGES = [
  { code: 'en', name: 'Английский' },
  { code: 'ru', name: 'Русский' },
  { code: 'uz', name: 'Узбекский' },
  { code: 'tr', name: 'Турецкий' },
  { code: 'es', name: 'Испанский' },
  { code: 'fr', name: 'Французский' },
  { code: 'de', name: 'Немецкий' },
];

const DEFAULT_PHRASES: Phrase[] = [
  { id: 'p1', category: 'travel', text: 'Where is the nearest station?', translation: 'Eng yaqin stansiya qayerda?' },
  { id: 'p2', category: 'travel', text: 'How much is a ticket?', translation: 'Chipta necha pul turadi?' },
  { id: 'p3', category: 'food', text: 'I would like to order...', translation: 'Men buyurtma bermoqchi edim...' },
  { id: 'p4', category: 'food', text: 'The bill, please.', translation: 'Hisobni keltiring, iltimos.' },
  { id: 'p5', category: 'hotel', text: 'I have a reservation.', translation: 'Menda band qilingan joy bor.' },
  { id: 'p6', category: 'hotel', text: 'Is breakfast included?', translation: 'Nonushta kiritilganmi?' },
  { id: 'p7', category: 'shopping', text: 'Can I try this on?', translation: 'Buni kiyib ko\'rsam bo\'ladimi?' },
  { id: 'p8', category: 'shopping', text: 'Do you have this in a different size?', translation: 'Buning boshqa o\'lchami bormi?' },
  { id: 'p9', category: 'health', text: 'I need a doctor.', translation: 'Menga shifokor kerak.' },
  { id: 'p10', category: 'health', text: 'Where is the pharmacy?', translation: 'Dorixona qayerda?' },
];

export function QuickPhrases() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('uz');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ text: '', translation: '' });
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lingua_phrases');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPhrases(parsed);
        } else {
          setPhrases(DEFAULT_PHRASES);
        }
      } else {
        setPhrases(DEFAULT_PHRASES);
      }
    } catch (error) {
      console.error("Error loading phrases:", error);
      setPhrases(DEFAULT_PHRASES);
    }
  }, []);

  useEffect(() => {
    if (phrases.length > 0) {
      localStorage.setItem('lingua_phrases', JSON.stringify(phrases));
    }
  }, [phrases]);

  const filteredPhrases = phrases.filter(p => {
    const matchesSearch = p.text.toLowerCase().includes(search.toLowerCase()) || 
                         p.translation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const handleSpeak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const startEditing = (phrase: Phrase) => {
    setEditingId(phrase.id);
    setEditForm({ text: phrase.text, translation: phrase.translation });
  };

  const saveEdit = () => {
    setPhrases(prev => prev.map(p => 
      p.id === editingId ? { ...p, ...editForm } : p
    ));
    setEditingId(null);
    toast.success('Фраза обновлена');
  };

  const translateAll = async () => {
    setIsTranslatingAll(true);
    try {
      const updatedPhrases = await Promise.all(phrases.map(async (p) => {
        const res = await geminiService.translate(p.text, fromLang, toLang);
        return { ...p, translation: res.translation };
      }));
      setPhrases(updatedPhrases);
      toast.success('Все фразы переведены!');
    } catch (e) {
      toast.error('Ошибка перевода');
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const addNewPhrase = () => {
    const newPhrase: Phrase = {
      id: generateId('p'),
      category: activeCategory === 'all' ? 'travel' : activeCategory,
      text: 'Новая фраза',
      translation: 'Новая фраза'
    };
    setPhrases(prev => [newPhrase, ...prev]);
    startEditing(newPhrase);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={fromLang} onValueChange={setFromLang}>
                <SelectTrigger className="w-full md:w-[140px] rounded-xl border-none bg-slate-50 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Languages className="w-4 h-4 text-slate-400" />
              <Select value={toLang} onValueChange={setToLang}>
                <SelectTrigger className="w-full md:w-[140px] rounded-xl border-none bg-slate-50 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                onClick={translateAll} 
                disabled={isTranslatingAll}
                variant="outline"
                className="flex-1 md:flex-none rounded-xl border-blue-100 dark:border-blue-900 text-blue-600 hover:bg-blue-50"
              >
                {isTranslatingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Перевести все
              </Button>
              <Button onClick={addNewPhrase} className="flex-1 md:flex-none rounded-xl bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Поиск фраз..." 
                className="pl-10 rounded-xl border-none bg-slate-50 dark:bg-slate-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "rounded-full whitespace-nowrap",
                    activeCategory === cat.id ? "bg-blue-600 text-white" : "text-slate-500"
                  )}
                >
                  <cat.icon className="w-3 h-3 mr-2" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phrases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPhrases.map((phrase) => (
            <motion.div
              layout
              key={phrase.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group bg-white dark:bg-slate-900">
                <CardContent className="p-5 flex flex-col gap-4">
                  {editingId === phrase.id ? (
                    <div className="space-y-3">
                      <Input 
                        value={editForm.text} 
                        onChange={e => setEditForm({...editForm, text: e.target.value})}
                        className="rounded-xl border-blue-200"
                        placeholder="Фраза на исходном языке"
                      />
                      <Input 
                        value={editForm.translation} 
                        onChange={e => setEditForm({...editForm, translation: e.target.value})}
                        className="rounded-xl border-blue-200"
                        placeholder="Перевод"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="rounded-lg">
                          <X className="w-4 h-4 mr-1" /> Отмена
                        </Button>
                        <Button size="sm" onClick={saveEdit} className="rounded-lg bg-green-600 hover:bg-green-700">
                          <Check className="w-4 h-4 mr-1" /> Сохранить
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-4 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {phrase.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{phrase.text}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{phrase.translation}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleSpeak(phrase.translation, toLang)}>
                          <Volume2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => startEditing(phrase)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCopy(phrase.translation)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
