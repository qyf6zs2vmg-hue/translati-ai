import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { 
  Languages, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Globe2,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasVisited = localStorage.getItem('lingua_visited');
    if (!hasVisited) {
      setShow(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('lingua_visited', 'true');
    setShow(false);
  };

  const steps = [
    {
      title: "Welcome to Lingua AI",
      description: "Experience the next generation of translation. Powered by advanced AI to give you more than just words.",
      icon: <Sparkles className="w-12 h-12 text-blue-500" />,
      color: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "Real-Time Intelligence",
      description: "Get instant translations with deep context, synonyms, and usage examples. It's like having a linguist in your pocket.",
      icon: <Cpu className="w-12 h-12 text-purple-500" />,
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      title: "Why Lingua AI?",
      features: [
        { title: "Pro Engine", desc: "Deeper linguistic data than standard tools." },
        { title: "Voice Chat", desc: "Natural face-to-face conversation mode." },
        { title: "Offline Ready", desc: "Fast, cached results for your history." }
      ],
      icon: <ShieldCheck className="w-12 h-12 text-green-500" />,
      color: "from-green-500/20 to-blue-500/20"
    }
  ];

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative"
        >
          {/* Background Glow */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-30 transition-colors duration-700",
            steps[step].color
          )} />

          <div className="relative p-8 md:p-12 flex flex-col items-center text-center space-y-8">
            <motion.div
              key={step}
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700"
            >
              {steps[step].icon}
            </motion.div>

            <div className="space-y-4">
              <motion.h2 
                key={`title-${step}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {steps[step].title}
              </motion.h2>
              
              {steps[step].description && (
                <motion.p 
                  key={`desc-${step}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-slate-500 dark:text-slate-400 leading-relaxed"
                >
                  {steps[step].description}
                </motion.p>
              )}

              {steps[step].features && (
                <div className="grid gap-4 text-left mt-6">
                  {steps[step].features.map((f, i) => (
                    <motion.div 
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
                    >
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{f.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col w-full gap-3 pt-4">
              <Button 
                size="lg" 
                onClick={() => step < steps.length - 1 ? setStep(step + 1) : handleComplete()}
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/25 group"
              >
                {step === steps.length - 1 ? "Get Started" : "Continue"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {step < steps.length - 1 && (
                <Button 
                  variant="ghost" 
                  onClick={handleComplete}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Skip
                </Button>
              )}
            </div>

            {/* Progress Dots */}
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === step ? "w-8 bg-blue-600" : "w-2 bg-slate-200 dark:bg-slate-700"
                  )} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
