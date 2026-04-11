import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, Loader2, Copy, Check, Languages, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react';
import { geminiService } from '@/src/services/geminiService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES = [
  { code: 'en', name: 'Английский' },
  { code: 'ru', name: 'Русский' },
  { code: 'uz', name: 'Узбекский' },
  { code: 'tr', name: 'Турецкий' },
  { code: 'es', name: 'Испанский' },
  { code: 'fr', name: 'Французский' },
  { code: 'de', name: 'Немецкий' },
];

export function OCR() {
  const [image, setImage] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('uz');
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<'original' | 'translated' | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleProcess = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const res = await geminiService.ocrAndTranslate(image, targetLang);
      setResult(res);
      toast.success('Текст успешно извлечен и переведен');
    } catch (error) {
      toast.error('Не удалось обработать изображение');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'original' | 'translated') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Скопировано в буфер обмена');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Источник изображения
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div 
              {...getRootProps()} 
              className={`
                relative aspect-video rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center
                ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}
                ${image ? 'border-none' : ''}
              `}
            >
              <input {...getInputProps()} />
              {image ? (
                <>
                  <img src={image} alt="Preview" className="w-full h-full object-contain bg-slate-100 dark:bg-slate-950" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-4 right-4 rounded-full shadow-lg z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      setResult(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Upload className="w-10 h-10" />
                  <p className="text-sm font-medium">Перетащите сюда или нажмите для загрузки</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Целевой язык</label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleProcess} 
                disabled={!image || isLoading}
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-lg shadow-blue-500/20"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Обработать
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="border-none shadow-xl bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl overflow-hidden">
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-purple-500" />
              Извлечение и перевод
            </h3>

            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400"
                  >
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-sm animate-pulse">Анализ изображения и перевод...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Извлеченный текст</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(result.original, 'original')}>
                          {copied === 'original' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                        {result.original}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Перевод ({targetLang})</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(result.translated, 'translated')}>
                          {copied === 'translated' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-slate-100 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/50">
                        {result.translated}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700 space-y-2">
                    <Camera className="w-12 h-12 opacity-20" />
                    <p className="text-sm italic">Результаты появятся здесь после обработки</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
