"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { ChatMessage } from "~~/hooks/michi";

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="mb-1.5 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1.5 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="link link-primary">
      {children}
    </a>
  ),
};

type ChatModalProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  placeholder: string;
  emptyState: string;
  suggestions?: string[];
  messages: ChatMessage[];
  isSending: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
};

/** Generic chat shell shared by Michi Sabio (consumidor) and Don Michi (comercio). */
export function ChatModal({
  title,
  subtitle,
  icon: Icon,
  placeholder,
  emptyState,
  suggestions,
  messages,
  isSending,
  onSend,
  onClose,
}: ChatModalProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = (text: string) => {
    if (!text.trim() || isSending) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box flex max-h-[85vh] max-w-lg flex-col overflow-hidden rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-content">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{title}</h2>
              <p className="text-xs text-base-content/60">{subtitle}</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose} aria-label="Cerrar chat">
            <X className="size-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="rounded-xl border border-dashed border-base-300 bg-base-200/50 p-3 text-xs text-base-content/60">
                {emptyState}
              </p>
              {suggestions && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => handleSend(s)}
                      disabled={isSending}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`chat ${m.role === "user" ? "chat-end" : "chat-start"}`}>
              <div
                className={`chat-bubble text-sm ${m.role === "user" ? "chat-bubble-primary" : "bg-base-200 text-base-content"}`}
              >
                {m.role === "model" ? <ReactMarkdown components={MARKDOWN_COMPONENTS}>{m.text}</ReactMarkdown> : m.text}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="chat chat-start">
              <div className="chat-bubble bg-base-200 text-base-content">
                <span className="loading loading-dots loading-sm" />
              </div>
            </div>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-base-300 px-4 py-3"
          onSubmit={e => {
            e.preventDefault();
            handleSend(draft);
          }}
        >
          <input
            type="text"
            className="input input-bordered input-sm flex-1"
            placeholder={placeholder}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            disabled={isSending}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSending || !draft.trim()}>
            <Send className="size-4" />
          </button>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
