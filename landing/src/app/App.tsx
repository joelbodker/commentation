import React, { useState } from 'react';
import { Hero } from "@/app/components/landing/Hero";
import { Features } from "@/app/components/landing/Features";
import { HowItWorks } from "@/app/components/landing/HowItWorks";
import { Integration } from "@/app/components/landing/Integration";
import { Support } from "@/app/components/landing/Support";
import { IntroAnimation } from "@/app/components/IntroAnimation";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Overlay } from "@commentation/Overlay";

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Intro Animation */}
      {!introComplete && <IntroAnimation onComplete={() => setIntroComplete(true)} />}
      
      <Toaster position="top-center" theme="dark" />
      
      {/* Main content - fades in after intro */}
      <AnimatePresence>
        {introComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Landing page content - outside fig-comments-root so clicks create pins */}
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-light text-lg tracking-tight font-mono lowercase">
                    <div className="w-6 h-6 bg-zinc-900 dark:bg-white rounded flex items-center justify-center text-white dark:text-black font-mono text-xs">
                      C
                    </div>
                    Commentation
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    <a href="https://github.com/joelbodker/commentation/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Documentation</a>
                    <a href="https://github.com/joelbodker/commentation" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-white transition-colors">GitHub</a>
                  </div>
                </div>
              </nav>

              <main className="bg-white dark:bg-black">
                <Hero />
                <Features />
                <Integration />
                <HowItWorks />
                <Support />
                
                {/* Simple Footer */}
                <footer className="py-12 px-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black">
                   <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white" style={{ fontFamily: '"JMH Typewriter", "Courier New", Courier, monospace' }}>
                         <div className="w-5 h-5 bg-zinc-900 dark:bg-white rounded flex items-center justify-center text-white dark:text-black font-mono text-[10px]">
                            C
                         </div>
                         Commentation
                      </div>
                      <div className="flex gap-6 text-xs text-zinc-500 dark:text-zinc-500">
                         <a href="https://github.com/joelbodker/commentation/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-zinc-300">Docs</a>
                         <a href="https://github.com/joelbodker/commentation/blob/main/landing/PRIVACY.md" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-zinc-300">Privacy</a>
                         <a href="https://github.com/joelbodker/commentation/blob/main/landing/TERMS.md" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 dark:hover:text-zinc-300">Terms</a>
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
                         v2.4.0
                      </div>
                   </div>
                </footer>
              </main>

            {/* Commentation overlay - minimized (pillbox) by default */}
            <div id="fig-comments-root">
              <Overlay projectId="landing" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
