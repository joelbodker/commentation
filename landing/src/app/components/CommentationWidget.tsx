import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, User, Check, Trash2, GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: {
    name: string;
    avatar?: string;
    color: string;
    initials: string;
  };
  createdAt: Date;
  replies?: { id: string; text: string; author: string }[];
  resolved?: boolean;
}

interface CommentationWidgetProps {
  children: React.ReactNode;
  active?: boolean;
}

// More "Dev-like" users
const CURRENT_USER = {
  name: "You",
  initials: "ME",
  color: "#3b82f6", // blue-500
};

export function CommentationWidget({ children, active = true }: CommentationWidgetProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      x: 62,
      y: 18,
      text: "Should we update this dependency version?",
      author: { name: "alex_dev", initials: "AD", color: "#8b5cf6" }, // violet
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      x: 35,
      y: 45,
      text: "The padding here is inconsistent with the design tokens.",
      author: { name: "sarah_ui", initials: "SU", color: "#ec4899" }, // pink
      createdAt: new Date(Date.now() - 7200000),
      resolved: false,
    }
  ]);

  const [pendingComment, setPendingComment] = useState<{ x: number; y: number } | null>(null);
  const [inputText, setInputText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!active) return;
    if ((e.target as HTMLElement).closest(".comment-interactive")) {
      return;
    }

    if (containerRef.current) {
      // We need to calculate position relative to the document or a fixed container?
      // Since the widget wraps the whole app, and the app scrolls, we want absolute positioning relative to the SCROLLABLE content.
      // But `e.clientY` is viewport relative.
      // If we use `getBoundingClientRect`, it gives viewport coordinates of the container.
      // If the container is the full page `div`, `rect.top` changes as we scroll (it becomes negative).
      // So `e.clientY - rect.top` gives the Y position relative to the top of the container content.
      // This is correct for absolute positioning inside the container.
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setPendingComment({ x, y });
      setActiveCommentId(null);
      setInputText("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !pendingComment) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      x: pendingComment.x,
      y: pendingComment.y,
      text: inputText,
      author: CURRENT_USER,
      createdAt: new Date(),
    };

    setComments([...comments, newComment]);
    setPendingComment(null);
    setInputText("");
  };

  const handleResolve = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  const handleDelete = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    setActiveCommentId(null);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full min-h-screen",
        active ? "cursor-crosshair" : "cursor-default"
      )}
      onClick={handleContainerClick}
    >
      {children}

      {/* Existing Comments */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="absolute z-50 comment-interactive"
          style={{ left: `${comment.x}%`, top: `${comment.y}%` }}
        >
          {/* Pin */}
          <div 
            className="relative -translate-x-1/2 -translate-y-1/2"
            onMouseEnter={() => setHoveredCommentId(comment.id)}
            onMouseLeave={() => setHoveredCommentId(null)}
            onClick={(e) => {
              e.stopPropagation();
              setActiveCommentId(activeCommentId === comment.id ? null : comment.id);
              setPendingComment(null);
            }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-8 h-8 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-2 border-white dark:border-zinc-900 transition-all",
                comment.resolved ? "bg-zinc-400 grayscale opacity-60" : ""
              )}
              style={{ backgroundColor: comment.resolved ? undefined : comment.author.color }}
            >
              <span className="text-[10px] font-bold text-white font-mono">{comment.author.initials}</span>
            </motion.div>
          </div>

          {/* Expanded Card */}
          <AnimatePresence>
            {activeCommentId === comment.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute top-6 left-0 z-50 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                   <div className="flex items-center gap-2">
                     <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: comment.author.color }}>
                        {comment.author.initials}
                     </span>
                     <span className="text-xs font-semibold text-zinc-900 dark:text-white font-mono">{comment.author.name}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <button onClick={() => handleResolve(comment.id)} className="p-1 text-zinc-400 hover:text-green-500 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(comment.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors">
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{comment.text}</p>
                </div>
                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <input 
                    type="text" 
                    placeholder="Reply..." 
                    className="w-full bg-transparent text-sm border-none outline-none px-2 py-1 text-zinc-900 dark:text-white placeholder-zinc-400 font-mono"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Pending Comment Form */}
      <AnimatePresence>
        {pendingComment && (
          <div 
            className="absolute z-50 comment-interactive"
            style={{ left: `${pendingComment.x}%`, top: `${pendingComment.y}%` }}
          >
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="absolute top-4 left-0 -translate-x-1/2 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                 <span className="text-xs font-semibold text-zinc-500 font-mono">NEW THREAD</span>
                 <button onClick={() => setPendingComment(null)} className="text-zinc-400 hover:text-zinc-600">
                   <X className="w-3 h-3" />
                 </button>
               </div>
               <form onSubmit={handleSubmit}>
                 <div className="p-3">
                   <textarea
                     autoFocus
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     placeholder="Type your comment..."
                     className="w-full text-sm resize-none outline-none text-zinc-900 dark:text-white bg-transparent placeholder:text-zinc-400 min-h-[80px]"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSubmit(e);
                       }
                     }}
                   />
                 </div>
                 <div className="p-2 flex justify-end bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
                    <button 
                      type="submit" 
                      disabled={!inputText.trim()}
                      className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Post
                    </button>
                 </div>
               </form>
             </motion.div>
             
             {/* Pending Dot */}
             <div className="w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-500/20 -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
