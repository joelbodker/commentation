import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'title' | 'cursor' | 'click' | 'popup' | 'typing' | 'fadeout' | 'done'>('title');
  const [typedTitle, setTypedTitle] = useState('');
  const [typedText, setTypedText] = useState('');
  const titleRef = useRef<HTMLDivElement>(null);
  
  const titleText = "Commentation";
  const commentText = "i don't like this font, change it for something better.";
  
  // Title typing animation - starts after 1.5s delay
  useEffect(() => {
    let index = 0;
    let typeInterval: NodeJS.Timeout;
    
    // Wait 1.5 seconds before starting to type
    const startDelay = setTimeout(() => {
      typeInterval = setInterval(() => {
        if (index < titleText.length) {
          setTypedTitle(titleText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
        }
      }, 100); // Typing speed for title
    }, 1500);
    
    return () => {
      clearTimeout(startDelay);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, []);
  
  // Phase timing - adjusted for 1.5s initial delay + title typing
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // 1.5s delay + title typing (12 chars * 100ms = 1200ms) + pause = 4000ms
    timers.push(setTimeout(() => setPhase('cursor'), 4000));
    
    // Cursor moves to title
    timers.push(setTimeout(() => setPhase('click'), 5200));
    
    // Click animation, then show comment box (popup phase)
    timers.push(setTimeout(() => setPhase('popup'), 5800));
    
    // Wait 1 second after popup opens before typing starts
    timers.push(setTimeout(() => setPhase('typing'), 6800));
    
    return () => timers.forEach(clearTimeout);
  }, []);
  
  // Comment typing animation
  useEffect(() => {
    if (phase !== 'typing') return;
    
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < commentText.length) {
        setTypedText(commentText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        // Wait longer after typing finishes before "clicking" Post
        setTimeout(() => {
          setPhase('fadeout');
          // After fade out, signal completion
          setTimeout(() => {
            setPhase('done');
            onComplete();
          }, 800);
        }, 1200); // More breathing room before Post
      }
    }, 65); // Slower typing speed (was 45ms)
    
    return () => clearInterval(typeInterval);
  }, [phase, onComplete]);
  
  if (phase === 'done') return null;
  
  // Show popup in popup phase or later
  const showPopup = phase === 'popup' || phase === 'typing' || phase === 'fadeout';
  
  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'fadeout' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Title: "Commentation" - typed letter by letter, left-aligned */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 1 }}
          style={{
            fontFamily: '"JMH Typewriter", "Courier New", Courier, monospace',
            fontSize: 'clamp(32px, 8vw, 72px)',
            fontWeight: 400, // Thinner weight
            color: '#e8e8e8',
            letterSpacing: '0.02em', // Slightly more spacing for lighter feel
            userSelect: 'none',
            position: 'relative',
            // Fixed width based on full title so it doesn't shift as letters appear
            width: 'max-content',
            minWidth: '12ch', // Reserve space for "Commentation" (12 chars)
            textAlign: 'left',
          }}
        >
          {/* Invisible full title to reserve space */}
          <span style={{ visibility: 'hidden', position: 'absolute' }}>{titleText}</span>
          {/* Typed title with old-school block cursor */}
          <span>{typedTitle}</span>
          {typedTitle.length < titleText.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.53, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                display: 'inline-block',
                width: 'clamp(16px, 4vw, 36px)',
                height: 'clamp(32px, 8vw, 72px)',
                background: '#e8e8e8',
                marginLeft: 2,
                verticalAlign: 'bottom',
              }}
            />
          )}
          
          {/* Blue pin that appears on click */}
          <AnimatePresence>
            {(phase === 'click' || showPopup) && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#0d99ff',
                  boxShadow: '0 0 0 3px rgba(13, 153, 255, 0.3)',
                }}
              />
            )}
          </AnimatePresence>
          
          {/* Comment composer popup */}
          <AnimatePresence>
            {showPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 'calc(50% + 24px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 340,
                  background: '#1a1a1a',
                  borderRadius: 12,
                  border: '1px solid #333',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#141414',
                }}>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: '#666', 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textTransform: 'uppercase', 
                    letterSpacing: '0.08em' 
                  }}>
                    New Thread
                  </span>
                  <span style={{ fontSize: 14, color: '#555', cursor: 'pointer' }}>×</span>
                </div>
                
                {/* Text area */}
                <div style={{ padding: 16 }}>
                  <div style={{
                    minHeight: 80,
                    fontSize: 14,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#e0e0e0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {typedText}
                    {(phase === 'typing' || phase === 'popup') && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                        style={{
                          display: 'inline-block',
                          width: 2,
                          height: 17,
                          background: '#0d99ff',
                          marginLeft: 1,
                          verticalAlign: 'text-bottom',
                        }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #333',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  background: '#141414',
                }}>
                  <div style={{
                    padding: '8px 16px',
                    background: phase === 'fadeout' ? '#0d99ff' : '#333',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: 500,
                    color: '#fff',
                    transition: 'background 0.2s',
                  }}>
                    Post
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Animated cursor */}
        <AnimatePresence>
          {(phase === 'cursor' || phase === 'click') && (
            <motion.div
              initial={{ x: 200, y: 150, opacity: 0 }}
              animate={
                phase === 'cursor' 
                  ? { x: 0, y: 0, opacity: 1 }
                  : { x: 0, y: 0, opacity: 1, scale: [1, 0.85, 1] }
              }
              exit={{ opacity: 0 }}
              transition={
                phase === 'cursor'
                  ? { duration: 1, ease: [0.25, 0.1, 0.25, 1] }
                  : { duration: 0.3 }
              }
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: -5,
                marginLeft: 10,
                pointerEvents: 'none',
              }}
            >
              {/* Cursor SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                  fill="#fff"
                  stroke="#000"
                  strokeWidth="1.5"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
