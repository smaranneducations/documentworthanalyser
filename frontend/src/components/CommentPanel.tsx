"use client";

import { useState } from "react";
import { X, Send, MessageSquare, Mail, ThumbsUp, ThumbsDown, Star, User, Bot } from "lucide-react";
import type { CommentDoc } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

interface CommentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  sectionRef: string;
  comments: CommentDoc[];
  onAddComment: (
    text: string,
    userName: string,
    sectionRef: string,
    isStarred: boolean,
    commenterEmail: string | null,
    commenterUid: string | null,
  ) => void;
  onReact?: (commentId: string, reaction: "like" | "dislike") => void;
}

export default function CommentPanel({
  isOpen,
  onClose,
  sectionName,
  sectionRef,
  comments,
  onAddComment,
  onReact,
}: CommentPanelProps) {
  const { user, email, uid, signInWithGoogle } = useAuth();
  const [text, setText] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const postComment = (
    commentText: string,
    starred: boolean,
    userEmail: string | null,
    userUid: string | null,
  ) => {
    const userName = starred ? (userEmail ?? "User") : "Anonymous";
    onAddComment(
      commentText,
      userName,
      sectionRef,
      starred,
      starred ? userEmail : null,
      starred ? userUid : null,
    );
    setText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (isStarred && !user) {
      // Trigger Google popup — stay on the same page
      setSigningIn(true);
      try {
        const result = await signInWithGoogle();
        if (result?.user) {
          // User just logged in — post the comment with their new credentials
          postComment(text.trim(), true, result.user.email, result.user.uid);
        }
      } catch (err) {
        console.error("Sign-in cancelled or failed:", err);
      } finally {
        setSigningIn(false);
      }
      return;
    }

    postComment(text.trim(), isStarred, email ?? null, uid ?? null);
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

        {/* Starred info banner */}
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use <span className="text-amber-400 font-semibold">Starred comments</span> (requires Google login) to ensure an admin response within 7 working days. The admin will be notified by email and all follow-up replies on the thread will be sent to both you and the admin.
            </p>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: "calc(100% - 300px)" }}>
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
                className={`rounded-xl p-4 border ${
                  comment.is_auto_reply
                    ? "bg-blue-500/5 border-blue-500/20"
                    : comment.is_starred
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-zinc-800/60 border-zinc-700/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {comment.is_auto_reply ? (
                    <div className="rounded-full bg-blue-500/15 p-1.5">
                      <Bot className="h-3 w-3 text-blue-400" />
                    </div>
                  ) : comment.is_starred ? (
                    <div className="rounded-full bg-amber-500/15 p-1.5">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-zinc-700 p-1.5">
                      <User className="h-3 w-3 text-zinc-400" />
                    </div>
                  )}
                  <span className={`text-sm font-medium ${
                    comment.is_auto_reply ? "text-blue-300" : comment.is_starred ? "text-amber-200" : "text-zinc-200"
                  }`}>
                    {comment.is_auto_reply ? "DocDetector" : comment.is_starred ? comment.commenter_email : "Anonymous"}
                  </span>
                  {comment.is_auto_reply && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  )}
                  {comment.is_starred && !comment.is_auto_reply && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      Starred
                    </span>
                  )}
                  <span className="text-xs text-zinc-600 ml-auto">
                    {comment.timestamp.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed mb-3 ${comment.is_auto_reply ? "text-blue-200/80 italic" : "text-zinc-300"}`}>
                  {comment.text}
                </p>
                {/* Like / Dislike — not shown for auto-replies */}
                {!comment.is_auto_reply && (
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
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-4"
        >
          {/* Anonymous / Starred toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setIsStarred(false)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                !isStarred
                  ? "bg-zinc-700 text-zinc-200 border border-zinc-600"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Anonymous
            </button>
            <button
              type="button"
              onClick={() => setIsStarred(true)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                isStarred
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              Starred
            </button>
          </div>

          {/* Starred info text */}
          {isStarred && (
            <p className="text-[11px] text-amber-500/80 mb-2 leading-relaxed">
              {!user
                ? "Google sign-in will open when you submit."
                : <span className="text-zinc-400">Posting as {email}</span>
              }
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isStarred ? "Write a starred comment..." : "Write an anonymous comment..."}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || signingIn}
              className={`rounded-lg px-4 py-2 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${
                isStarred
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {signingIn ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send comment</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
