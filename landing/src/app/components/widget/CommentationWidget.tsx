import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for class names since we don't have the lib/utils file yet, 
// I'll inline a simple version or assuming the user might want me to create it.
// Actually, I should create a util file or just use `clsx` and `tailwind-merge` directly.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: Date;
  replies?: { text: string; author: string }[];
}

interface CommentationWidgetProps {
  children: React.ReactNode;
  isActive?: boolean;
}

export function CommentationWidget({ children, isActive = true }: CommentationWidgetProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      x: 20,
      y: 15,
      text: "This headline needs to be punchier.",
      author: "Sarah",
      createdAt: new Date(),
      replies: []
    },
    {
      id: '2',
      x: 65,
      y: 45,
      text: "Is this data real-time?",
      author: "Mike",
      createdAt: new Date(),
      replies: [{ text: "Yes, updates every 5s", author: "Dev" }]
    }
  ]);
  
  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null);
  const [inputText, setInputText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isActive) return;
    
    // Prevent adding a comment if clicking ON a comment
    if ((e.target as HTMLElement).closest('.comment-pin') || (e.target as HTMLElement).closest('.comment-dialog')) {
      return;
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setPendingComment({ x, y });
      setActiveCommentId(null);
      setInputText("");
    }
  };

  const handleAddComment = () => {
    if (!pendingComment || !inputText.trim()) return;
    
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      x: pendingComment.x,
      y: pendingComment.y,
      text: inputText,
      author: "You",
      createdAt: new Date(),
      replies: []
    };
    
    setComments([...comments, newComment]);
    setPendingComment(null);
    setInputText("");
  };

  const handleCancel = () => {
    setPendingComment(null);
    setInputText("");
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full h-full cursor-crosshair group", !isActive && "cursor-default")}
      onClick={handleContainerClick}
    >
      {children}
      
      {/* Floating tooltip following cursor - could be a nice touch but might be too heavy. 
          Instead, let's just use the standard cursor or a fixed tooltip. */}
      {isActive && (
         <div className="absolute top-4 right-4 z-50 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
           Click anywhere to comment
         </div>
      )}

      {/* Existing Pins */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="absolute z-40"
          style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
        >
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "comment-pin flex items-center justify-center w-8 h-8 -ml-4 -mt-4 rounded-full shadow-lg border-2 border-white transition-transform hover:scale-110",
              activeCommentId === comment.id ? "bg-indigo-600 text-white" : "bg-[#0d99ff] text-white"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setActiveCommentId(activeCommentId === comment.id ? null : comment.id);
              setPendingComment(null);
            }}
          >
            <span className="sr-only">View comment</span>
            {/* User avatar or initals */}
            <span className="text-xs font-bold">{comment.author[0]}</span>
          </motion.button>
          
          <AnimatePresence>
            {activeCommentId === comment.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="comment-dialog absolute left-6 top-6 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                      {comment.author[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{comment.author}</p>
                      <p className="text-xs text-zinc-500">Just now</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveCommentId(null)} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{comment.text}</p>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                   <div className="px-3 pb-3 space-y-2">
                     {comment.replies.map((reply, idx) => (
                       <div key={idx} className="flex gap-2 items-start text-sm">
                         <span className="font-semibold text-xs text-zinc-600 dark:text-zinc-400">{reply.author}:</span>
                         <span className="text-zinc-600 dark:text-zinc-400">{reply.text}</span>
                       </div>
                     ))}
                   </div>
                )}
                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Reply..." 
                    className="flex-1 bg-transparent text-sm outline-none px-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                  />
                  <button className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Pending Comment Input */}
      <AnimatePresence>
        {pendingComment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute z-50"
            style={{ left: `${pendingComment.x}%`, top: `${pendingComment.y}%` }}
          >
             <div className="comment-dialog w-72 -ml-36 mt-4 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
               <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                 <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">New Comment</span>
                 <button onClick={handleCancel} className="text-zinc-400 hover:text-zinc-600">
                   <X className="w-4 h-4" />
                 </button>
               </div>
               <div className="p-3">
                 <textarea
                   autoFocus
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder="Add a comment, mention someone..."
                   className="w-full h-20 text-sm resize-none outline-none text-zinc-800 dark:text-zinc-200 bg-transparent placeholder:text-zinc-400"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleAddComment();
                     }
                   }}
                 />
                 <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={handleAddComment}
                      disabled={!inputText.trim()}
                      className="bg-[#0d99ff] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      Post Comment
                    </button>
                 </div>
               </div>
             </div>
             
             {/* The pin indicator at the exact click spot */}
             <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#0d99ff] rounded-full ring-4 ring-blue-500/20 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
