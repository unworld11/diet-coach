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

// ─── Types ───────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationMeta {
  id: string;
  title: string;
  updated_at: string;
}

type AppView = "hero" | "intake" | "chat" | "tracker";
type MainTab = "coach" | "plan" | "tracker" | "friends";

interface IntakeData {
  age: string;
  sex: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  goalWeight: string;
  pace: string;
  jobType: string;
  exerciseFreq: string;
  exerciseType: string;
  sleep: string;
  stress: string;
  alcohol: string;
  favMeals: string;
  hatedFoods: string;
  restrictions: string;
  cookingStyle: string;
  adventurous: string;
  currentSnacks: string;
  snackReason: string;
  snackPreference: string;
  lateNightSnack: string;
}

const EMPTY_INTAKE: IntakeData = {
  age: "", sex: "male", height: "", heightUnit: "cm", weight: "", weightUnit: "kg",
  goalWeight: "", pace: "steady", jobType: "", exerciseFreq: "", exerciseType: "",
  sleep: "", stress: "moderate", alcohol: "", favMeals: "", hatedFoods: "",
  restrictions: "", cookingStyle: "quick", adventurous: "5", currentSnacks: "",
  snackReason: "hunger", snackPreference: "both", lateNightSnack: "no",
};

// ─── Icons ───────────────────────────────────────────────────

