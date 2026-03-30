"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationMeta {
  id: string;
  title: string;
  updated_at: string;
}

type ActiveTab = "coach" | "tracker";

const SECTION_LABELS = ["STATS", "LIFESTYLE", "FOOD", "SNACKS", "PLAN"];

// ─── Icons ───────────────────────────────────────────────────

function IconPlus({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconTrash({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconMenu({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  );
}

function IconSend({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
    </svg>
  );
}

function IconCamera({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

// ─── Small Components ────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white"
          style={{
            animation: "typing-dot 1s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function SectionProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1">
      {SECTION_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`hidden sm:block h-px w-3 ${done ? "bg-white" : "bg-border-primary"}`} />
            )}
            <span
              className={`text-[10px] font-mono tracking-widest transition-colors ${
                done ? "text-white" : active ? "text-white animate-pulse-dot" : "text-text-muted"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] px-4 py-3 ${
          isUser
            ? "bg-white text-black rounded-[2px]"
            : "bg-bg-card border border-border-primary rounded-[2px]"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-diet text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────

function Sidebar({
  user,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onSignOut,
  open,
  onClose,
}: {
  user: User;
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSignOut: () => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 z-40 h-dvh w-64 border-r border-border-primary bg-bg-secondary flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-auto`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-primary">
          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">Diet Coach</span>
          <button
            onClick={onNew}
            className="h-7 w-7 border border-border-accent flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-colors"
            title="New conversation"
          >
            <IconPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-[10px] font-mono text-text-muted text-center mt-8 px-4 uppercase tracking-wider">
              No sessions
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border ${
                c.id === activeId
                  ? "border-border-accent bg-bg-input"
                  : "border-transparent hover:bg-bg-hover"
              }`}
              onClick={() => onSelect(c.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.title}</p>
                <p className="text-[10px] font-mono text-text-muted">
                  {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center text-text-muted hover:text-white transition-all"
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-border-primary p-3">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="h-7 w-7 rounded-full grayscale"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">
                {user.user_metadata?.full_name || user.email}
              </p>
              <button
                onClick={onSignOut}
                className="text-[10px] font-mono text-text-muted hover:text-white transition-colors uppercase tracking-wider"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Diet Tracker (Image Recognition) ────────────────────────

function DietTracker() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      setResult(null);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            content += parsed.text;
            setResult(content);
          } catch {
            // skip
          }
        }
      }
    } catch {
      setResult("**Could not analyze this image.** Try a clearer photo of your meal.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase mb-2">
            Image Recognition
          </p>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Meal Scanner</h2>
          <p className="text-sm text-text-secondary mt-2">
            Snap a photo of your meal. AI identifies the food and estimates calories, protein, carbs, and fat.
          </p>
        </div>

        {!image ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="group border border-dashed border-border-accent hover:border-white/40 transition-colors cursor-pointer flex flex-col items-center justify-center py-20 px-8"
          >
            <IconCamera className="h-10 w-10 text-text-muted group-hover:text-white transition-colors mb-4" />
            <p className="text-xs font-mono text-text-muted group-hover:text-white transition-colors uppercase tracking-wider">
              Upload meal photo
            </p>
            <p className="text-[10px] text-text-muted mt-2">JPG, PNG, WEBP</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="relative border border-border-primary">
              <img
                src={image}
                alt="Meal"
                className="w-full max-h-80 object-cover grayscale-[30%]"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-2">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white"
                          style={{ animation: "typing-dot 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">
                      Analyzing
                    </p>
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="border border-border-primary bg-bg-card p-5 animate-fade-in">
                <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">
                  Analysis
                </p>
                <div className="prose-diet text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-muted hover:text-white transition-colors border-b border-text-muted hover:border-white pb-0.5"
            >
              Scan another meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero / Landing ──────────────────────────────────────────

function HeroSection({
  onStart,
  onSignIn,
  user,
}: {
  onStart: () => void;
  onSignIn: () => void;
  user: User | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <div className="animate-fade-in max-w-xl">
        <p className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase mb-6">
          AI-Powered Nutrition
        </p>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase mb-6">
          Diet
          <br />
          Coach
        </h1>

        <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-2 max-w-md mx-auto">
          Fully custom meal plans, macro targets, and a fat-loss strategy built around your life.
        </p>

        <p className="text-text-muted text-[11px] font-mono uppercase tracking-wider mb-12">
          No bland diets. No restriction. Just results.
        </p>

        {user ? (
          <button
            onClick={onStart}
            className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            Start My Plan
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onSignIn}
            className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        )}

        <div className="mt-20 flex items-center justify-center gap-12 text-center">
          {[
            { value: "10 MIN", label: "SETUP" },
            { value: "7 DAY", label: "MEAL PLAN" },
            { value: "100%", label: "PERSONAL" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-lg font-bold tracking-tight">{stat.value}</div>
              <div className="text-[9px] font-mono text-text-muted tracking-[0.2em] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [section, setSection] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>("coach");

  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || messages.length < 2) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      const title =
        messages.find((m) => m.role === "assistant")?.content.slice(0, 60).replace(/[#*_]/g, "").trim() ||
        "New Plan";

      if (activeConvoId) {
        fetch(`/api/conversations/${activeConvoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, title }),
        }).then(() => refreshConversations());
      } else {
        fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, title }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.id) setActiveConvoId(d.id);
            refreshConversations();
          });
      }
    }, 2000);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [messages, user, activeConvoId]);

  const refreshConversations = () => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => {});
  };

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isStreaming, scrollToBottom]);
  useEffect(() => { if (!isStreaming) inputRef.current?.focus(); }, [isStreaming]);

  const detectSection = useCallback((allMessages: Message[]) => {
    const full = allMessages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content.toLowerCase())
      .join(" ");

    if (full.includes("supplement") || full.includes("hydration target") || full.includes("timeline")) setSection(4);
    else if (full.includes("snack")) setSection(4);
    else if (full.includes("food preference") || full.includes("favourite meal") || full.includes("favorite meal")) setSection(3);
    else if (full.includes("lifestyle") || full.includes("job type") || full.includes("exercise")) setSection(2);
    else if (full.includes("stats") || full.includes("age") || full.includes("height") || full.includes("weight")) setSection(1);
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to get response");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let assistantContent = "";
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            } catch { /* skip */ }
          }
        }
        detectSection([...newMessages, { role: "assistant", content: assistantContent }]);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Something went wrong";
        setMessages((prev) => [...prev, { role: "assistant", content: `**Error:** ${msg}` }]);
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, detectSection],
  );

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStarted(false);
    setMessages([]);
    setActiveConvoId(null);
    setConversations([]);
  };

  const handleNewConversation = () => {
    setActiveConvoId(null);
    setMessages([]);
    setSection(0);
    setStarted(true);
    setActiveTab("coach");
    setSidebarOpen(false);
    setTimeout(() => {
      sendMessage("Hey, I want to get lean and build a nutrition plan. Let's go!");
    }, 300);
  };

  const handleSelectConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.conversation) {
        setActiveConvoId(id);
        setMessages(data.conversation.messages || []);
        setStarted(true);
        setActiveTab("coach");
        setSidebarOpen(false);
        detectSection(data.conversation.messages || []);
      }
    } catch { /* silent */ }
  };

  const handleDeleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeConvoId === id) {
      setActiveConvoId(null);
      setMessages([]);
      setStarted(false);
    }
    refreshConversations();
  };

  const handleStart = useCallback(() => {
    setStarted(true);
    setMessages([]);
    setActiveConvoId(null);
    setSection(0);
    setTimeout(() => {
      sendMessage("Hey, I want to get lean and build a nutrition plan. Let's go!");
    }, 300);
  }, [sendMessage]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase animate-pulse-dot">
          Loading
        </p>
      </div>
    );
  }

  if (!user || !started) {
    return <HeroSection onStart={handleStart} onSignIn={handleSignIn} user={user} />;
  }

  return (
    <div className="flex h-dvh">
      <Sidebar
        user={user}
        conversations={conversations}
        activeId={activeConvoId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onSignOut={handleSignOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-border-primary bg-bg-primary/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden h-8 w-8 border border-border-primary flex items-center justify-center text-text-muted hover:text-white transition-colors"
              >
                <IconMenu />
              </button>

              {/* Tabs */}
              <div className="flex items-center border border-border-primary">
                <button
                  onClick={() => setActiveTab("coach")}
                  className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${
                    activeTab === "coach" ? "bg-white text-black" : "text-text-muted hover:text-white"
                  }`}
                >
                  Coach
                </button>
                <button
                  onClick={() => setActiveTab("tracker")}
                  className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors flex items-center gap-1.5 ${
                    activeTab === "tracker" ? "bg-white text-black" : "text-text-muted hover:text-white"
                  }`}
                >
                  <IconCamera className="h-3 w-3" />
                  Tracker
                </button>
              </div>
            </div>

            {activeTab === "coach" && <SectionProgress current={section} />}

            {activeTab === "tracker" && (
              <span className="text-[10px] font-mono text-text-muted tracking-[0.15em] uppercase">
                Image Recognition
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        {activeTab === "tracker" ? (
          <DietTracker />
        ) : (
          <>
            <main className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-bg-card border border-border-primary px-4 py-3">
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </main>

            <footer className="sticky bottom-0 border-t border-border-primary bg-bg-primary/90 backdrop-blur-md">
              <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex items-end gap-3 px-4 py-3">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isStreaming ? "Processing..." : "Type your answer..."}
                    disabled={isStreaming}
                    rows={1}
                    className="w-full resize-none border border-border-primary bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-white/30 focus:outline-none transition-colors disabled:opacity-40"
                    style={{ maxHeight: "120px" }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = Math.min(target.scrollHeight, 120) + "px";
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center bg-white text-black transition-all hover:bg-gray-200 active:bg-gray-300 disabled:opacity-20 disabled:hover:bg-white"
                >
                  <IconSend />
                </button>
              </form>
              <div className="text-center pb-2">
                <span className="text-[9px] font-mono text-text-muted tracking-wider uppercase">
                  AI-generated — consult a professional
                </span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
