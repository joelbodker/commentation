import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Coffee } from 'lucide-react';

export function Support() {
  const buttonRef = useRef<HTMLDivElement>(null);

  // 3D effect for Buy me a coffee button (more pronounced)
  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);
  const btnXSpring = useSpring(btnX, { stiffness: 300, damping: 20 });
  const btnYSpring = useSpring(btnY, { stiffness: 300, damping: 20 });
  const btnRotateX = useTransform(btnYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const btnRotateY = useTransform(btnXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  const btnScale = useTransform(
    [btnXSpring, btnYSpring],
    ([bx, by]) => 1 + Math.abs(bx) * 0.08 + Math.abs(by) * 0.08
  );

  const handleButtonMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    btnX.set((e.clientX - rect.left) / rect.width - 0.5);
    btnY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleButtonMouseLeave = () => {
    btnX.set(0);
    btnY.set(0);
  };

  return (
    <section className="py-32 px-6 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden flex items-center min-h-[70vh]">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
          
          {/* Avatar */}
          <div className="flex items-center justify-center shrink-0 -translate-y-6">
            <img 
              src="/creator.png"
              alt="Creator"
              className="w-96 h-96 object-contain object-top"
            />
          </div>

          {/* Text Content - to the right */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">
              Free forever. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
                Community supported.
              </span>
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Commentation is an open-source labor of love. No paywalls, no tracking, no VC money. 
              If this tool saved your team some time, a coffee is a great way to show your appreciation.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <motion.div
                ref={buttonRef}
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
                style={{
                  rotateX: btnRotateX,
                  rotateY: btnRotateY,
                  scale: btnScale,
                  transformStyle: "preserve-3d",
                }}
                className="inline-block perspective-1000"
              >
                <a
                  href="https://buymeacoffee.com/joelbodker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFDD00] text-amber-900 rounded-full font-bold text-lg hover:bg-[#FFEA00] transition-colors shadow-lg shadow-yellow-500/20"
                >
                  <Coffee className="w-5 h-5" strokeWidth={3} />
                  Buy me a coffee
                </a>
              </motion.div>
            </div>
            
            <div className="mt-8 flex items-center justify-center md:justify-start gap-2 text-sm text-zinc-400">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 ring-2 ring-white dark:ring-zinc-900"></div>
                 ))}
              </div>
              <span className="ml-2">Support the project</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
