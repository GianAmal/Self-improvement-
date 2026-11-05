import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronDown, Circle, Clock3, Flame,
  Focus, Heart, Leaf, Lightbulb, ListChecks, LogOut, Menu, MoreHorizontal,
  Pause, Play, Plus, RotateCcw, Settings2, Sparkles, Target, Timer,
  TrendingUp, UserRound, X, Zap
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

const today = localDateKey(new Date());
const demoHabits = [
  { id: "demo-1", title: "Read for 20 minutes", category: "Learning", frequency: "Daily", color: "sage", sort_order: 0 },
  { id: "demo-2", title: "Move your body", category: "Health", frequency: "Daily", color: "blue", sort_order: 1 },
  { id: "demo-3", title: "Plan the day", category: "Personal", frequency: "Daily", color: "amber", sort_order: 2 },
  { id: "demo-4", title: "Practice a skill", category: "Growth", frequency: "Daily", color: "lavender", sort_order: 3 },
];
const demoLogs = [
  { habit_id: "demo-1", completed_on: today },
  { habit_id: "demo-2", completed_on: today },
  { habit_id: "demo-1", completed_on: shiftDate(today, -1) },
  { habit_id: "demo-2", completed_on: shiftDate(today, -1) },
  { habit_id: "demo-3", completed_on: shiftDate(today, -1) },
  { habit_id: "demo-1", completed_on: shiftDate(today, -2) },
  { habit_id: "demo-2", completed_on: shiftDate(today, -2) },
  { habit_id: "demo-1", completed_on: shiftDate(today, -3) },
  { habit_id: "demo-2", completed_on: shiftDate(today, -3) },
  { habit_id: "demo-3", completed_on: shiftDate(today, -3) },
  { habit_id: "demo-4", completed_on: shiftDate(today, -3) },
  { habit_id: "demo-1", completed_on: shiftDate(today, -4) },
];
const demoPriorities = [
  { id: "p1", text: "Finish the important thing first", done: true },
  { id: "p2", text: "Make time to move", done: false },
  { id: "p3", text: "Read before winding down", done: false },
];
const navItems = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "focus", label: "Focus", icon: Focus },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "insights", label: "Insights", icon: BarChart3 },
];
const categoryOptions = ["Health", "Learning", "Personal", "Growth", "Work"];
const moodOptions = ["Great", "Good", "Steady", "Low", "Stressed"];

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}
function shiftDate(key, amount) {
  const date = new Date(key + "T12:00:00");
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}
function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}
function formatShortDate(key) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(key + "T12:00:00"));
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return minutes + ":" + rest;
}
function getStreak(habitId, logs) {
  const completed = new Set(logs.filter((log) => log.habit_id === habitId).map((log) => log.completed_on));
  let cursor = completed.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (completed.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}
function getWeekDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const key = shiftDate(today, index - 6);
    return {
      key,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(key + "T12:00:00")).slice(0, 1),
    };
  });
}
function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>;
}
function Eyebrow({ children, trailing }) {
  return <div className="eyebrow-row"><span className="eyebrow">{children}</span>{trailing}</div>;
}
function PanelTitle({ title, subtitle, action }) {
  return <div className="panel-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}
function ProgressRing({ value, size = 112, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.max(0, Math.min(100, value)) / 100 * circumference;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} role="img" aria-label={value + "% complete"}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"} />
      </svg>
      <div className="ring-center"><strong>{value}%</strong><span>complete</span></div>
    </div>
  );
}
function HabitGlyph({ category }) {
  const Icon = category === "Health" ? Heart : category === "Learning" ? BookOpen : category === "Work" ? Target : category === "Growth" ? TrendingUp : Leaf;
  return <div className={"habit-glyph glyph-" + category.toLowerCase()}><Icon size={17} strokeWidth={1.8} /></div>;
}
function Toast({ toast, onClose }) {
  if (!toast) return null;
  return <div className={"toast toast-" + toast.type}><span>{toast.message}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={15} /></button></div>;
}
function Modal({ open, title, description, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
function AuthView() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { display_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) setMessage("Check your inbox for a confirmation link. Your workspace will be ready once your email is verified.");
        else setMessage("Your account is ready. Welcome to Daymark.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-screen">
      <div className="auth-aside">
        <div className="auth-brand"><BrandMark /><span>daymark</span></div>
        <div className="auth-message">
          <span className="auth-kicker">A PRACTICE, NOT A PERFORMANCE</span>
          <h1>Become a little more <em>you.</em></h1>
          <p>A thoughtful space for the habits, focus, and small decisions that shape a life.</p>
          <div className="auth-mantra"><span className="mantra-line" /><span>Progress is built in ordinary moments.</span></div>
        </div>
        <div className="auth-aside-foot">MAKE ROOM FOR WHAT MATTERS</div>
      </div>
      <div className="auth-main">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand"><BrandMark /><span>daymark</span></div>
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h2>{mode === "signin" ? "Welcome back." : "Start with today."}</h2>
          <p className="auth-subtitle">{mode === "signin" ? "Sign in to pick up where you left off." : "Create an account and make space for better days."}</p>
          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" && <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we address you?" required /></label>}
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            <label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /></label>
            {error && <p className="form-error">{error}</p>}
            {message && <p className="form-success">{message}</p>}
            <button className="primary-button auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}<ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{mode === "signin" ? "New to Daymark?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); setError(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
          <p className="auth-privacy">Your habits and reflections stay private to your account.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [page, setPage] = useState("today");
  const [mobileNav, setMobileNav] = useState(false);
  const [habits, setHabits] = useState(supabaseConfigured ? [] : demoHabits);
  const [logs, setLogs] = useState(supabaseConfigured ? [] : demoLogs);
  const [priorities, setPriorities] = useState(supabaseConfigured ? [] : demoPriorities);
  const [intention, setIntention] = useState("Show up with focus. Leave room to breathe.");
  const [journalBody, setJournalBody] = useState("");
  const [journalMood, setJournalMood] = useState("Steady");
  const [journalEnergy, setJournalEnergy] = useState(3);
  const [focusSessions, setFocusSessions] = useState([]);
  const [focusTarget, setFocusTarget] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitCategory, setHabitCategory] = useState("Personal");
  const [priorityDraft, setPriorityDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [journalSavedAt, setJournalSavedAt] = useState("");
  const focusStartedAt = useRef(null);
  const focusSaved = useRef(false);
  const user = session?.user || null;
  const preview = !supabaseConfigured;

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) notify(error.message, "error");
      setSession(data?.session || null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [notify]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = async () => {
      setSaving(true);
      const fromDate = shiftDate(today, -34);
      const results = await Promise.all([
        supabase.from("habits").select("*").is("archived_at", null).order("sort_order", { ascending: true }),
        supabase.from("habit_logs").select("*").gte("completed_on", fromDate).lte("completed_on", today),
        supabase.from("daily_plans").select("*").eq("plan_date", today).maybeSingle(),
        supabase.from("journal_entries").select("*").eq("entry_date", today).maybeSingle(),
        supabase.from("focus_sessions").select("*").order("started_at", { ascending: false }).limit(12),
      ]);
      if (!alive) return;
      const error = results.find((item) => item.error)?.error;
      if (error) notify("Couldn't load your workspace: " + error.message, "error");
      if (!results[0].error) setHabits(results[0].data || []);
      if (!results[1].error) setLogs(results[1].data || []);
      if (!results[2].error && results[2].data) {
        setPriorities(Array.isArray(results[2].data.priorities) ? results[2].data.priorities : []);
        setIntention(results[2].data.intention || "");
      }
      if (!results[3].error && results[3].data) {
        setJournalBody(results[3].data.body || "");
        setJournalMood(results[3].data.mood || "Steady");
        setJournalEnergy(results[3].data.energy || 3);
      }
      if (!results[4].error) setFocusSessions(results[4].data || []);
      setSaving(false);
    };
    load();
    return () => { alive = false; };
  }, [user, notify]);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (remaining !== 0 || focusTarget === 0 || focusSaved.current) return;
    setRunning(false);
    focusSaved.current = true;
    const startedAt = focusStartedAt.current || new Date(Date.now() - focusTarget * 1000).toISOString();
    const record = {
      started_at: startedAt,
      planned_seconds: focusTarget,
      duration_seconds: focusTarget,
      completed: true,
      label: "Focused work",
    };
    if (user) {
      supabase.from("focus_sessions").insert({ ...record, user_id: user.id }).select("*").single()
        .then(({ data, error }) => {
          if (error) notify("Your session ended, but couldn't be saved: " + error.message, "error");
          else setFocusSessions((current) => [data, ...current].slice(0, 12));
        });
    } else {
      setFocusSessions((current) => [{ ...record, id: "local-" + Date.now() }, ...current]);
    }
    notify("Focus session complete. Take a moment before the next thing.");
  }, [remaining, focusTarget, user, notify]);

  const completedToday = useMemo(() => logs.filter((log) => log.completed_on === today).length, [logs]);
  const progress = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  const firstName = user?.user_metadata?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const days = useMemo(getWeekDays, []);
  const weekValues = useMemo(() => days.map((day) => logs.filter((log) => log.completed_on === day.key).length), [days, logs]);
  const weekTotal = weekValues.reduce((sum, value) => sum + value, 0);
  const weeklyMaximum = Math.max(1, ...weekValues);

  const toggleHabit = async (habit) => {
    const exists = logs.some((log) => log.habit_id === habit.id && log.completed_on === today);
    if (exists) {
      setLogs((current) => current.filter((log) => !(log.habit_id === habit.id && log.completed_on === today)));
      if (user) {
        const { error } = await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("completed_on", today);
        if (error) notify("Couldn't update that habit: " + error.message, "error");
      }
    } else {
      const localLog = { habit_id: habit.id, completed_on: today, completed_at: new Date().toISOString() };
      setLogs((current) => [...current, localLog]);
      if (user) {
        const { data, error } = await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: habit.id, completed_on: today }).select("*").single();
        if (error) {
          setLogs((current) => current.filter((log) => !(log.habit_id === habit.id && log.completed_on === today)));
          notify("Couldn't update that habit: " + error.message, "error");
        } else if (data) {
          setLogs((current) => current.map((log) => log.habit_id === habit.id && log.completed_on === today ? data : log));
        }
      }
    }
  };

  const addHabit = async (event) => {
    event.preventDefault();
    const title = habitTitle.trim();
    if (!title) return;
    const payload = {
      title, category: habitCategory, frequency: "Daily",
      color: habitCategory.toLowerCase(), sort_order: habits.length,
    };
    if (user) {
      const { data, error } = await supabase.from("habits").insert({ ...payload, user_id: user.id }).select("*").single();
      if (error) { notify("Couldn't add that habit: " + error.message, "error"); return; }
      setHabits((current) => [...current, data]);
    } else {
      setHabits((current) => [...current, { ...payload, id: "local-" + Date.now() }]);
    }
    setHabitTitle("");
    setShowHabitModal(false);
    notify("Habit added. Keep it small enough to repeat.");
  };

  const savePriorities = async (next, nextIntention = intention) => {
    setPriorities(next);
    if (user) {
      const { error } = await supabase.from("daily_plans").upsert({
        user_id: user.id, plan_date: today, priorities: next, intention: nextIntention,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,plan_date" });
      if (error) notify("Couldn't save today's plan: " + error.message, "error");
    }
  };
  const addPriority = (event) => {
    event.preventDefault();
    if (!priorityDraft.trim()) return;
    const next = [...priorities, { id: "p-" + Date.now(), text: priorityDraft.trim(), done: false }].slice(0, 5);
    savePriorities(next);
    setPriorityDraft("");
  };
  const updateIntention = async (value) => {
    setIntention(value);
    if (!user) return;
    const { error } = await supabase.from("daily_plans").upsert({
      user_id: user.id, plan_date: today, priorities, intention: value, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,plan_date" });
    if (error) notify("Couldn't save your intention: " + error.message, "error");
  };
  const saveJournal = async () => {
    if (!journalBody.trim()) { notify("Write a few words before saving.", "error"); return; }
    setSaving(true);
    if (user) {
      const { error } = await supabase.from("journal_entries").upsert({
        user_id: user.id, entry_date: today, body: journalBody, mood: journalMood,
        energy: journalEnergy, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,entry_date" });
      if (error) { notify("Couldn't save your reflection: " + error.message, "error"); setSaving(false); return; }
    }
    setJournalSavedAt(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    setSaving(false);
    notify("Reflection saved.");
  };
  const chooseFocus = (minutes) => {
    setRunning(false);
    setFocusTarget(minutes * 60);
    setRemaining(minutes * 60);
    focusSaved.current = false;
    focusStartedAt.current = null;
  };
  const toggleTimer = () => {
    if (running) { setRunning(false); return; }
    if (remaining === 0) {
      setRemaining(focusTarget);
      focusSaved.current = false;
    }
    if (!focusStartedAt.current) focusStartedAt.current = new Date().toISOString();
    setRunning(true);
  };
  const resetTimer = () => {
    setRunning(false);
    setRemaining(focusTarget);
    focusSaved.current = false;
    focusStartedAt.current = null;
  };
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setPage("today");
    notify("Signed out.");
  };

  if (supabaseConfigured && !authReady) return <div className="loading-screen"><BrandMark /><span>Opening your workspace…</span></div>;
  if (supabaseConfigured && !session) return <AuthView />;

  const filteredHabits = habits.filter((habit) => habit.title.toLowerCase().includes(search.toLowerCase()));
  const displayName = preview ? "Preview workspace" : firstName;
  const currentPage = navItems.find((item) => item.id === page)?.label || "Settings";

  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}>
        <div className="sidebar-top">
          <div className="brand-lockup"><BrandMark /><span>daymark</span><span className="brand-period">.</span></div>
          <button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace-label"><span className="workspace-dot" /> PERSONAL WORKSPACE <ChevronDown size={13} /></div>
        <div className="nav-section-label">YOUR SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={"nav-item " + (page === item.id ? "active" : "")} onClick={() => { setPage(item.id); setMobileNav(false); }}>
              <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.id === "today" && <span className="nav-today-dot" />}
            </button>;
          })}
        </nav>
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><Sparkles size={16} /></div>
          <p>Small steps, repeated often, become something remarkable.</p>
          <span>YOUR DAILY REMINDER</span>
        </div>
        <div className="sidebar-bottom">
          <button className={"nav-item " + (page === "settings" ? "active" : "")} onClick={() => { setPage("settings"); setMobileNav(false); }}><Settings2 size={17} /><span>Settings</span></button>
          <div className="sidebar-user">
            <div className="avatar">{preview ? "D" : firstName.slice(0, 1).toUpperCase()}</div>
            <div className="sidebar-user-copy"><strong>{displayName}</strong><span>{preview ? "Local preview" : user.email}</span></div>
            {!preview && <button className="icon-button subtle" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>}
          </div>
        </div>
      </aside>
      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19} /></button><span className="breadcrumb">Workspace <span>/</span> {currentPage}</span></div>
          <div className="topbar-right">
            {preview && <span className="preview-chip"><span /> PREVIEW MODE</span>}
            <div className="top-date"><CalendarDays size={15} /> {formatLongDate(new Date())}</div>
            <div className="top-avatar">{preview ? "D" : firstName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        <main className="page-wrap">
          {page === "today" && <TodayPage
            firstName={firstName} preview={preview} habits={habits} logs={logs} priorities={priorities}
            intention={intention} onIntention={updateIntention} onToggleHabit={toggleHabit}
            onAddHabit={() => setShowHabitModal(true)} onNavigate={setPage}
            onPriorityChange={(next) => savePriorities(next)} onAddPriority={addPriority}
            priorityDraft={priorityDraft} setPriorityDraft={setPriorityDraft}
            completedToday={completedToday} progress={progress} focusTarget={focusTarget}
            remaining={remaining} running={running} onToggleTimer={toggleTimer}
            onFocusPage={() => setPage("focus")} weekValues={weekValues} days={days}
            journalBody={journalBody} setJournalBody={setJournalBody}
          />}
          {page === "habits" && <HabitsPage habits={filteredHabits} logs={logs} onToggle={toggleHabit} onAdd={() => setShowHabitModal(true)} search={search} setSearch={setSearch} />}
          {page === "focus" && <FocusPage target={focusTarget} remaining={remaining} running={running} sessions={focusSessions} onChoose={chooseFocus} onToggle={toggleTimer} onReset={resetTimer} />}
          {page === "journal" && <JournalPage body={journalBody} setBody={setJournalBody} mood={journalMood} setMood={setJournalMood} energy={journalEnergy} setEnergy={setJournalEnergy} onSave={saveJournal} saving={saving} savedAt={journalSavedAt} />}
          {page === "insights" && <InsightsPage habits={habits} logs={logs} weekValues={weekValues} days={days} sessions={focusSessions} />}
          {page === "settings" && <SettingsPage user={user} preview={preview} onSignOut={signOut} />}
        </main>
        <footer className="page-footer"><span>DAYMARK © {new Date().getFullYear()}</span><span>MAKE ROOM FOR WHAT MATTERS</span></footer>
      </div>
      <Modal open={showHabitModal} title="Create a habit" description="Choose something small enough to make part of your day." onClose={() => setShowHabitModal(false)}>
        <form className="modal-form" onSubmit={addHabit}>
          <label>Habit name<input autoFocus maxLength="90" value={habitTitle} onChange={(event) => setHabitTitle(event.target.value)} placeholder="e.g. Walk outside for 15 minutes" required /></label>
          <label>Area of life<select value={habitCategory} onChange={(event) => setHabitCategory(event.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <div className="modal-foot"><button type="button" className="secondary-button" onClick={() => setShowHabitModal(false)}>Cancel</button><button className="primary-button" type="submit">Add habit <ArrowRight size={16} /></button></div>
        </form>
      </Modal>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function TodayPage(props) {
  const {
    firstName, preview, habits, logs, priorities, intention, onIntention, onToggleHabit,
    onAddHabit, onNavigate, onPriorityChange, onAddPriority, priorityDraft, setPriorityDraft,
    completedToday, progress, focusTarget, remaining, running, onToggleTimer: onToggle, onFocusPage,
    weekValues, days, journalBody, setJournalBody,
  } = props;
  const greeting = firstName === "there" ? "Make today count." : "Good day, " + firstName + ".";
  const focusProgress = focusTarget ? ((focusTarget - remaining) / focusTarget) * 100 : 0;
  return (
    <>
      <section className="welcome-row">
        <div><span className="eyebrow">{formatLongDate(new Date()).toUpperCase()} <span className="eyebrow-sep">/</span> A FRESH PAGE</span><h1>{greeting}</h1><p className="welcome-copy">You don't need to do everything. Just the next right thing.</p></div>
        <div className="welcome-quote"><span className="quote-mark">“</span><span>Be where your feet are.</span><small>A NOTE TO SELF</small></div>
      </section>
      {preview && <div className="preview-banner"><div><Sparkles size={16} /><span><strong>You're exploring Daymark.</strong> This is sample data in a local preview; connect Supabase to create a private, synced workspace.</span></div><span className="preview-banner-tag">DEMO DATA</span></div>}
      <div className="dashboard-grid">
        <div className="content-stack">
          <section className="panel momentum-panel">
            <div className="momentum-copy"><Eyebrow trailing={<span className="live-indicator"><span /> TODAY'S MOMENTUM</span>}>YOUR DAY AT A GLANCE</Eyebrow><h2>Progress looks good<br /><em>one step at a time.</em></h2><p>{habits.length ? (completedToday === habits.length ? "You showed up for everything you planned today. Take that in." : "Every completed habit is a vote for the person you're becoming.") : "Start with one small habit. You can build from there."}</p><button className="text-link" onClick={() => onNavigate("insights")}>View your insights <ArrowUpRight size={15} /></button></div>
            <div className="momentum-ring"><ProgressRing value={progress} size={126} /><span className="ring-caption">{completedToday} OF {habits.length} HABITS</span></div>
            <div className="momentum-bottom"><div><strong>{habits.length - completedToday}</strong><span>left for today</span></div><div className="momentum-divider" /><div><strong>{habits.length ? Math.round(weekValues.reduce((a, b) => a + b, 0) / 7 * 10) / 10 : 0}</strong><span>daily average this week</span></div><div className="momentum-leaf"><Leaf size={23} /></div></div>
          </section>
          <section className="panel habits-panel">
            <PanelTitle title="Today's habits" subtitle="A few promises to yourself." action={<button className="small-outline-button" onClick={onAddHabit}><Plus size={15} /> Add habit</button>} />
            {habits.length ? <div className="habit-list">
              {habits.slice(0, 5).map((habit) => {
                const done = logs.some((log) => log.habit_id === habit.id && log.completed_on === today);
                return <HabitRow key={habit.id} habit={habit} done={done} streak={getStreak(habit.id, logs)} onToggle={() => onToggleHabit(habit)} />;
              })}
              {habits.length > 5 && <button className="list-footer-link" onClick={() => onNavigate("habits")}>See all {habits.length} habits <ArrowRight size={14} /></button>}
            </div> : <EmptyState icon={Leaf} title="Make room for one good habit." body="Start with a small action you can repeat, even on a busy day." action="Create your first habit" onClick={onAddHabit} />}
          </section>
          <section className="panel priorities-panel">
            <PanelTitle title="A little direction" subtitle="Keep the important things close." action={<span className="quiet-count">{priorities.filter((item) => item.done).length}/{priorities.length} done</span>} />
            <form className="priority-add" onSubmit={onAddPriority}><Plus size={16} /><input aria-label="Add a priority" placeholder="Add a priority for today…" value={priorityDraft} onChange={(event) => setPriorityDraft(event.target.value)} /><button type="submit" disabled={!priorityDraft.trim()}>Add</button></form>
            <div className="priority-list">
              {priorities.map((item) => <button className={"priority-row " + (item.done ? "is-done" : "")} key={item.id} onClick={() => onPriorityChange(priorities.map((priority) => priority.id === item.id ? { ...priority, done: !priority.done } : priority))}><span className="priority-check">{item.done && <Check size={13} />}</span><span>{item.text}</span></button>)}
              {!priorities.length && <p className="empty-inline">Add one to three things that would make today feel meaningful.</p>}
            </div>
            <div className="intention-line"><Lightbulb size={15} /><input aria-label="Today's intention" value={intention} onChange={(event) => onIntention(event.target.value)} /></div>
          </section>
        </div>
        <aside className="right-stack">
          <section className="focus-card">
            <div className="focus-card-top"><span className="focus-label"><span className="focus-pulse" /> FOCUS SESSION</span><button className="dark-icon-button" onClick={onFocusPage} aria-label="Open focus page"><ArrowUpRight size={16} /></button></div>
            <h2>Make space<br />for deep work.</h2>
            <div className="focus-clock">
              <svg viewBox="0 0 190 190" role="img" aria-label={formatTime(remaining) + " remaining"}>
                <circle cx="95" cy="95" r="83" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1.5" />
                <circle cx="95" cy="95" r="73" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="5" />
                <circle className="focus-clock-progress" cx="95" cy="95" r="73" fill="none" stroke="#c4d6a5" strokeWidth="5" strokeLinecap="round" strokeDasharray="459" strokeDashoffset={459 - (focusProgress / 100) * 459} transform="rotate(-90 95 95)" />
              </svg>
              <div className="focus-clock-time"><strong>{formatTime(remaining)}</strong><span>{running ? "IN THE FLOW" : "READY WHEN YOU ARE"}</span></div>
            </div>
            <div className="focus-card-actions"><button className="focus-start-button" onClick={onToggle}>{running ? <><Pause size={16} /> Pause</> : <><Play size={16} fill="currentColor" /> Start focus</>}</button><button className="focus-adjust" onClick={onFocusPage}>Adjust</button></div>
            <div className="focus-card-foot"><span><Clock3 size={14} /> {Math.round(focusTarget / 60)} min session</span><span>ONE THING AT A TIME</span></div>
          </section>
          <section className="panel week-panel">
            <PanelTitle title="Your week" subtitle="Showing your daily habit check-ins." action={<button className="icon-button subtle" onClick={() => onNavigate("insights")} aria-label="More insights"><ArrowUpRight size={16} /></button>} />
            <div className="week-chart">
              {days.map((day, index) => <div className="week-bar-column" key={day.key}><div className="week-bar-track"><span className="week-bar-fill" style={{ height: Math.max(5, weekValues[index] / Math.max(1, habits.length) * 100) + "%" }} /></div><span className={day.key === today ? "week-day today" : "week-day"}>{day.label}</span></div>)}
            </div>
            <div className="week-foot"><span><span className="legend-dot" /> Habits completed</span><strong>{weekValues.reduce((sum, value) => sum + value, 0)} <small>this week</small></strong></div>
          </section>
          <section className="journal-nudge">
            <div className="journal-nudge-icon"><BookOpen size={18} /></div>
            <div><strong>Take a moment to reflect.</strong><p>A few honest words can bring a little clarity.</p><button onClick={() => onNavigate("journal")}>Open your journal <ArrowRight size={14} /></button></div>
          </section>
        </aside>
      </div>
    </>
  );
}

function HabitRow({ habit, done, streak, onToggle }) {
  return <div className={"habit-row " + (done ? "habit-complete" : "")}>
    <button className={"habit-check " + (done ? "checked" : "")} onClick={onToggle} aria-label={(done ? "Mark " + habit.title + " incomplete" : "Complete " + habit.title)}>{done && <Check size={16} strokeWidth={2.5} />}</button>
    <HabitGlyph category={habit.category} />
    <div className="habit-row-copy"><strong>{habit.title}</strong><span>{habit.category || "Personal"} <span className="middot">·</span> {habit.frequency || "Daily"}</span></div>
    <div className="habit-row-end">{streak > 0 && <span className="streak-label"><Flame size={13} /> {streak}d</span>}<span className={"habit-status " + (done ? "status-done" : "")}>{done ? "Done" : "To do"}</span><button className="habit-more" aria-label={"More options for " + habit.title}><MoreHorizontal size={17} /></button></div>
  </div>;
}
function EmptyState({ icon: Icon, title, body, action, onClick }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={19} /></div><strong>{title}</strong><p>{body}</p>{action && <button className="text-link" onClick={onClick}>{action} <ArrowRight size={15} /></button>}</div>;
}
function HabitsPage({ habits, logs, onToggle, onAdd, search, setSearch }) {
  const week = getWeekDays();
  return <>
    <PageHeading eyebrow="CONSISTENCY OVER INTENSITY" title="Your habits." subtitle="Build a rhythm that supports the life you want to live." action={<button className="primary-button" onClick={onAdd}><Plus size={16} /> New habit</button>} />
    <div className="habit-overview-strip"><div><span>ACTIVE HABITS</span><strong>{habits.length}</strong></div><div><span>COMPLETED TODAY</span><strong>{logs.filter((log) => log.completed_on === today).length}</strong></div><div><span>CHECK-INS THIS WEEK</span><strong>{logs.filter((log) => week.some((day) => day.key === log.completed_on)).length}</strong></div></div>
    <section className="panel habit-library">
      <div className="habit-library-head"><PanelTitle title="Your routine" subtitle="A flexible structure for the person you're becoming." /><div className="search-field"><Activity size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a habit…" aria-label="Find a habit" />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}</div></div>
      {habits.length ? <div className="habit-library-grid">{habits.map((habit) => {
        const done = logs.some((log) => log.habit_id === habit.id && log.completed_on === today);
        const streak = getStreak(habit.id, logs);
        return <article className="habit-card" key={habit.id}><div className="habit-card-top"><HabitGlyph category={habit.category} /><span className="habit-frequency">{habit.frequency || "Daily"}</span></div><h3>{habit.title}</h3><p>{habit.category || "Personal"} practice</p><div className="habit-week-dots">{week.map((day) => <span key={day.key} className={logs.some((log) => log.habit_id === habit.id && log.completed_on === day.key) ? "dot-filled" : ""} title={day.key} />)}</div><div className="habit-card-foot"><span>{streak ? <><Flame size={13} /> {streak} day streak</> : "Start your streak today"}</span><button className={done ? "completed-button" : "complete-button"} onClick={() => onToggle(habit)}>{done ? <><Check size={14} /> Done</> : "Complete"}</button></div></article>;
      })}</div> : <EmptyState icon={ListChecks} title="No habits match that search." body="Try a different word, or create a new habit." action="Create a habit" onClick={onAdd} />}
    </section>
    <p className="page-footnote"><Lightbulb size={15} /> A habit should make your life better, not heavier. Start with less than you think you can handle.</p>
  </>;
}
function FocusPage({ target, remaining, running, sessions, onChoose, onToggle, onReset }) {
  const percentage = target ? ((target - remaining) / target) * 100 : 0;
  const totalMinutes = sessions.reduce((sum, item) => sum + Math.round((item.duration_seconds || 0) / 60), 0);
  return <>
    <PageHeading eyebrow="PROTECT YOUR ATTENTION" title="Find your focus." subtitle="One clear intention. A little protected time. That's enough to begin." />
    <div className="focus-page-grid">
      <section className="focus-main-card">
        <div className="focus-main-top"><span className="focus-label"><span className="focus-pulse" /> {running ? "SESSION IN PROGRESS" : "YOUR FOCUS SPACE"}</span><span className="focus-main-date">{formatLongDate(new Date())}</span></div>
        <h2>{running ? "Stay with it." : "What deserves your attention?"}</h2>
        <p>{running ? "Let the rest wait. You're exactly where you need to be." : "Set aside the noise and give one thing your full attention."}</p>
        <div className="large-timer"><svg viewBox="0 0 300 300" role="img" aria-label={formatTime(remaining) + " remaining"}><circle cx="150" cy="150" r="133" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1.5" /><circle cx="150" cy="150" r="119" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" /><circle className="focus-clock-progress" cx="150" cy="150" r="119" fill="none" stroke="#c4d6a5" strokeWidth="6" strokeLinecap="round" strokeDasharray="748" strokeDashoffset={748 - percentage / 100 * 748} transform="rotate(-90 150 150)" /></svg><div className="large-timer-copy"><strong>{formatTime(remaining)}</strong><span>{running ? "BREATHE · FOCUS · CONTINUE" : "READY WHEN YOU ARE"}</span></div></div>
        <div className="timer-presets">{[15, 25, 45, 60].map((minutes) => <button key={minutes} className={target === minutes * 60 ? "selected" : ""} onClick={() => onChoose(minutes)} disabled={running}>{minutes} min</button>)}</div>
        <div className="timer-controls"><button className="focus-start-button" onClick={onToggle}>{running ? <><Pause size={17} /> Pause session</> : <><Play size={17} fill="currentColor" /> {remaining === target ? "Begin focus" : "Resume focus"}</>}</button><button className="timer-reset" onClick={onReset} aria-label="Reset timer"><RotateCcw size={17} /></button></div>
        <div className="focus-reminder"><Zap size={15} /> Put your phone away. Close the extra tabs. Begin with one thing.</div>
      </section>
      <aside className="focus-side-stack">
        <section className="panel focus-stats-panel"><Eyebrow>YOUR PRACTICE</Eyebrow><div className="focus-stat"><div className="stat-icon stat-sage"><Clock3 size={17} /></div><div><strong>{totalMinutes}<small> min</small></strong><span>Focused in saved sessions</span></div></div><div className="focus-stat"><div className="stat-icon stat-blue"><Target size={17} /></div><div><strong>{sessions.length}</strong><span>Completed sessions</span></div></div><div className="focus-stat"><div className="stat-icon stat-amber"><Flame size={17} /></div><div><strong>{sessions.filter((item) => (item.duration_seconds || 0) >= 1500).length}</strong><span>Sessions of 25+ minutes</span></div></div></section>
        <section className="panel session-history"><PanelTitle title="Recent sessions" subtitle="Your time, intentionally spent." />{sessions.length ? sessions.slice(0, 6).map((item) => <div className="session-row" key={item.id}><span className="session-check"><Check size={13} /></span><div><strong>{item.label || "Focused work"}</strong><span>{new Date(item.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div><b>{Math.round((item.duration_seconds || 0) / 60)}m</b></div>) : <p className="empty-inline">Your completed sessions will show up here.</p>}</section>
      </aside>
    </div>
  </>;
}
function JournalPage({ body, setBody, mood, setMood, energy, setEnergy, onSave, saving, savedAt }) {
  return <>
    <PageHeading eyebrow="A SPACE TO THINK CLEARLY" title="Your journal." subtitle="You don't need the perfect words. Just write what is true today." />
    <div className="journal-layout">
      <section className="panel journal-editor">
        <div className="journal-date-line"><span className="journal-date-dot" /> {formatLongDate(new Date()).toUpperCase()} <span>·</span> DAILY REFLECTION</div>
        <label className="journal-prompt" htmlFor="journal-body">What is on your mind?</label>
        <p className="journal-hint">A moment worth remembering, a thought to untangle, or something you're grateful for.</p>
        <textarea id="journal-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder={"Start wherever you are…\n\nWhat went well today? What felt difficult? What do you want to carry into tomorrow?"} rows={12} />
        <div className="journal-editor-foot"><span>{body.trim().split(/\s+/).filter(Boolean).length} words</span><span>{savedAt ? "Last saved at " + savedAt : "Your reflection is private"}</span></div>
        <div className="journal-save-row"><span><Heart size={15} /> Be honest. Be kind to yourself.</span><button className="primary-button" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save reflection"} <ArrowRight size={16} /></button></div>
      </section>
      <aside className="journal-side-stack">
        <section className="panel mood-panel"><Eyebrow>CHECK IN WITH YOURSELF</Eyebrow><h2>How are you feeling?</h2><p>No judgment. Just notice what's here.</p><div className="mood-options">{moodOptions.map((option, index) => <button key={option} className={mood === option ? "mood-choice chosen" : "mood-choice"} onClick={() => setMood(option)}><span className={"mood-dot mood-" + index} />{option}</button>)}</div></section>
        <section className="panel energy-panel"><Eyebrow>YOUR ENERGY</Eyebrow><h2>How much is in the tank?</h2><div className="energy-scale">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={energy >= value ? "energy-level filled" : "energy-level"} onClick={() => setEnergy(value)} aria-label={"Set energy to " + value}><span /></button>)}</div><div className="energy-labels"><span>Running low</span><span>Feeling full</span></div></section>
        <div className="journal-quote"><span>“</span><p>Almost everything will work again if you unplug it for a few minutes, including you.</p><small>AN INVITATION TO PAUSE</small></div>
      </aside>
    </div>
  </>;
}
function InsightsPage({ habits, logs, weekValues, days, sessions }) {
  const weekCount = weekValues.reduce((sum, value) => sum + value, 0);
  const totalMinutes = sessions.reduce((sum, item) => sum + Math.round((item.duration_seconds || 0) / 60), 0);
  const bestDayIndex = weekValues.indexOf(Math.max(...weekValues));
  const bestDay = weekValues.length && weekCount ? days[bestDayIndex].label : "—";
  const maxValue = Math.max(1, ...weekValues);
  const completionAverage = habits.length ? Math.round(weekCount / 7 / habits.length * 100) : 0;
  return <>
    <PageHeading eyebrow="REFLECTION, NOT PRESSURE" title="Notice your progress." subtitle="Patterns help you understand what is working. Use them as information, not a score." />
    <div className="insight-stats-grid"><InsightStat icon={CheckCircle2} label="Habit check-ins" value={weekCount} caption="Over the last 7 days" tone="sage" /><InsightStat icon={Activity} label="Daily consistency" value={completionAverage + "%"} caption="Average of active habits" tone="blue" /><InsightStat icon={Clock3} label="Focus time" value={totalMinutes + "m"} caption="Across saved sessions" tone="amber" /><InsightStat icon={Flame} label="Strongest day" value={bestDay} caption="Most habit check-ins" tone="lavender" /></div>
    <div className="insight-content-grid"><section className="panel insight-chart-panel"><PanelTitle title="Your consistency" subtitle="Habit check-ins by day." /><div className="insight-chart">{days.map((day, index) => <div key={day.key} className="insight-bar-column"><strong>{weekValues[index] || ""}</strong><div className="insight-bar-track"><span style={{ height: weekValues[index] / maxValue * 100 + "%" }} /></div><small>{day.label}</small></div>)}</div><div className="chart-caption"><span><span className="legend-dot" /> Completed habits</span><span>Last 7 days</span></div></section><section className="panel insight-habits-panel"><PanelTitle title="Your habits" subtitle="Where your energy has gone." />{habits.length ? habits.map((habit) => {const count = logs.filter((log) => log.habit_id === habit.id && days.some((day) => day.key === log.completed_on)).length;return <div className="insight-habit-row" key={habit.id}><HabitGlyph category={habit.category} /><div><strong>{habit.title}</strong><span>{count} of 7 days</span></div><div className="insight-mini-track"><span style={{ width: count / 7 * 100 + "%" }} /></div></div>;}) : <EmptyState icon={Leaf} title="Your patterns start here." body="Add a habit and check in over time to see your progress." />}</section></div>
    <div className="insight-note"><Lightbulb size={17} /><div><strong>Look for a rhythm, not perfection.</strong><p>A missed day is data, not a verdict. Notice what helps you return, then make that easier to repeat.</p></div></div>
  </>;
}
function InsightStat({ icon: Icon, label, value, caption, tone }) {
  return <div className="panel insight-stat-card"><div className={"stat-icon stat-" + tone}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{caption}</small></div>;
}
function SettingsPage({ user, preview, onSignOut }) {
  return <>
    <PageHeading eyebrow="MAKE IT YOURS" title="Your space." subtitle="A few details about your Daymark workspace." />
    <div className="settings-layout"><section className="panel settings-panel"><PanelTitle title="Account" subtitle="The details connected to your workspace." /><div className="settings-profile"><div className="settings-avatar">{preview ? "D" : (user?.user_metadata?.display_name || user?.email || "U").slice(0, 1).toUpperCase()}</div><div><strong>{preview ? "Preview workspace" : user?.user_metadata?.display_name || "Daymark member"}</strong><span>{preview ? "Sample data · Local only" : user?.email}</span></div><span className="account-status">{preview ? "PREVIEW" : "ACTIVE"}</span></div><div className="settings-divider" /><div className="setting-line"><div><strong>Private by default</strong><p>Your habits, plans, focus sessions, and journal entries are scoped to your account.</p></div><span className="setting-enabled"><Check size={13} /> ON</span></div><div className="setting-line"><div><strong>Data storage</strong><p>{preview ? "Preview data is temporary and is not synced to a database." : "Your workspace is stored in your private Supabase account."}</p></div><span className="setting-detail">{preview ? "LOCAL" : "SUPABASE"}</span></div>{!preview && <div className="settings-actions"><button className="secondary-button danger-button" onClick={onSignOut}><LogOut size={16} /> Sign out</button></div>}</section><aside className="settings-side"><div className="settings-about"><BrandMark /><h2>Make room for what matters.</h2><p>Daymark is built around a simple idea: a meaningful life is shaped by the small things we choose to do consistently.</p><span>DAYMARK · VERSION 1.0</span></div><div className="settings-help"><Sparkles size={17} /><div><strong>Keep it sustainable.</strong><p>Choose a few habits that support your life. Leave room for change, rest, and being human.</p></div></div></aside></div>
  </>;
}
function PageHeading({ eyebrow, title, subtitle, action }) {
  return <section className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</section>;
}