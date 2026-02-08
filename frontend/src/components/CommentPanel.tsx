"use client";

import { useState } from "react";
import { X, Send, MessageSquare, Mail, ThumbsUp, ThumbsDown } from "lucide-react";
import type { CommentDoc } from "@/lib/firebase";

interface CommentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  sectionRef: string;
  comments: CommentDoc[];
  onAddComment: (text: string, userName: string, sectionRef: string) => void;
  onReact?: (commentId: string, reaction: "like" | "dislike") => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CommentPanel({
  isOpen,
  onClose,
  sectionName,
  sectionRef,
  comments,
  onAddComment,
  onReact,
}: CommentPanelProps) {
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      setEmailError("");
      return false;
    }
    if (!EMAIL_REGEX.test(val.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !validateEmail(email)) return;
    onAddComment(text.trim(), email.trim(), sectionRef);
    setText("");
  };

  const sectionComments = comments.filter((c) => c.section_reference === sectionRef);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-md z-50
          bg-zinc-900 border-l border-zinc-800 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-zinc-100">Discussion</h3>
              <p className="text-xs text-zinc-500">{sectionName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: "calc(100% - 200px)" }}>
          {sectionComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <MessageSquare className="h-10 w-10 mb-3" />
              <p className="text-sm">No comments yet for this section.</p>
              <p className="text-xs mt-1">Be the first to start the discussion!</p>
            </div>
          ) : (
            sectionComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl bg-zinc-800/60 p-4 border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-zinc-700 p-1.5">
                    <Mail className="h-3 w-3 text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">
                    {comment.user_name}
                  </span>
                  <span className="text-xs text-zinc-600 ml-auto">
                    {comment.timestamp.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-3">{comment.text}</p>
                {/* Like / Dislike */}
                <div className="flex items-center gap-3 border-t border-zinc-700/40 pt-2">
                  <button
                    onClick={() => onReact?.(comment.id, "like")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {comment.likes > 0 && <span>{comment.likes}</span>}
                  </button>
                  <button
                    onClick={() => onReact?.(comment.id, "dislike")}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => email.trim() && validateEmail(email)}
              placeholder="Your email"
              className={`w-full rounded-lg border ${emailError ? "border-red-500/60" : "border-zinc-700"} bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none`}
            />
            {emailError && (
              <p className="text-xs text-red-400 mt-1">{emailError}</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || !email.trim() || !EMAIL_REGEX.test(email.trim())}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send comment</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
