import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Volume2, Copy, Heart, Plane, Utensils, Hotel, ShoppingBag, HeartPulse } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Phrase } from '../types';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Search },
  { id: 'travel', name: 'Travel', icon: Plane },
  { id: 'food', name: 'Food', icon: Utensils },
  { id: 'hotel', name: 'Hotel', icon: Hotel },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
  { id: 'health', name: 'Health', icon: HeartPulse },
];

const PHRASES: Phrase[] = [
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
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPhrases = PHRASES.filter(p => {
    const matchesSearch = p.text.toLowerCase().includes(search.toLowerCase()) || 
                         p.translation.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search phrases..." 
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="rounded-full whitespace-nowrap"
            >
              <cat.icon className="w-3 h-3 mr-2" />
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPhrases.map((phrase) => (
          <Card key={phrase.id} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-4 px-1.5">
                    {phrase.category}
                  </Badge>
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{phrase.text}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{phrase.translation}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleSpeak(phrase.translation)}>
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCopy(phrase.translation)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
