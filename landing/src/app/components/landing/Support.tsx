import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Coffee, Heart, Star } from 'lucide-react';

export function Support() {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse tracking logic for 3D effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="py-32 px-6 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          
          {/* 3D Interactive Card */}
          <div className="relative perspective-1000 w-full max-w-xs mx-auto md:mx-0">
            <motion.div
              ref={ref}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative aspect-square rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl flex items-center justify-center cursor-pointer group"
            >
              <div 
                className="absolute inset-0 rounded-3xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" 
                style={{ transform: "translateZ(20px)" }}
              />
              
              {/* Floating Elements */}
              <motion.div 
                style={{ transform: "translateZ(60px)" }}
                className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
              >
                <img 
                  src="https://images.unsplash.com/photo-1559715541-d4fc97b8d6dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzZCUyMGN1dGUlMjByb2JvdCUyMGNoYXJhY3RlciUyMHRveSUyMG1pbmltYWxpc3RpY3xlbnwxfHx8fDE3Njk3NTk4MjB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="3D Robot"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div 
                style={{ transform: "translateZ(100px) translateY(-80px) translateX(60px)" }}
                className="absolute bg-white text-red-500 p-3 rounded-2xl shadow-xl animate-bounce"
              >
                <Heart className="w-6 h-6 fill-current" />
              </motion.div>

              <motion.div 
                style={{ transform: "translateZ(80px) translateY(80px) translateX(-60px)" }}
                className="absolute bg-yellow-400 text-yellow-900 p-2 rounded-xl shadow-lg"
              >
                <Star className="w-5 h-5 fill-current" />
              </motion.div>
            </motion.div>
            
            {/* Shadow */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 blur-2xl rounded-full pointer-events-none"></div>
          </div>

          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">
              Free forever. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
                Community supported.
              </span>
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Commentation is an open-source labor of love. No paywalls, no tracking, no VC money. 
              If this tool saved your team some time today, a coffee would mean the world to me.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <button className="px-8 py-4 bg-[#FFDD00] text-amber-900 rounded-full font-bold text-lg hover:bg-[#FFEA00] transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-yellow-500/20">
                <Coffee className="w-5 h-5" strokeWidth={3} />
                Buy me a coffee
              </button>
              <button className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                Become a Sponsor
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center md:justify-start gap-2 text-sm text-zinc-400">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 ring-2 ring-white dark:ring-zinc-900"></div>
                 ))}
              </div>
              <span className="ml-2">Join 42 other supporters</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
