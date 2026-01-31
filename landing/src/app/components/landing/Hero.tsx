import React, { useState } from 'react';
import { Github, ChevronRight, Command, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const NPM_COMMAND = 'npm install commentation';

export function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(NPM_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };
  return (
    <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>

      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-emerald-500/50"
              animate={{
                borderColor: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.3)'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span
                className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                style={{ boxShadow: '0 0 12px 4px rgba(16, 185, 129, 0.6)' }}
              />
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">Free & Open Source</span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-8 leading-[1.1]">
              Collaboration for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">
                frontend teams.
              </span>
            </h1>
            
            <p className="text-lg font-light text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-xl">
              The missing overlay for your preview deployments.
              <br />
              Drop comments directly on DOM elements.
              <br />
              Syncs with GitHub Issues.
              <br />
              Stored as JSON.
              <br />
              <span className="font-medium tagline-gradient">Your team&apos;s feedback, finally in context.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleCopy}
                className="h-12 min-w-[260px] px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      Copied to clipboard
                    </motion.span>
                  ) : (
                    <motion.span
                      key="command"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {NPM_COMMAND}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <a href="https://github.com/joelbodker/commentation" target="_blank" rel="noopener noreferrer" className="h-12 px-8 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
                <Github className="w-4 h-4" /> View on GitHub
              </a>
            </div>
            
            <div className="mt-8 flex items-center gap-6 text-sm text-zinc-500 font-mono">
              <span className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500" />
                React
              </span>
              <span className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500" />
                Vue
              </span>
              <span className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-blue-500" />
                Svelte
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="flex-1 w-full max-w-lg lg:max-w-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <div className="ml-4 flex-1 text-center">
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-500">
                   <Command className="w-3 h-3" />
                   <span>preview.acme.com</span>
                 </div>
              </div>
            </div>
            
            <div className="p-6 font-mono text-sm overflow-hidden relative">
              <div className="absolute top-12 left-12 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center animate-pulse z-20 cursor-pointer">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              </div>
              
               <div className="space-y-4 opacity-70 blur-[1px] select-none">
                 <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                 <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="h-20 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                   <div className="h-20 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                 </div>
               </div>

               {/* Popover simulation */}
               <div className="absolute top-16 left-16 z-30 w-64 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-3">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-blue-500"></div>
                   <span className="text-xs font-semibold text-zinc-900 dark:text-white tracking-wide">ALEX_DEV</span>
                   <span className="text-[10px] text-zinc-400 ml-auto">now</span>
                 </div>
                 <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-2">The padding on this component doesn't match the design spec.</p>
                 <div className="flex gap-2">
                    <button className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-2 py-1 rounded">Resolve</button>
                    <button className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-2 py-1 rounded">Reply</button>
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
