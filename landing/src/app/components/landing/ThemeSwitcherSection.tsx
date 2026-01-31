import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeSwitcherSectionProps {
  onThemeChange: (theme: 'dark' | 'light') => void;
  currentTheme: 'dark' | 'light';
}

export function ThemeSwitcherSection({ onThemeChange, currentTheme }: ThemeSwitcherSectionProps) {
  const handleThemeClick = (theme: 'dark' | 'light') => {
    if (currentTheme === theme) return;
    // Change theme immediately so it transitions while the slider animates
    onThemeChange(theme);
  };
  
  return (
    <section className="py-20 px-6 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-lg font-light text-zinc-500 dark:text-zinc-400 mb-8 font-mono lowercase tracking-wide">
          available in dark mode and light mode
        </p>
        
        {/* Pillbox theme switcher with sliding track */}
        <div className="relative inline-flex items-center gap-0 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors duration-350">
          {/* Sliding track */}
          <div 
            data-theme-slider-track
            className="absolute left-1 top-1 bottom-1 rounded-full bg-white dark:bg-zinc-700 shadow-sm pointer-events-none transition-colors duration-350"
            style={{
              width: 'calc(50% - 4px)',
              transform: currentTheme === 'dark' ? 'translate3d(0, 0, 0)' : 'translate3d(100%, 0, 0)',
              zIndex: 0
            }}
          />
          <button
            onClick={() => handleThemeClick('dark')}
            className={`
              relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-350
              ${currentTheme === 'dark'
                ? 'text-white' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              }
            `}
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
          <button
            onClick={() => handleThemeClick('light')}
            className={`
              relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-350
              ${currentTheme === 'light'
                ? 'text-zinc-900 dark:text-white' 
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              }
            `}
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
        </div>
      </div>
    </section>
  );
}
