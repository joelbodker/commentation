import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<'title' | 'cursor' | 'click' | 'popup' | 'typing' | 'popupMouse' | 'popupClick' | 'fadeout' | 'done'>('title');
  const [typedTitle, setTypedTitle] = useState('');
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showTitleCursor, setShowTitleCursor] = useState(false); // true after 1.5s, so cursor can blink 3x before typing
  const titleRef = useRef<HTMLDivElement>(null);
  
  const titleText = "Commentation";
  const commentText = "i don't like this font, change it for something better.";
  
  // Show cursor after 1.5s, then it blinks 3 times before typing
  useEffect(() => {
    const id = setTimeout(() => setShowTitleCursor(true), 1500);
    return () => clearTimeout(id);
  }, []);

  // Old-school cursor blink: instant on/off, no fade
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Title typing animation - starts after 1.5s delay + 3 cursor blinks
  useEffect(() => {
    let index = 0;
    let typeInterval: NodeJS.Timeout;
    
    // 1.5s initial delay + 3 cursor blinks before first letter
    const blinkDuration = 3 * 530 * 2; // 3 blinks × 2 states × 530ms
    const startDelay = setTimeout(() => {
      typeInterval = setInterval(() => {
        if (index < titleText.length) {
          setTypedTitle(titleText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typeInterval);
        }
      }, 100); // Typing speed for title
    }, 1500 + blinkDuration);
    
    return () => {
      clearTimeout(startDelay);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, []);
  
  // Phase timing - 1.5s + 3 blinks + title typing + pauses
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const blinkDuration = 3 * 530 * 2; // 3 blinks
    const titleTypingDuration = 12 * 100; // 12 chars × 100ms
    
    // Mouse appears after: 1.5s + 3 blinks + title typing + short pause
    const cursorPhaseAt = 1500 + blinkDuration + titleTypingDuration + 600;
    timers.push(setTimeout(() => setPhase('cursor'), cursorPhaseAt));
    
    // Click animation
    timers.push(setTimeout(() => setPhase('click'), cursorPhaseAt + 1200));
    
    // Popup opens
    timers.push(setTimeout(() => setPhase('popup'), cursorPhaseAt + 1800));
    
    // Typing in popup starts 1s after popup opens
    timers.push(setTimeout(() => setPhase('typing'), cursorPhaseAt + 2800));
    
    return () => timers.forEach(clearTimeout);
  }, []);
  
  // Comment typing animation
  useEffect(() => {
    if (phase !== 'typing') return;
    
    let index = 0;
    let timeoutId: NodeJS.Timeout;
    
    const typeNext = () => {
      if (index >= commentText.length) {
        setTimeout(() => setPhase('popupMouse'), 800);
        return;
      }
      setTypedText(commentText.slice(0, index + 1));
      const char = commentText[index];
      index++;
      // Pause a little longer after comma
      const delay = char === ',' ? 400 : 65;
      timeoutId = setTimeout(typeNext, delay);
    };
    
    timeoutId = setTimeout(typeNext, 65);
    
    return () => clearTimeout(timeoutId);
  }, [phase, onComplete]);

  // Popup mouse: appear at text end → after 0.5s move to Post → click
  useEffect(() => {
    if (phase !== 'popupMouse') return;
    
    const t = setTimeout(() => setPhase('popupClick'), 500);
    return () => clearTimeout(t);
  }, [phase]);

  // Popup click: button press animation, wait 1.5s, fadeout
  useEffect(() => {
    if (phase !== 'popupClick') return;
    
    const timers: NodeJS.Timeout[] = [];
    // After 1.5 seconds, fade out
    timers.push(setTimeout(() => {
      setPhase('fadeout');
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 800);
    }, 1500));
    
    return () => timers.forEach(clearTimeout);
  }, [phase, onComplete]);
  
  if (phase === 'done') return null;
  
  // Show popup in popup phase or later
  const showPopup = phase === 'popup' || phase === 'typing' || phase === 'popupMouse' || phase === 'popupClick' || phase === 'fadeout';
  
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
        {/* Title: "Commentation" - typed letter by letter, fixed position (no movement) */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 1 }}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 'clamp(32px, 8vw, 72px)',
            fontWeight: 200,
            color: '#e8e8e8',
            letterSpacing: '0.02em',
            textTransform: 'lowercase',
            userSelect: 'none',
            position: 'relative',
            display: 'inline-block',
          }}
        >
          {/* Invisible full title reserves space - keeps container fixed width */}
          <span style={{ visibility: 'hidden', display: 'inline-block' }} aria-hidden>{titleText}</span>
          {/* Typed content overlaid at left - grows right within fixed container */}
          <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' }}>
            {typedTitle}
            {showTitleCursor && typedTitle.length < titleText.length && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(16px, 4vw, 36px)',
                  height: '0.85em',
                  background: '#e8e8e8',
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  opacity: cursorVisible ? 1 : 0,
                  transition: 'none',
                }}
              />
            )}
          </span>
          
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
                    New Comment
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
                    {(phase === 'typing' || phase === 'popup') && typedText.length < commentText.length && (
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
                  <motion.div
                    animate={
                      phase === 'popupClick'
                        ? { scale: [1, 0.92, 1], y: [0, 1, 0] }
                        : { scale: 1, y: 0 }
                    }
                    transition={
                      phase === 'popupClick'
                        ? { scale: { duration: 0.2, delay: 0.6 }, y: { duration: 0.2, delay: 0.6 } }
                        : {}
                    }
                    style={{
                      padding: '8px 16px',
                      background: (phase === 'popupClick' || phase === 'fadeout') ? '#0d99ff' : '#333',
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontWeight: 500,
                      color: '#fff',
                    }}
                  >
                    Post
                  </motion.div>
                </div>
                
                {/* Mouse cursor inside popup - appears at text end, moves to Post, clicks */}
                <AnimatePresence>
                  {(phase === 'popupMouse' || phase === 'popupClick') && (
                    <motion.div
                      initial={{ opacity: 0, x: 160, y: 95 }}
                      animate={
                        phase === 'popupMouse'
                          ? { opacity: 1, x: 160, y: 95 }
                          : phase === 'popupClick'
                            ? { opacity: 1, x: 290, y: 178, scale: [1, 0.85, 1] }
                            : {}
                      }
                      transition={
                        phase === 'popupMouse'
                          ? { duration: 0.3 }
                          : {
                              x: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                              y: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                              scale: { duration: 0.15, delay: 0.6 },
                            }
                      }
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        marginLeft: -5,
                        marginTop: -5,
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    >
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
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Skip link - bottom of page, fades in when cursor starts blinking */}
        <motion.button
          type="button"
          onClick={() => {
            setPhase('done');
            onComplete();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showTitleCursor ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#737373',
            fontWeight: 500,
          }}
        >
          skip
        </motion.button>

        {/* Animated cursor */}
        <AnimatePresence>
          {(phase === 'cursor' || phase === 'click') && (
            <motion.div
              initial={{ x: 200, y: 150, opacity: 0 }}
              animate={
                phase === 'cursor' 
                  ? { x: 0, y: 0, opacity: 1, scale: 1 }
                  : { x: 0, y: 0, opacity: 1, scale: [1, 0.8, 1] }
              }
              exit={{ opacity: 0 }}
              transition={
                phase === 'cursor'
                  ? { duration: 1, ease: [0.25, 0.1, 0.25, 1] }
                  : { scale: { duration: 0.2, ease: 'easeOut' } }
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