function IconPlus({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
}
function IconTrash({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
}
function IconMenu({ className = "h-5 w-5" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>);
}
function IconSend({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>);
}
function IconCamera({ className = "h-5 w-5" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.315z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>);
}
function IconArrow({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>);
}
function IconUsers({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>);
}
function IconCopy({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>);
}

// ─── Shared Form Components ──────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-mono text-text-muted tracking-[0.15em] uppercase">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-bg-input border border-border-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-white/30 focus:outline-none transition-colors";
const selectClass = inputClass + " appearance-none cursor-pointer";

function Pills({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
            value === o.value ? "bg-white text-black border-white" : "border-border-accent text-text-muted hover:text-white hover:border-white/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Intake Form ─────────────────────────────────────────────

const INTAKE_STEPS = ["STATS", "LIFESTYLE", "FOOD", "SNACKS"];

function IntakeForm({ onComplete }: { onComplete: (data: IntakeData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(EMPTY_INTAKE);

  const set = (field: keyof IntakeData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setData((d) => ({ ...d, [field]: e.target.value }));

  const setVal = (field: keyof IntakeData, value: string) =>
    setData((d) => ({ ...d, [field]: value }));

  const next = () => step < 3 ? setStep(step + 1) : onComplete(data);
  const back = () => step > 0 && setStep(step - 1);

  const canProceed = () => {
    switch (step) {
      case 0: return data.age && data.height && data.weight;
      case 1: return data.jobType && data.exerciseFreq;
      case 2: return data.favMeals;
      case 3: return data.currentSnacks;
      default: return true;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Progress */}
        <div className="flex items-center justify-between mb-10">
          {INTAKE_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-6 sm:w-10 ${i <= step ? "bg-white" : "bg-border-primary"}`} />}
              <span className={`text-[10px] font-mono tracking-[0.15em] ${
                i < step ? "text-white" : i === step ? "text-white" : "text-text-muted"
              }`}>
                {i < step ? "✓" : `0${i + 1}`} {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 0: Stats */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in" key="s0">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-1">Your Stats</h2>
            <p className="text-xs text-text-secondary mb-6">The basics — so we can calculate your calories.</p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Age">
                <input type="number" placeholder="25" value={data.age} onChange={set("age")} className={inputClass} />
              </Field>
              <Field label="Biological Sex">
                <Pills options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} value={data.sex} onChange={(v) => setVal("sex", v)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Height">
                <div className="flex gap-2">
                  <input type="number" placeholder="180" value={data.height} onChange={set("height")} className={inputClass + " flex-1"} />
                  <Pills options={[{ value: "cm", label: "CM" }, { value: "ft", label: "FT" }]} value={data.heightUnit} onChange={(v) => setVal("heightUnit", v)} />
                </div>
              </Field>
              <Field label="Weight">
                <div className="flex gap-2">
                  <input type="number" placeholder="85" value={data.weight} onChange={set("weight")} className={inputClass + " flex-1"} />
                  <Pills options={[{ value: "kg", label: "KG" }, { value: "lbs", label: "LBS" }]} value={data.weightUnit} onChange={(v) => setVal("weightUnit", v)} />
                </div>
              </Field>
            </div>

            <Field label="Goal Weight (optional)">
              <input type="text" placeholder="75kg or 'visible abs'" value={data.goalWeight} onChange={set("goalWeight")} className={inputClass} />
            </Field>

            <Field label="Pace">
              <Pills
                options={[
                  { value: "steady", label: "Steady & Sustainable" },
                  { value: "moderate", label: "Moderate" },
                  { value: "aggressive", label: "As Fast As Possible" },
                ]}
                value={data.pace}
                onChange={(v) => setVal("pace", v)}
              />
            </Field>
          </div>
        )}

        {/* Step 1: Lifestyle */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in" key="s1">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-1">Lifestyle</h2>
            <p className="text-xs text-text-secondary mb-6">Your daily routine shapes your calorie needs.</p>

            <Field label="Job Type">
              <Pills
                options={[
                  { value: "desk", label: "Desk Job" },
                  { value: "on-feet", label: "On My Feet" },
                  { value: "manual", label: "Manual Labour" },
                  { value: "mixed", label: "Mixed" },
                ]}
                value={data.jobType}
                onChange={(v) => setVal("jobType", v)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Workouts / Week">
                <input type="number" placeholder="4" value={data.exerciseFreq} onChange={set("exerciseFreq")} className={inputClass} />
              </Field>
              <Field label="Type of Exercise">
                <input type="text" placeholder="Weights, running, etc." value={data.exerciseType} onChange={set("exerciseType")} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours of Sleep">
                <input type="number" placeholder="7" value={data.sleep} onChange={set("sleep")} className={inputClass} />
              </Field>
              <Field label="Stress Level">
                <Pills
                  options={[
                    { value: "low", label: "Low" },
                    { value: "moderate", label: "Moderate" },
                    { value: "high", label: "High" },
                  ]}
                  value={data.stress}
                  onChange={(v) => setVal("stress", v)}
                />
              </Field>
            </div>

            <Field label="Alcohol (per week)">
              <input type="text" placeholder="e.g. 4-5 beers on weekends, or none" value={data.alcohol} onChange={set("alcohol")} className={inputClass} />
            </Field>
          </div>
        )}

        {/* Step 2: Food */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in" key="s2">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-1">Food Preferences</h2>
            <p className="text-xs text-text-secondary mb-6">Your favourite foods make the plan something you actually want to eat.</p>

            <Field label="Top 5 Favourite Meals / Dishes">
              <textarea placeholder="e.g. Chicken tikka masala, spaghetti bolognese, steak and chips, sushi, burgers" value={data.favMeals} onChange={set("favMeals")} rows={3} className={inputClass + " resize-none"} />
            </Field>

            <Field label="Foods You Hate">
              <input type="text" placeholder="e.g. mushrooms, olives, liver" value={data.hatedFoods} onChange={set("hatedFoods")} className={inputClass} />
            </Field>

            <Field label="Dietary Restrictions / Allergies">
              <input type="text" placeholder="e.g. vegetarian, dairy-free, nut allergy, or none" value={data.restrictions} onChange={set("restrictions")} className={inputClass} />
            </Field>

            <Field label="Cooking Style">
              <Pills
                options={[
                  { value: "scratch", label: "From Scratch" },
                  { value: "quick", label: "Quick Meals" },
                  { value: "batch", label: "Batch Prep" },
                ]}
                value={data.cookingStyle}
                onChange={(v) => setVal("cookingStyle", v)}
              />
            </Field>

            <Field label="Food Adventurousness (1-10)">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={data.adventurous}
                  onChange={set("adventurous")}
                  className="flex-1 accent-white"
                />
                <span className="text-sm font-mono w-6 text-center">{data.adventurous}</span>
              </div>
            </Field>
          </div>
        )}

        {/* Step 3: Snacks */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in" key="s3">
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-1">Snack Habits</h2>
            <p className="text-xs text-text-secondary mb-6">We'll find smarter swaps that still hit the spot.</p>

            <Field label="Current Snacks">
              <textarea placeholder="e.g. crisps, chocolate bars, biscuits, protein bars" value={data.currentSnacks} onChange={set("currentSnacks")} rows={2} className={inputClass + " resize-none"} />
            </Field>

            <Field label="Why Do You Snack?">
              <Pills
                options={[
                  { value: "hunger", label: "Hunger" },
                  { value: "boredom", label: "Boredom" },
                  { value: "habit", label: "Habit" },
                  { value: "mixed", label: "All of the above" },
                ]}
                value={data.snackReason}
                onChange={(v) => setVal("snackReason", v)}
              />
            </Field>

            <Field label="Sweet, Savoury, or Both?">
              <Pills
                options={[
                  { value: "sweet", label: "Sweet" },
                  { value: "savoury", label: "Savoury" },
                  { value: "both", label: "Both" },
                ]}
                value={data.snackPreference}
                onChange={(v) => setVal("snackPreference", v)}
              />
            </Field>

            <Field label="Late Night Snacking?">
              <Pills
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "sometimes", label: "Sometimes" },
                  { value: "no", label: "No" },
                ]}
                value={data.lateNightSnack}
                onChange={(v) => setVal("lateNightSnack", v)}
              />
            </Field>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          {step > 0 ? (
            <button onClick={back} className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-muted hover:text-white transition-colors">
              Back
            </button>
          ) : <div />}

          <button
            onClick={next}
            disabled={!canProceed()}
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-20 disabled:hover:bg-white"
          >
            {step < 3 ? "Continue" : "Generate My Plan"}
            <IconArrow className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small Chat Components ───────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white"
          style={{ animation: "typing-dot 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 ${
        isUser ? "bg-white text-black rounded-[2px]" : "bg-bg-card border border-border-primary rounded-[2px]"
      }`}>
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

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
type Weekday = typeof WEEKDAYS[number];

function parsePlanByDay(text: string): { intro: string; days: Partial<Record<Weekday, string>> } {
  const lines = text.split("\n");
  const dayRegex = new RegExp(`^#{1,6}\\s*(${WEEKDAYS.join("|")})\\b`, "i");
  const days: Partial<Record<Weekday, string[]>> = {};
  let current: Weekday | null = null;
  const intro: string[] = [];

  for (const line of lines) {
    const match = line.match(dayRegex);
    if (match) {
      const matched = WEEKDAYS.find((d) => d.toLowerCase() === match[1].toLowerCase());
      current = matched ?? null;
      if (current && !days[current]) days[current] = [];
      continue;
    }
    if (current) {
      days[current]?.push(line);
    } else {
      intro.push(line);
    }
  }

  return {
    intro: intro.join("\n").trim(),
    days: Object.fromEntries(
      Object.entries(days).map(([day, content]) => [day, (content || []).join("\n").trim()]),
    ) as Partial<Record<Weekday, string>>,
  };
}

function DietPlanView({ messages }: { messages: Message[] }) {
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const content = lastAssistantMessage?.content ?? "";
  const parsed = parsePlanByDay(content);
  const hasWeeklyPlan = WEEKDAYS.some((day) => !!parsed.days[day]);
  const [selectedDay, setSelectedDay] = useState<Weekday>(() => {
    const today = new Date().toLocaleDateString(undefined, { weekday: "long" });
    return (WEEKDAYS.find((d) => d === today) ?? "Monday") as Weekday;
  });

  useEffect(() => {
    const today = new Date().toLocaleDateString(undefined, { weekday: "long" });
    const fallback = (WEEKDAYS.find((d) => parsed.days[d]) ?? "Monday") as Weekday;
    setSelectedDay(((WEEKDAYS.find((d) => d === today && parsed.days[d]) ?? fallback) as Weekday));
  }, [content]);

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase">Generate a plan first in chat</p>
      </div>
    );
  }

  if (!hasWeeklyPlan) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="border border-border-primary bg-bg-card p-5 prose-diet text-sm animate-fade-in">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4 animate-fade-in">
        <div className="border border-border-primary bg-bg-card p-4">
          <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">
            Weekly Plan (auto-selected for today)
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                disabled={!parsed.days[day]}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${
                  selectedDay === day ? "bg-white text-black" : "border border-border-primary text-text-muted hover:text-white"
                } disabled:opacity-30 disabled:hover:text-text-muted`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {parsed.intro && (
          <div className="border border-border-primary bg-bg-card p-5 prose-diet text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.intro}</ReactMarkdown>
          </div>
        )}

        <div className="border border-border-primary bg-bg-card p-5">
          <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">{selectedDay}</p>
          <div className="prose-diet text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {parsed.days[selectedDay] || "_No dedicated plan section found for this day._"}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────

function Sidebar({ user, conversations, activeId, onSelect, onNew, onDelete, onSignOut, open, onClose }: {
  user: User; conversations: ConversationMeta[]; activeId: string | null;
  onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void;
  onSignOut: () => void; open: boolean; onClose: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-40 h-dvh w-64 border-r border-border-primary bg-bg-secondary flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:z-auto`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-primary">
          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase">Diet Coach</span>
          <button onClick={onNew} className="h-7 w-7 border border-border-accent flex items-center justify-center text-text-muted hover:text-white hover:border-white transition-colors" title="New plan">
            <IconPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-[10px] font-mono text-text-muted text-center mt-8 px-4 uppercase tracking-wider">No sessions</p>
          )}
          {conversations.map((c) => (
            <div key={c.id} className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border ${c.id === activeId ? "border-border-accent bg-bg-input" : "border-transparent hover:bg-bg-hover"}`} onClick={() => onSelect(c.id)}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{c.title}</p>
                <p className="text-[10px] font-mono text-text-muted">{new Date(c.updated_at).toLocaleDateString()}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center text-text-muted hover:text-white transition-all">
                <IconTrash />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-border-primary p-3">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-7 w-7 rounded-full grayscale" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
              <button onClick={onSignOut} className="text-[10px] font-mono text-text-muted hover:text-white transition-colors uppercase tracking-wider">Sign out</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Diet Tracker ────────────────────────────────────────────

// ─── Meal log types ──────────────────────────────────────────

interface MealLog {
  id: string;
  logged_at: string;
  meal_type: string;
  label: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url: string | null;
  notes: string | null;
  source: string;
}

interface ParsedMacros {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
}

function guessMealType(): string {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function friendlyTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseMacrosTag(text: string): ParsedMacros | null {
  const start = text.indexOf("<!--MACROS:");
  const end = text.indexOf("-->", start);
  if (start === -1 || end === -1) return null;
  const json = text.slice(start + 11, end);
  try { return JSON.parse(json); } catch { return null; }
}

function IconChevron({ className = "h-4 w-4", dir = "left" }: { className?: string; dir?: "left" | "right" }) {
  return dir === "left"
    ? <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
    : <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
}

function IconClock({ className = "h-4 w-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function DietTracker({ user }: { user: User | null }) {
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);

  // scanner state
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanMacros, setScanMacros] = useState<ParsedMacros | null>(null);
  const [scanSaved, setScanSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // manual add state
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    label: "", calories: "", protein: "", carbs: "", fat: "",
    meal_type: guessMealType(), logged_at: "",
  });
  const [manualMode, setManualMode] = useState<"ai" | "manual">("ai");
  const [aiDesc, setAiDesc] = useState("");
  const [aiEstimating, setAiEstimating] = useState(false);

  // sub-view: "log" | "scan" | "manual"
  const [subView, setSubView] = useState<"log" | "scan" | "manual">("log");

  const fetchMeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meals?date=${selectedDate}`);
      if (res.ok) { const data = await res.json(); setMeals(data.meals || []); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user, selectedDate]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const totals = meals.reduce(
    (acc, m) => ({ cal: acc.cal + m.calories, pro: acc.pro + m.protein, carb: acc.carb + m.carbs, fat: acc.fat + m.fat }),
    { cal: 0, pro: 0, carb: 0, fat: 0 },
  );

  // date navigation
  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };
  const isToday = selectedDate === formatDate(new Date());
  const dateLabel = isToday ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  // scanner
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { const b = reader.result as string; setImage(b); setScanResult(null); setScanMacros(null); setScanSaved(false); analyzeImage(b); };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: base64 }) });
      if (!res.ok) throw new Error("Analysis failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
          const d = line.slice(6);
          if (d === "[DONE]") break;
          try { content += JSON.parse(d).text; setScanResult(content); } catch { /* skip */ }
        }
      }
      const macros = parseMacrosTag(content);
      if (macros) setScanMacros(macros);
    } catch { setScanResult("**Could not analyze this image.** Try a clearer photo."); }
    finally { setAnalyzing(false); }
  };

  const saveScan = async () => {
    if (!scanMacros || scanSaved) return;
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logged_at: new Date().toISOString(),
        meal_type: guessMealType(),
        label: scanMacros.label,
        items: scanMacros.items,
        calories: scanMacros.calories,
        protein: scanMacros.protein,
        carbs: scanMacros.carbs,
        fat: scanMacros.fat,
        source: "scan",
      }),
    });
    setScanSaved(true);
    fetchMeals();
  };

  const resetScan = () => { setImage(null); setScanResult(null); setScanMacros(null); setScanSaved(false); if (fileRef.current) fileRef.current.value = ""; };

  const estimateWithAi = async () => {
    if (!aiDesc.trim()) return;
    setAiEstimating(true);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDesc }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setManualForm((prev) => ({
        ...prev,
        label: data.label || aiDesc,
        calories: String(data.calories || 0),
        protein: String(data.protein || 0),
        carbs: String(data.carbs || 0),
        fat: String(data.fat || 0),
      }));
    } catch { /* keep form as-is */ }
    finally { setAiEstimating(false); }
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const loggedAt = manualForm.logged_at
      ? new Date(manualForm.logged_at).toISOString()
      : new Date().toISOString();
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logged_at: loggedAt,
        meal_type: manualForm.meal_type,
        label: manualForm.label,
        items: [],
        calories: parseInt(manualForm.calories) || 0,
        protein: parseFloat(manualForm.protein) || 0,
        carbs: parseFloat(manualForm.carbs) || 0,
        fat: parseFloat(manualForm.fat) || 0,
        source: "manual",
      }),
    });
    setManualForm({ label: "", calories: "", protein: "", carbs: "", fat: "", meal_type: guessMealType(), logged_at: "" });
    setSubView("log");
    fetchMeals();
  };

  const deleteMeal = async (id: string) => {
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-6">

        {/* ── Date picker + daily totals ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => shiftDate(-1)} className="h-8 w-8 border border-border-primary flex items-center justify-center text-text-muted hover:text-white transition-colors"><IconChevron dir="left" /></button>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-wider">{dateLabel}</p>
              <p className="text-[10px] font-mono text-text-muted tracking-wider">{selectedDate}</p>
            </div>
            <button onClick={() => shiftDate(1)} disabled={isToday} className="h-8 w-8 border border-border-primary flex items-center justify-center text-text-muted hover:text-white transition-colors disabled:opacity-20"><IconChevron dir="right" /></button>
          </div>

          {/* Macro summary bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Calories", val: totals.cal, unit: "kcal", color: "bg-white" },
              { label: "Protein", val: totals.pro.toFixed(0), unit: "g", color: "bg-white/70" },
              { label: "Carbs", val: totals.carb.toFixed(0), unit: "g", color: "bg-white/50" },
              { label: "Fat", val: totals.fat.toFixed(0), unit: "g", color: "bg-white/30" },
            ].map((m) => (
              <div key={m.label} className="border border-border-primary p-3 text-center">
                <p className="text-[9px] font-mono text-text-muted tracking-[0.15em] uppercase">{m.label}</p>
                <p className="text-lg font-bold mt-0.5">{m.val}</p>
                <p className="text-[9px] text-text-muted">{m.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sub-nav ── */}
        <div className="flex items-center gap-2 mb-5 border-b border-border-primary pb-3">
          {([
            { key: "log", label: "Daily Log" },
            { key: "scan", label: "Scan Meal" },
            { key: "manual", label: "Add Manually" },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setSubView(t.key)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${subView === t.key ? "bg-white text-black" : "text-text-muted hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Daily Log ── */}
        {subView === "log" && (
          <div className="space-y-2 animate-fade-in">
            {loading ? (
              <p className="text-xs font-mono text-text-muted text-center py-8 uppercase tracking-wider">Loading...</p>
            ) : meals.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border-accent">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">No meals logged</p>
                <p className="text-[10px] text-text-muted">Scan a meal or add one manually</p>
              </div>
            ) : (
              meals.map((meal) => (
                <div key={meal.id} className="border border-border-primary bg-bg-card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono text-black bg-white px-1.5 py-0.5 uppercase tracking-wider">{meal.meal_type}</span>
                      <span className="text-[10px] text-text-muted font-mono flex items-center gap-1"><IconClock className="h-3 w-3" />{friendlyTime(meal.logged_at)}</span>
                      {meal.source === "scan" && <span className="text-[9px] font-mono text-text-muted border border-border-accent px-1 py-0.5 uppercase">AI</span>}
                    </div>
                    <p className="text-sm font-medium truncate">{meal.label || "Meal"}</p>
                    <div className="flex gap-3 mt-1.5 text-[10px] font-mono text-text-secondary">
                      <span>{meal.calories} kcal</span>
                      <span>P {meal.protein}g</span>
                      <span>C {meal.carbs}g</span>
                      <span>F {meal.fat}g</span>
                    </div>
                  </div>
                  <button onClick={() => deleteMeal(meal.id)} className="text-text-muted hover:text-white transition-colors mt-1"><IconTrash /></button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Scan Meal ── */}
        {subView === "scan" && (
          <div className="animate-fade-in">
            {!image ? (
              <div onClick={() => fileRef.current?.click()} className="group border border-dashed border-border-accent hover:border-white/40 transition-colors cursor-pointer flex flex-col items-center justify-center py-20 px-8">
                <IconCamera className="h-10 w-10 text-text-muted group-hover:text-white transition-colors mb-4" />
                <p className="text-xs font-mono text-text-muted group-hover:text-white transition-colors uppercase tracking-wider">Upload meal photo</p>
                <p className="text-[10px] text-text-muted mt-2">JPG, PNG, WEBP</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative border border-border-primary">
                  <img src={image} alt="Meal" className="w-full max-h-80 object-cover grayscale-[30%]" />
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 justify-center mb-2">
                          {[0, 1, 2].map((i) => (<span key={i} className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-white" style={{ animation: "typing-dot 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />))}
                        </div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-secondary">Analyzing</p>
                      </div>
                    </div>
                  )}
                </div>
                {scanResult && (
                  <div className="border border-border-primary bg-bg-card p-5 animate-fade-in">
                    <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">Analysis</p>
                    <div className="prose-diet text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{scanResult.replace(/<!--MACROS:.*?-->/, "")}</ReactMarkdown></div>
                  </div>
                )}
                {scanMacros && !scanSaved && (
                  <button onClick={saveScan} className="w-full py-3 bg-white text-black text-xs font-mono uppercase tracking-[0.15em] hover:bg-gray-200 transition-colors">
                    Save to today&apos;s log — {scanMacros.calories} kcal
                  </button>
                )}
                {scanSaved && (
                  <p className="text-xs font-mono text-text-secondary text-center uppercase tracking-wider py-2">Saved to log</p>
                )}
                <button onClick={resetScan} className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-muted hover:text-white transition-colors border-b border-text-muted hover:border-white pb-0.5">Scan another meal</button>
              </div>
            )}
          </div>
        )}

        {/* ── Manual Add ── */}
        {subView === "manual" && (
          <div className="space-y-4 animate-fade-in">
            {/* AI / Manual toggle */}
            <div className="flex items-center border border-border-primary w-fit">
              <button type="button" onClick={() => setManualMode("ai")}
                className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${manualMode === "ai" ? "bg-white text-black" : "text-text-muted hover:text-white"}`}>
                AI Detect
              </button>
              <button type="button" onClick={() => setManualMode("manual")}
                className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${manualMode === "manual" ? "bg-white text-black" : "text-text-muted hover:text-white"}`}>
                Enter Manually
              </button>
            </div>

            {/* AI description input */}
            {manualMode === "ai" && (
              <div className="space-y-3">
                <Field label="Describe your meal">
                  <textarea value={aiDesc} onChange={(e) => setAiDesc(e.target.value)}
                    placeholder="e.g. 2 eggs, toast with butter, black coffee"
                    rows={3} className={inputClass + " resize-none"} />
                </Field>
                <button type="button" onClick={estimateWithAi} disabled={!aiDesc.trim() || aiEstimating}
                  className="w-full py-2.5 border border-white text-xs font-mono uppercase tracking-[0.15em] transition-colors hover:bg-white hover:text-black disabled:opacity-30">
                  {aiEstimating ? "Estimating..." : "Estimate Macros"}
                </button>
                {manualForm.calories && (
                  <div className="border border-border-accent bg-bg-card p-3 text-xs font-mono space-y-1 animate-fade-in">
                    <p className="text-text-secondary uppercase tracking-wider text-[9px] mb-2">AI Estimate — edit below if needed</p>
                  </div>
                )}
              </div>
            )}

            {/* Shared form fields */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Field label="Meal name">
                <input value={manualForm.label} onChange={(e) => setManualForm({ ...manualForm, label: e.target.value })} placeholder="e.g. Chicken rice bowl" className={inputClass} required />
              </Field>
              <Field label="Meal type">
                <Pills
                  options={[
                    { value: "breakfast", label: "Breakfast" },
                    { value: "lunch", label: "Lunch" },
                    { value: "snack", label: "Snack" },
                    { value: "dinner", label: "Dinner" },
                  ]}
                  value={manualForm.meal_type}
                  onChange={(v) => setManualForm({ ...manualForm, meal_type: v })}
                />
              </Field>
              <Field label="Date & time (leave blank for now)">
                <input type="datetime-local" value={manualForm.logged_at} onChange={(e) => setManualForm({ ...manualForm, logged_at: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Calories (kcal)">
                  <input type="number" value={manualForm.calories} onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })} placeholder="0" className={inputClass} required />
                </Field>
                <Field label="Protein (g)">
                  <input type="number" step="0.1" value={manualForm.protein} onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })} placeholder="0" className={inputClass} />
                </Field>
                <Field label="Carbs (g)">
                  <input type="number" step="0.1" value={manualForm.carbs} onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })} placeholder="0" className={inputClass} />
                </Field>
                <Field label="Fat (g)">
                  <input type="number" step="0.1" value={manualForm.fat} onChange={(e) => setManualForm({ ...manualForm, fat: e.target.value })} placeholder="0" className={inputClass} />
                </Field>
              </div>
              <button type="submit" className="w-full py-3 bg-white text-black text-xs font-mono uppercase tracking-[0.15em] hover:bg-gray-200 transition-colors">
                Add Meal
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Friends ─────────────────────────────────────────────────

interface FriendData {
  user_id: string;
  display_name: string;
  share_code: string;
  today: { calories: number; protein: number; carbs: number; fat: number };
}

function FriendsView({ user }: { user: User | null }) {
  const [profile, setProfile] = useState<{ share_code: string; display_name: string } | null>(null);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [addStatus, setAddStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pRes, fRes] = await Promise.all([fetch("/api/profile"), fetch("/api/friends")]);
      if (pRes.ok) { const d = await pRes.json(); setProfile(d.profile); }
      if (fRes.ok) { const d = await fRes.json(); setFriends(d.friends || []); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyCode = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.share_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addFriend = async () => {
    if (!code.trim()) return;
    setAddStatus(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddStatus({ type: "ok", msg: `Added ${data.friend_name}` });
        setCode("");
        fetchData();
      } else {
        setAddStatus({ type: "err", msg: data.error || "Failed" });
      }
    } catch { setAddStatus({ type: "err", msg: "Network error" }); }
  };

  const removeFriend = async (friendUserId: string) => {
    await fetch(`/api/friends/${friendUserId}`, { method: "DELETE" });
    setFriends((prev) => prev.filter((f) => f.user_id !== friendUserId));
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase animate-pulse">Loading</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">

        {/* Your share code */}
        {profile && (
          <div className="border border-border-primary bg-bg-card p-5">
            <p className="text-[9px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">Your Share Code</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tracking-[0.2em] font-mono uppercase">{profile.share_code}</span>
              <button onClick={copyCode} className="h-8 w-8 border border-border-primary flex items-center justify-center text-text-muted hover:text-white transition-colors">
                <IconCopy className="h-3.5 w-3.5" />
              </button>
              {copied && <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider">Copied</span>}
            </div>
            <p className="text-[10px] text-text-muted mt-2">Share this code with friends so they can see your daily macros</p>
          </div>
        )}

        {/* Add friend */}
        <div className="border border-border-primary bg-bg-card p-5">
          <p className="text-[9px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">Add Friend</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); setAddStatus(null); }}
              placeholder="Enter friend's code"
              className={inputClass + " flex-1"}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFriend(); } }}
            />
            <button onClick={addFriend} disabled={!code.trim()}
              className="px-4 py-2.5 bg-white text-black text-[10px] font-mono uppercase tracking-[0.15em] hover:bg-gray-200 transition-colors disabled:opacity-30">
              Add
            </button>
          </div>
          {addStatus && (
            <p className={`text-[10px] font-mono mt-2 uppercase tracking-wider ${addStatus.type === "ok" ? "text-text-secondary" : "text-red-400"}`}>
              {addStatus.msg}
            </p>
          )}
        </div>

        {/* Friends list */}
        <div>
          <p className="text-[9px] font-mono text-text-muted tracking-[0.2em] uppercase mb-3">
            Friends — Today&apos;s Macros
          </p>
          {friends.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border-accent">
              <IconUsers className="h-8 w-8 text-text-muted mx-auto mb-3" />
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">No friends yet</p>
              <p className="text-[10px] text-text-muted">Share your code or add a friend to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.user_id} className="border border-border-primary bg-bg-card p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.display_name}</p>
                    <div className="flex gap-3 mt-1.5 text-[10px] font-mono text-text-secondary">
                      <span>{f.today.calories} kcal</span>
                      <span>P {f.today.protein.toFixed(0)}g</span>
                      <span>C {f.today.carbs.toFixed(0)}g</span>
                      <span>F {f.today.fat.toFixed(0)}g</span>
                    </div>
                  </div>
                  <button onClick={() => removeFriend(f.user_id)} className="text-text-muted hover:text-white transition-colors">
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────

