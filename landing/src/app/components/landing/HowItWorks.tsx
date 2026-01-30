import React from 'react';
import { MousePointer2, MessageSquarePlus, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: "01",
    title: "Install the SDK",
    desc: "Add our tiny 2kb package to your dev dependencies."
  },
  {
    number: "02",
    title: "Wrap your App",
    desc: "Add the provider to your root layout. Works with Next.js App Router."
  },
  {
    number: "03",
    title: "Ship & Iterate",
    desc: "Comments sync to your repo as JSON files. Merge them to resolve."
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-zinc-100 dark:border-zinc-800 pb-8">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Workflow optimized.</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Designed to fit your existing CI/CD pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="text-6xl font-bold text-zinc-100 dark:text-zinc-900 mb-6 font-mono select-none">
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
