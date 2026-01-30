import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function Integration() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText("npm install @commentation/react");
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
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-lg leading-relaxed">
            Wrap your app in the provider and you're done. We handle the overlay, positioning logic, and state management.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-start gap-3">
               <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                 <Check className="w-3 h-3" />
               </div>
               <div>
                 <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">Zero Layout Shift</h4>
                 <p className="text-zinc-500 dark:text-zinc-500 text-sm">The overlay sits in a portal, ensuring your CSS is never affected.</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                 <Check className="w-3 h-3" />
               </div>
               <div>
                 <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">Fully Typed</h4>
                 <p className="text-zinc-500 dark:text-zinc-500 text-sm">Written in TypeScript. Props and events are fully typed for better DX.</p>
               </div>
             </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-xl">
          <div className="rounded-xl overflow-hidden bg-[#0d1117] border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-zinc-800">
               <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-zinc-400" />
                 <span className="text-xs text-zinc-400 font-mono">BASH</span>
               </div>
               <button 
                 onClick={copyToClipboard}
                 className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
               >
                 {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                 {copied ? "Copied" : "Copy"}
               </button>
            </div>
            <div className="p-6">
              <div className="font-mono text-sm text-zinc-300 mb-4">
                <span className="text-green-400">$</span> npm install @commentation/react
              </div>
              <div className="h-px w-full bg-zinc-800 mb-4"></div>
              <div className="font-mono text-sm">
                <div className="text-zinc-500 mb-2">// In your root component</div>
                <div>
                  <span className="text-purple-400">import</span> {'{'} <span className="text-yellow-200">Commentation</span> {'}'} <span className="text-purple-400">from</span> <span className="text-green-300">'@commentation/react'</span>;
                </div>
                <div className="mt-4">
                  <span className="text-purple-400">export default function</span> <span className="text-blue-400">App</span>() {'{'}
                </div>
                <div className="pl-4">
                   <span className="text-purple-400">return</span> (
                </div>
                <div className="pl-8">
                   &lt;<span className="text-yellow-200">Commentation</span> <span className="text-blue-300">projectId</span>=<span className="text-green-300">"demo"</span>&gt;
                </div>
                <div className="pl-12 text-zinc-500">
                   {/* Your app content */}
                </div>
                <div className="pl-12">
                   &lt;<span className="text-yellow-200">Dashboard</span> /&gt;
                </div>
                <div className="pl-8">
                   &lt;/<span className="text-yellow-200">Commentation</span>&gt;
                </div>
                <div className="pl-4">
                   );
                </div>
                <div>{'}'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
