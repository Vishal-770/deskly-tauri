import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { invoke } from "@tauri-apps/api/core";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  User,
  MapPin,
  FileText,
  AlertCircle,
  Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExamScheduleEntry {
  examType: string;
  serialNo: number;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  classId: string;
  slot: string;
  examDate: string;
  examSession: string;
  reportingTime: string;
  examTime: string;
  venue: string;
  seatLocation: string;
  seatNo: string;
}

interface ExamScheduleGroup {
  examType: string;
  schedules: ExamScheduleEntry[];
}

interface ExamScheduleResponse {
  success: boolean;
  data?: ExamScheduleGroup[];
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDateStr(str: string): Date {
  const parts = str.split("-");
  if (parts.length < 3) return new Date();
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].toLowerCase();
  const year = parseInt(parts[2], 10);
  
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const month = months[monthStr.substring(0, 3)] ?? 0;
  return new Date(year, month, day);
}

function formatExamTypeLabel(type: string): string {
  const clean = type.trim().toUpperCase();
  if (clean === "CAT1") return "CAT 1";
  if (clean === "CAT2") return "CAT 2";
  if (clean === "FAT") return "FAT";
  return type;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function ExamCardSkeleton() {
  return (
    <div className="flex items-start gap-4 md:gap-6 py-5 px-3 border border-transparent border-b border-border/20 last:border-b-0 animate-pulse">
      <div className="w-[80px] shrink-0 flex flex-col items-end gap-1">
        <Sk className="h-4 w-12" />
        <Sk className="h-6 w-14" />
        <Sk className="h-3.5 w-10" />
      </div>
      <div className="relative hidden md:flex flex-col items-center justify-center self-stretch shrink-0 w-6">
        <Sk className="h-3.5 w-3.5 rounded-full shrink-0" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Sk className="h-4 w-20" />
          <Sk className="h-4.5 w-12 rounded-full" />
        </div>
        <Sk className="h-5 w-44" />
        <div className="flex gap-4">
          <Sk className="h-4 w-28" />
          <Sk className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <Sk className="h-3.5 w-16" />
        <div className="border-l-2 border-primary/20 pl-4 py-1.5 space-y-3">
          <Sk className="h-5 w-36" />
          <Sk className="h-10 w-48" />
          <Sk className="h-6 w-40" />
        </div>
      </div>
      <div className="space-y-4">
        <Sk className="h-3.5 w-24 border-b border-border/10 pb-2 w-full" />
        <div className="space-y-4">
          <div className="flex gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-1.5 flex-1">
                <Sk className="h-8 w-12" />
                <Sk className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5 pt-1 border-t border-border/10">
            <Sk className="h-8 w-24" />
            <Sk className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ExamSchedulePage() {
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [groups, setGroups] = useState<ExamScheduleGroup[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Load from Cache (SWR) first
  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::exams");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ExamScheduleGroup[];
        if (parsed.length > 0) {
          setGroups(parsed);
          setSelectedTab(parsed[0].examType);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached exams", e);
      }
    }
  }, []);

  // Update Current Time every second for countdown
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load fresh from backend
  async function load() {
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;

      const res = await invoke<ExamScheduleResponse>("exam_schedule_get", { semesterSubId: null });
      if (res.success && res.data) {
        setGroups(res.data);
        localStorage.setItem("deskly::cache::exams", JSON.stringify(res.data));
        if (res.data.length > 0) {
          const tabNames = res.data.map(g => g.examType);
          if (!selectedTab || !tabNames.includes(selectedTab)) {
            setSelectedTab(res.data[0].examType);
          }
        }
      } else {
        setError(res.error ?? "Failed to fetch exam schedule.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      load();
    }
  }, [isLoggedIn, authLoading]);

  // Select active schedules matching the current tab selection
  const activeSchedules = useMemo(() => {
    const group = groups.find((g) => g.examType === selectedTab);
    if (!group) return [];
    return [...group.schedules].sort((a, b) => {
      return parseDateStr(a.examDate).getTime() - parseDateStr(b.examDate).getTime();
    });
  }, [groups, selectedTab]);

  // Formatted Tabs
  const tabsList = useMemo(() => {
    return groups.map((g) => {
      const label = formatExamTypeLabel(g.examType);
      const count = g.schedules.length;
      
      if (count === 0) return { id: g.examType, label, count, range: "" };
      const parsedDates = g.schedules.map(s => parseDateStr(s.examDate).getTime());
      const minDate = new Date(Math.min(...parsedDates));
      const maxDate = new Date(Math.max(...parsedDates));
      
      const formatShort = (d: Date) => {
        const day = d.getDate();
        const mon = d.toLocaleString("en-US", { month: "short" });
        return `${day} ${mon}`;
      };
      
      const range = `${formatShort(minDate)} – ${formatShort(maxDate)}, ${minDate.getFullYear()}`;
      return { id: g.examType, label, count, range };
    });
  }, [groups]);

  // Calculate Next Exam and its countdown stats
  const nextExamInfo = useMemo(() => {
    const allExams = groups.flatMap(g => g.schedules);
    const futureExams = allExams
      .map(s => {
        const d = parseDateStr(s.examDate);
        const timeParts = s.examTime.split("-");
        if (timeParts.length > 0) {
          const c = timeParts[0].trim().toUpperCase().split(" ");
          if (c.length >= 2) {
            const [h, m] = c[0].split(":").map(Number);
            let hr = h || 0;
            if (c[1] === "PM" && hr !== 12) hr += 12;
            if (c[1] === "AM" && hr === 12) hr = 0;
            d.setHours(hr, m, 0, 0);
          }
        }
        return { exam: s, targetDate: d };
      })
      .filter(({ targetDate }) => targetDate.getTime() > currentTime.getTime())
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

    if (futureExams.length === 0) return null;

    const { exam, targetDate } = futureExams[0];
    const diffMs = targetDate.getTime() - currentTime.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      exam,
      dateFormatted: exam.examDate,
      countdown: { days, hours, minutes, seconds }
    };
  }, [groups, currentTime]);

  // Tab Stats computation
  const tabStats = useMemo(() => {
    if (activeSchedules.length === 0) {
      return { totalExams: 0, upcomingExams: 0, span: "0 Days" };
    }

    const upcomingCount = activeSchedules.filter(s => {
      const d = parseDateStr(s.examDate);
      d.setHours(23, 59, 59, 999);
      return d.getTime() > currentTime.getTime();
    }).length;

    const parsedDates = activeSchedules.map(s => parseDateStr(s.examDate).getTime());
    const minDate = Math.min(...parsedDates);
    const maxDate = Math.max(...parsedDates);
    const diffMs = maxDate - minDate;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const spanStr = `${days} ${days === 1 ? "Day" : "Days"}`;

    return {
      totalExams: activeSchedules.length,
      upcomingExams: upcomingCount,
      span: spanStr
    };
  }, [activeSchedules, currentTime]);

  // Layout wrapper shell
  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-8 pb-16 px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  if (authLoading || (loading && groups.length === 0)) return shell(
    <div className="w-full lg:h-[calc(100vh-5rem)] lg:flex lg:flex-col lg:overflow-hidden space-y-6">
      <div className="flex justify-between pb-6 border-b border-border/40 shrink-0">
        <div className="space-y-2"><Sk className="h-7 w-36" /><Sk className="h-3 w-52" /></div>
      </div>
      <div className="shrink-0 flex gap-4 border-b border-border/20 pb-2">
        <Sk className="h-10 w-24 rounded" />
        <Sk className="h-10 w-24 rounded" />
        <Sk className="h-10 w-24 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start min-h-0 flex-1 overflow-hidden pt-4">
        <div className="space-y-8 lg:h-full lg:overflow-y-auto no-scrollbar pb-6 pr-2">
          <SidebarSkeleton />
        </div>
        <div className="lg:h-full lg:overflow-y-auto no-scrollbar pb-6 pr-2 space-y-3">
          {[...Array(4)].map((_, i) => <ExamCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );

  if (error) return shell(
    <div className="flex h-full items-center justify-center">
      <ErrorDisplay message={error} onRetry={load} />
    </div>
  );

  return shell(
    <div className="w-full lg:h-[calc(100vh-5rem)] lg:flex lg:flex-col lg:overflow-hidden space-y-6">
      
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/20 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">My Exams</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your exam schedule at a glance</p>
        </div>
      </header>

      {/* ── Exam Tabs selector (Premium Horizontal Tab Bar) ───────────────── */}
      {groups.length > 0 && (
        <div className="border-b border-border/20 pb-2 shrink-0 flex gap-6 overflow-x-auto no-scrollbar">
          {tabsList.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`relative pb-3 flex flex-col items-start cursor-pointer transition-colors duration-200 shrink-0 ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-wider">{tab.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                </div>
                <span className="text-[10px] font-semibold mt-1 leading-none opacity-60">
                  {tab.range}
                </span>

                {/* Underline indicator */}
                {active && (
                  <motion.div
                    layoutId="activeExamTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Split View ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start min-h-0 flex-1 overflow-hidden pt-2">
        
        {/* ── Left Sidebar (Sticky details) ────────────────────────────────── */}
        <div className="space-y-6 lg:h-full lg:overflow-y-auto no-scrollbar pb-6 pr-2 shrink-0">
          {loading && activeSchedules.length === 0 ? (
            <SidebarSkeleton />
          ) : (
            <>
              {/* Next Exam Countdown (Minimalist, borderless layout) */}
              {nextExamInfo ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Next Exam
                    </p>
                  </div>
                  <div className="border-l-2 border-primary pl-4 py-1.5 space-y-2">
                    <span className="text-xs font-extrabold text-primary tracking-wide uppercase">
                      {nextExamInfo.exam.courseCode}
                    </span>
                    <p className="text-base font-extrabold text-foreground leading-snug">{nextExamInfo.exam.courseTitle}</p>
                    
                    <div className="space-y-2 text-sm text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground/60" />
                        <span className="font-semibold text-foreground">{nextExamInfo.dateFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground/60" />
                        <span className="font-medium">{nextExamInfo.exam.venue || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground/60" />
                        <span className="font-medium">Seat {nextExamInfo.exam.seatNo} {nextExamInfo.exam.seatLocation !== "-" && `(${nextExamInfo.exam.seatLocation})`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Digits */}
                  <div className="border border-border/20 rounded-xl p-4 space-y-2.5 text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Starts in</span>
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[
                        { label: "Days", val: nextExamInfo.countdown.days },
                        { label: "Hours", val: nextExamInfo.countdown.hours },
                        { label: "Mins", val: nextExamInfo.countdown.minutes },
                        { label: "Secs", val: nextExamInfo.countdown.seconds },
                      ].map(({ label, val }, idx) => (
                        <div key={label} className="relative flex flex-col items-center">
                          <span className="text-2xl font-black text-primary leading-none">
                            {String(val).padStart(2, "0")}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
                            {label}
                          </span>
                          {idx < 3 && (
                            <div className="absolute right-0 top-1 bottom-4 w-px bg-border/20" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/10 pb-2">Next Exam</p>
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <Calendar className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-foreground">No upcoming exams</p>
                      <p className="text-sm text-muted-foreground mt-0.5">All scheduled exams are completed.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Overview Stats */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/10 pb-2">Quick Overview</p>
                <div className="space-y-4 pt-1">
                  <div className="flex flex-row gap-8">
                    {[
                      { label: "Total Exams", val: tabStats.totalExams },
                      { label: "Upcoming", val: tabStats.upcomingExams },
                    ].map(({ label, val }) => (
                      <div key={label} className="space-y-1.5 flex-1">
                        <p className="font-black text-foreground text-3xl leading-none">{val}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-border/10">
                    <p className="font-black text-foreground text-3xl leading-none">{tabStats.span}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">Total Exam Span</p>
                  </div>
                </div>
              </div>

              {/* Important note */}
              <div className="p-4 rounded-xl bg-destructive/[0.03] border border-destructive/10 text-xs leading-relaxed text-destructive/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Note
                </div>
                <p className="font-semibold text-muted-foreground leading-snug">
                  Please reach the exam venue at least 15 minutes before the reporting time.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Right Content: Chronological Timeline ────────────────────────── */}
        <div className="lg:h-full lg:overflow-y-auto no-scrollbar pb-6 pr-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/20 shrink-0">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">Exam Schedule ({formatExamTypeLabel(selectedTab)})</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All times are as per reporting time at the venue</p>
            </div>
            {!loading && (
              <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                {activeSchedules.length} {activeSchedules.length === 1 ? "exam" : "exams"}
              </span>
            )}
          </div>

          {/* Timeline List */}
          <div className="relative">
            {loading && activeSchedules.length === 0 ? (
              <div className="space-y-2 pt-2">
                {[...Array(4)].map((_, i) => <ExamCardSkeleton key={i} />)}
              </div>
            ) : activeSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-bold text-foreground">No exam schedules loaded</p>
                  <p className="text-xs text-muted-foreground mt-1">Select a semester or check VTOP records.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Continuous timeline vertical line on desktop */}
                <div className="absolute top-0 bottom-0 left-[92px] w-[2px] bg-border/15 hidden md:block" />

                <div className="space-y-1 pt-2">
                  {activeSchedules.map((item, idx) => {
                    const examDate = parseDateStr(item.examDate);
                    
                    // Formatted Date Bubbles
                    const dayNum = examDate.getDate();
                    const monthStr = examDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
                    const weekDayStr = examDate.toLocaleString("en-US", { weekday: "short" }).toUpperCase();

                    // Calculate gap indicators between this exam and the next
                    let gapElement = null;
                    if (idx < activeSchedules.length - 1) {
                      const nextExam = activeSchedules[idx + 1];
                      const nextDate = parseDateStr(nextExam.examDate);
                      const timeDiff = nextDate.getTime() - examDate.getTime();
                      const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                      if (dayDiff > 1) {
                        gapElement = (
                          <div className="relative py-3 flex items-center justify-center">
                            {/* Line separator */}
                            <div className="absolute left-[92px] right-0 border-t border-dashed border-border/20 hidden md:block" />
                            {/* Pill */}
                            <div className="relative z-10 bg-muted/65 text-muted-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <Info className="w-3.5 h-3.5 text-muted-foreground/75" />
                              <span>{dayDiff - 1} {dayDiff - 1 === 1 ? "Day" : "Days"} Gap</span>
                            </div>
                          </div>
                        );
                      }
                    }

                    return (
                      <div key={`${item.courseCode}-${idx}`} className="space-y-1">
                        <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6 py-5 px-3 md:px-4 rounded-xl border border-transparent hover:bg-muted/20 transition-all duration-200">
                          
                          {/* Date Bubble Column */}
                          <div className="w-[80px] shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5">
                            <span className="text-3xl font-black text-foreground leading-none tracking-tighter">{dayNum}</span>
                            <span className="text-xs font-bold text-muted-foreground leading-none uppercase">{monthStr}</span>
                            <span className="text-[10px] font-extrabold text-muted-foreground/70 leading-none uppercase">{weekDayStr}</span>
                          </div>

                          {/* Timeline dot node (Double Ring) */}
                          <div className="relative hidden md:flex flex-col items-center justify-center self-stretch shrink-0 w-6">
                            <div className="w-4 h-4 rounded-full border border-primary/20 bg-background z-10 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                          </div>

                          {/* Exam details content */}
                          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-extrabold tracking-wider text-primary uppercase">
                                  {item.courseCode}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md leading-none bg-primary/10 text-primary">
                                  {item.courseType}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-semibold leading-none">
                                  Slot: {item.slot}
                                </span>
                              </div>
                              <p className="text-base font-extrabold text-foreground leading-snug truncate">
                                {item.courseTitle}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold flex-wrap pt-0.5">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                                  <span>{item.examTime} (Reporting: {item.reportingTime})</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                                  <span>{item.venue}</span>
                                </span>
                              </div>
                            </div>

                            {/* Seat details */}
                            <div className="shrink-0 flex flex-col items-end md:items-end justify-center bg-muted/20 border border-border/10 rounded-xl px-4 py-2 min-w-[100px]">
                              <span className="text-lg font-black text-foreground leading-none">Seat {item.seatNo}</span>
                              {item.seatLocation !== "-" && (
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">
                                  {item.seatLocation}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Gap element if applicable */}
                        {gapElement}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
