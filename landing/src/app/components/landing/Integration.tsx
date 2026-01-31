import React, { useRef } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export function Integration() {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 25 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ["1.2deg", "-1.2deg"]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-1.2deg", "1.2deg"]);
  const scale = useTransform(
    [xSpring, ySpring],
    ([sx, sy]) => 1 + Math.abs(sx) * 0.003 + Math.abs(sy) * 0.003
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!codeRef.current) return;
    const rect = codeRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const codeToCopy = `// 1. Copy vite-plugin-commentation.ts from Commentation repo into your project
// 2. vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { commentationPlugin } from "./vite-plugin-commentation";

export default defineConfig({
  plugins: [react(), commentationPlugin()],
});

// 3. index.html - add before </body>
// Dev: use embed.tsx if you have the source. Prod: use built embed.js
<script type="module" src="/src/embed.tsx" data-project-id="my-project"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 px-6 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">
            Drop-in simplicity.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm leading-loose">
            Copy <code className="font-mono text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">vite-plugin-commentation.ts</code> from the Commentation repo into your project. Add the plugin and a script tag. The overlay mounts into <code className="font-mono text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">#fig-comments-root</code> (created automatically if missing). Comments are written to <code className="font-mono text-xs bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">.commentation/data.json</code> — commit and push to sync with your team.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-start gap-3">
               <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                 <Check className="w-3 h-3" />
               </div>
               <div>
                 <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">Zero Layout Shift</h4>
                 <p className="text-zinc-500 dark:text-zinc-500 text-sm">The overlay mounts in its own root (appended to body) with fixed positioning. Your page layout stays intact.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                 <Check className="w-3 h-3" />
               </div>
               <div>
                 <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">Local-first</h4>
                 <p className="text-zinc-500 dark:text-zinc-500 text-sm">Comments live in .commentation/. No server required. Sync via Git — commit and push to share.</p>
               </div>
             </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl [perspective:1000px]">
          <motion.div
            ref={codeRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
              scale,
              transformStyle: "preserve-3d",
            }}
            className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-200 dark:bg-[#161b22] border-b border-zinc-200 dark:border-zinc-800">
               <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                 <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">vite.config.ts + index.html</span>
               </div>
               <button 
                 onClick={copyToClipboard}
                 className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
               >
                 {copied ? <Check className="w-3 h-3 text-green-600 dark:text-green-500" /> : <Copy className="w-3 h-3" />}
                 {copied ? "Copied" : "Copy"}
               </button>
            </div>
            <div className="p-6">
              <div className="font-mono text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                <div className="text-zinc-500 dark:text-zinc-500 mb-2">// vite.config.ts</div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400">import</span> {'{'} <span className="text-amber-700 dark:text-yellow-200">commentationPlugin</span> {'}'} <span className="text-purple-600 dark:text-purple-400">from</span> <span className="text-green-700 dark:text-green-300">"./vite-plugin-commentation"</span>;
                </div>
                <div className="mt-2">
                  <span className="text-purple-600 dark:text-purple-400">export default</span> <span className="text-amber-700 dark:text-yellow-200">defineConfig</span>({'{'}
                </div>
                <div className="pl-4">
                  <span className="text-blue-600 dark:text-blue-300">plugins</span>: [<span className="text-amber-700 dark:text-yellow-200">react</span>(), <span className="text-amber-700 dark:text-yellow-200">commentationPlugin</span>()],
                </div>
                <div>{'}'});</div>
                <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-4"></div>
                <div className="text-zinc-500 dark:text-zinc-500 mb-2">// index.html — add before &lt;/body&gt;</div>
                <div>
                  &lt;<span className="text-amber-700 dark:text-yellow-200">script</span>{' '}
                  <span className="text-blue-600 dark:text-blue-300">type</span>=<span className="text-green-700 dark:text-green-300">"module"</span>{' '}
                  <span className="text-blue-600 dark:text-blue-300">src</span>=<span className="text-green-700 dark:text-green-300">"/src/embed.tsx"</span>{' '}
                  <span className="text-blue-600 dark:text-blue-300">data-project-id</span>=<span className="text-green-700 dark:text-green-300">"my-project"</span>
                  &gt;&lt;/<span className="text-amber-700 dark:text-yellow-200">script</span>&gt;
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
