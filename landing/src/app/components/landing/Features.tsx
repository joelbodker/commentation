import React from 'react';
import { Database, GitBranch, Cpu, Lock } from 'lucide-react';

const features = [
  {
    icon: Database,
    title: "JSON Storage",
    desc: "No external database required. Comments are stored as JSON files in your repo."
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    desc: "Sync feedback branches automatically. Comments become PR comments via GitHub Actions."
  },
  {
    icon: Cpu,
    title: "Framework Agnostic",
    desc: "Works with React, Vue, Svelte, or vanilla JS. Web Components wrapper included."
  },
  {
    icon: Lock,
    title: "Self-Hosted Ready",
    desc: "Keep your data within your VPC. Docker container available for enterprise teams."
  }
];

export function Features() {
  return (
    <section className="py-24 px-6 border-y border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Built for the modern stack.</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            We stripped away the bloat. Commentation is a dev-tool first, feedback tool second.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-900 dark:text-white mb-4 group-hover:scale-105 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 font-mono">{f.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