function HeroSection({ onStart, onSignIn, user }: { onStart: () => void; onSignIn: () => void; user: User | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <div className="animate-fade-in max-w-xl">
        <p className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase mb-6">AI-Powered Nutrition</p>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase mb-6">Diet<br />Coach</h1>
        <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-2 max-w-md mx-auto">Fully custom meal plans, macro targets, and a fat-loss strategy built around your life.</p>
        <p className="text-text-muted text-[11px] font-mono uppercase tracking-wider mb-12">No bland diets. No restriction. Just results.</p>
        {user ? (
          <button onClick={onStart} className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-200 active:bg-gray-300 transition-colors">
            Start My Plan <IconArrow className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button onClick={onSignIn} className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-200 active:bg-gray-300 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>
        )}
        <div className="mt-20 flex items-center justify-center gap-12 text-center">
          {[{ value: "10 MIN", label: "SETUP" }, { value: "7 DAY", label: "MEAL PLAN" }, { value: "100%", label: "PERSONAL" }].map((stat) => (
            <div key={stat.label}><div className="text-lg font-bold tracking-tight">{stat.value}</div><div className="text-[9px] font-mono text-text-muted tracking-[0.2em] mt-1">{stat.label}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Compile form data into a chat message ───────────────────

function compileIntake(d: IntakeData): string {
  return `Here is my complete profile. Please generate my full personalised nutrition plan.

**STATS**
- Age: ${d.age}
- Sex: ${d.sex}
- Height: ${d.height} ${d.heightUnit}
- Weight: ${d.weight} ${d.weightUnit}
- Goal: ${d.goalWeight || "Get lean / visible abs"}
- Pace: ${d.pace}

**LIFESTYLE**
- Job: ${d.jobType}
- Exercise: ${d.exerciseFreq}x per week — ${d.exerciseType || "general training"}
- Sleep: ${d.sleep || "~7"} hours/night
- Stress: ${d.stress}
- Alcohol: ${d.alcohol || "None"}

**FOOD PREFERENCES**
- Favourite meals: ${d.favMeals}
- Hated foods: ${d.hatedFoods || "None"}
- Restrictions: ${d.restrictions || "None"}
- Cooking style: ${d.cookingStyle}
- Adventurousness: ${d.adventurous}/10

**SNACK HABITS**
- Current snacks: ${d.currentSnacks}
- Snacking reason: ${d.snackReason}
- Preference: ${d.snackPreference}
- Late night snacking: ${d.lateNightSnack}`;
}

// ─── Main App ────────────────────────────────────────────────

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<AppView>("hero");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("coach");

  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
      if (u && view === "hero") setView("tracker");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && view === "hero") setView("tracker");
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/conversations").then((r) => r.json()).then((d) => {
      const convos = d.conversations ?? [];
      setConversations(convos);
      if (convos.length > 0 && !activeConvoId && view === "tracker") {
        setActiveConvoId(convos[0].id);
        fetch(`/api/conversations/${convos[0].id}`).then((r) => r.json()).then((cd) => {
          if (cd.conversation) setMessages(cd.conversation.messages || []);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [user]);

  // ── Auto-save ──
  useEffect(() => {
    if (!user || messages.length < 2) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const title = messages.find((m) => m.role === "assistant")?.content.slice(0, 60).replace(/[#*_]/g, "").trim() || "New Plan";
      if (activeConvoId) {
        fetch(`/api/conversations/${activeConvoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, title }) }).then(() => refreshConvos());
      } else {
        fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, title }) })
          .then((r) => r.json()).then((d) => { if (d.id) setActiveConvoId(d.id); refreshConvos(); });
      }
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [messages, user, activeConvoId]);

  const refreshConvos = () => fetch("/api/conversations").then((r) => r.json()).then((d) => setConversations(d.conversations ?? [])).catch(() => {});

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isStreaming]);
  useEffect(() => { if (!isStreaming) inputRef.current?.focus(); }, [isStreaming]);

  // ── Send message ──
  const sendMessage = useCallback(async (
    userMessage: string,
    existingMessages: Message[] = [],
    options?: { openPlanOnComplete?: boolean },
  ) => {
    const newMessages: Message[] = [...existingMessages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMessages }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let content = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n").filter((l) => l.startsWith("data: "))) {
          const d = line.slice(6);
          if (d === "[DONE]") break;
          try { content += JSON.parse(d).text; setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content }; return u; }); } catch { /* skip */ }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [...prev, { role: "assistant", content: `**Error:** ${msg}` }]);
    } finally {
      setIsStreaming(false);
      if (options?.openPlanOnComplete) setActiveTab("plan");
    }
  }, []);

  // ── Handlers ──
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setView("hero"); setMessages([]); setActiveConvoId(null); setConversations([]);
  };

  const handleIntakeComplete = (data: IntakeData) => {
    const compiled = compileIntake(data);
    setView("chat");
    setActiveTab("coach");
    setActiveConvoId(null);
    setMessages([]);
    setTimeout(() => sendMessage(compiled, [], { openPlanOnComplete: true }), 100);
  };

  const handleNewPlan = () => { setActiveConvoId(null); setMessages([]); setView("intake"); setSidebarOpen(false); };

  const handleSelectConvo = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.conversation) { setActiveConvoId(id); setMessages(data.conversation.messages || []); setView("chat"); setActiveTab("coach"); setSidebarOpen(false); }
    } catch { /* silent */ }
  };

  const handleDeleteConvo = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeConvoId === id) { setActiveConvoId(null); setMessages([]); setView("hero"); }
    refreshConvos();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim(), messages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  // ── Render ──
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-[10px] font-mono text-text-muted tracking-[0.3em] uppercase animate-pulse">Loading</p>
    </div>
  );

  if (!user || view === "hero") return <HeroSection onStart={() => setView("intake")} onSignIn={handleSignIn} user={user} />;
  if (view === "intake") return <IntakeForm onComplete={handleIntakeComplete} />;

  // ── Chat + Tracker view ──
  return (
    <div className="flex h-dvh">
      <Sidebar user={user} conversations={conversations} activeId={activeConvoId} onSelect={handleSelectConvo} onNew={handleNewPlan} onDelete={handleDeleteConvo} onSignOut={handleSignOut} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-border-primary bg-bg-primary/90 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden h-8 w-8 border border-border-primary flex items-center justify-center text-text-muted hover:text-white transition-colors"><IconMenu /></button>
              <div className="flex items-center border border-border-primary">
                <button onClick={() => setActiveTab("coach")} className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${activeTab === "coach" ? "bg-white text-black" : "text-text-muted hover:text-white"}`}>Coach</button>
                <button onClick={() => setActiveTab("plan")} className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${activeTab === "plan" ? "bg-white text-black" : "text-text-muted hover:text-white"}`}>Plan</button>
                <button onClick={() => setActiveTab("tracker")} className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors flex items-center gap-1.5 ${activeTab === "tracker" ? "bg-white text-black" : "text-text-muted hover:text-white"}`}><IconCamera className="h-3 w-3" />Tracker</button>
                <button onClick={() => setActiveTab("friends")} className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors flex items-center gap-1.5 ${activeTab === "friends" ? "bg-white text-black" : "text-text-muted hover:text-white"}`}><IconUsers className="h-3 w-3" />Friends</button>
              </div>
            </div>
            <span className="text-[10px] font-mono text-text-muted tracking-[0.15em] uppercase">{{ tracker: "Meal Tracker", friends: "Friends", coach: "Chat", plan: "Diet Plan" }[activeTab]}</span>
          </div>
        </header>

        {activeTab === "friends" ? <FriendsView user={user} /> : activeTab === "tracker" ? <DietTracker user={user} /> : activeTab === "plan" ? <DietPlanView messages={messages} /> : (
          <>
            <main className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
                {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start"><div className="bg-bg-card border border-border-primary px-4 py-3"><TypingIndicator /></div></div>
                )}
                <div ref={bottomRef} />
              </div>
            </main>
            <footer className="sticky bottom-0 border-t border-border-primary bg-bg-primary/90 backdrop-blur-md">
              <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex items-end gap-3 px-4 py-3">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={isStreaming ? "Generating your plan..." : "Ask a follow-up question..."} disabled={isStreaming} rows={1}
                  className="flex-1 resize-none border border-border-primary bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-white/30 focus:outline-none transition-colors disabled:opacity-40"
                  style={{ maxHeight: "120px" }}
                  onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
                />
                <button type="submit" disabled={!input.trim() || isStreaming}
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center bg-white text-black transition-all hover:bg-gray-200 active:bg-gray-300 disabled:opacity-20">
                  <IconSend />
                </button>
              </form>
              <div className="text-center pb-2"><span className="text-[9px] font-mono text-text-muted tracking-wider uppercase">AI-generated — consult a professional</span></div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
