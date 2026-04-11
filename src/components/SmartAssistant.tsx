import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Brain, 
  FileText, 
  RefreshCw, 
  Languages, 
  Copy, 
  Check, 
  Loader2,
  Info,
  Lightbulb
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type Action = 'simplify' | 'explain' | 'summarize' | 'rephrase' | 'translateSimplify';

const ACTIONS: { id: Action; label: string; icon: any; description: string }[] = [
  { 
    id: 'simplify', 
    label: 'Упростить', 
    icon: Sparkles, 
    description: 'Сделать текст понятным' 
  },
  { 
    id: 'explain', 
    label: 'Объяснить', 
    icon: Brain, 
    description: 'Объяснить как ребенку' 
  },
  { 
    id: 'summarize', 
    label: 'Суммировать', 
    icon: FileText, 
    description: 'Выделить главное' 
  },
  { 
    id: 'rephrase', 
    label: 'Перефразировать', 
    icon: RefreshCw, 
    description: 'Сказать иначе' 
  },
  { 
    id: 'translateSimplify', 
    label: 'Умный перевод', 
    icon: Languages, 
    description: 'Перевести и упростить' 
  },
];

export function SmartAssistant() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAction = async (action: Action) => {
    if (!input.trim()) {
      toast.error('Пожалуйста, сначала введите текст');
      return;
    }

    setIsLoading(true);
    setActiveAction(action);
    
    try {
      const result = await geminiService.processText(input, action);
      setOutput(result);
    } catch (error) {
      toast.error('Не удалось обработать текст');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Lightbulb className="w-8 h-8 text-amber-500" />
          Умный текстовый помощник
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Ваш помощник в понимании сложной информации.
        </p>
      </div>

      <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col">
            {/* Input Section */}
            <div className="p-6 space-y-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Лучше всего для длинных или сложных текстов
                </span>
                <span className="text-xs text-slate-400">{input.length} символов</span>
              </div>
              
              <Textarea
                placeholder="Вставьте текст здесь... Я упрощу, объясню или суммирую его"
                className="min-h-[200px] border-none bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-lg resize-none focus-visible:ring-2 focus-visible:ring-blue-500/20 p-6 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            {/* Actions Section */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    variant={activeAction === action.id ? 'default' : 'outline'}
                    className={cn(
                      "flex flex-col h-auto py-4 gap-2 rounded-2xl transition-all duration-300 border-slate-200 dark:border-slate-700",
                      activeAction === action.id 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105" 
                        : "bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                    )}
                    onClick={() => handleAction(action.id)}
                    disabled={isLoading}
                  >
                    <action.icon className={cn("w-5 h-5", activeAction === action.id ? "text-white" : "text-blue-500")} />
                    <div className="text-center">
                      <div className="text-xs font-bold">{action.label}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Output Section */}
            <AnimatePresence>
              {(output || isLoading) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-8 bg-blue-50/30 dark:bg-blue-900/5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {isLoading ? 'Обработка...' : 'Результат'}
                      </h3>
                      {!isLoading && output && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="rounded-full h-8 px-3 gap-2 text-slate-500 hover:text-blue-600"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Скопировано' : 'Копировать'}
                        </Button>
                      )}
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                      {isLoading ? (
                        <div className="space-y-3">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse" />
                        </div>
                      ) : (
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-lg">
                          {output}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="font-bold mb-2">Упростить</h4>
          <p className="text-sm text-slate-500">Превращает сложный жаргон в простой язык, понятный каждому.</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <h4 className="font-bold mb-2">Объяснить</h4>
          <p className="text-sm text-slate-500">Разбирает сложные концепции с примерами из реальной жизни.</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="font-bold mb-2">Суммировать</h4>
          <p className="text-sm text-slate-500">Извлекает суть длинных статей или документов за считанные секунды.</p>
        </div>
      </div>
    </div>
  );
}
