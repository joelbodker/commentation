import React from 'react';
import { MousePointer2, MessageSquarePlus, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: "01",
    title: "Add the plugin",
    desc: "Copy vite-plugin-commentation.ts from the Commentation repo into your project."
  },
  {
    number: "02",
    title: "Add the script tag",
    desc: "Load the overlay in your HTML with data-project-id. The overlay mounts automatically."
  },
  {
    number: "03",
    title: "Commit & push",
    desc: "Comments live in .commentation/data.json. Commit and push to sync with your team."
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-zinc-100 dark:border-zinc-800 pb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Workflow optimized.</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Fits your Git workflow. No server, no API.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="text-6xl font-bold text-zinc-500 dark:text-zinc-400 mb-6 font-mono select-none">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
