import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Trash2, Clock, Calendar, Copy, Volume2 } from 'lucide-react';
import { HistoryItem } from '@/src/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HistoryProps {
  history: HistoryItem[];
  favorites: HistoryItem[];
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
}

export function History({ history, favorites, onToggleFavorite, onClearHistory }: HistoryProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const handleSpeak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const renderList = (items: HistoryItem[], emptyMsg: string, prefix: string) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
          <Clock className="w-12 h-12 opacity-20" />
          <p className="text-sm italic">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={`${prefix}-${item.id}`} className="border-none shadow-sm hover:shadow-md transition-shadow group rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase">{item.from}</Badge>
                  <span className="text-slate-300">→</span>
                  <Badge variant="secondary" className="text-[10px] uppercase">{item.to}</Badge>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onToggleFavorite(item.id)}>
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCopy(item.translatedText)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleSpeak(item.translatedText, item.to)}>
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium line-clamp-2">{item.originalText}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 line-clamp-2">{item.translatedText}</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-50 dark:border-slate-800">
                <Calendar className="w-3 h-3" />
                {format(item.timestamp, 'MMM d, yyyy • HH:mm')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Ваша активность</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearHistory} className="text-slate-400 hover:text-red-500 rounded-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Очистить
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-full p-1 w-full max-w-[300px]">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-none">Вся история</TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 shadow-none">Избранное</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="all" className="m-0">
              {renderList(history, 'История пуста. Начните переводить!', 'hist')}
            </TabsContent>
            <TabsContent value="favorites" className="m-0">
              {renderList(favorites, 'Избранного пока нет. Отмечайте лучшие переводы звездочкой!', 'fav')}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
