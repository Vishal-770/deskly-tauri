import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { invoke } from "@tauri-apps/api/core";

import { ErrorDisplay } from "@/components/error-display";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import {
  Clock,
  MapPin,
  FileText,
  CalendarRange,
  ChevronRight,
} from "lucide-react";
import { generateExamGroupIcs } from "@/lib/calendar-export-utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

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
  const cleanStr = str.trim();
  const parts = cleanStr.split(/[-/]/);
  if (parts.length < 3) return new Date();
  
  const day = parseInt(parts[0], 10);
  const monthPart = parts[1].trim();
  const year = parseInt(parts[2], 10);
  
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  
  let month = 0;
  if (isNaN(Number(monthPart))) {
    const monthStr = monthPart.toLowerCase();
    month = months[monthStr.substring(0, 3)] ?? 0;
  } else {
    month = parseInt(monthPart, 10) - 1; // 1-indexed to 0-indexed
  }
  
  return new Date(year, month, day);
}

function getCalendarDayDifference(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
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

function ExamSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <Sk className="h-7 w-32" />
          <Sk className="h-3.5 w-48" />
        </div>
        <Sk className="h-8 w-20 rounded-xl" />
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        <Sk className="h-14 w-28 rounded-2xl shrink-0" />
        <Sk className="h-14 w-28 rounded-2xl shrink-0" />
        <Sk className="h-14 w-28 rounded-2xl shrink-0" />
      </div>
      <div className="space-y-3">
        <Sk className="h-5 w-40" />
        <div className="bg-muted/10 border border-border/10 rounded-2xl divide-y divide-border/10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1">
                <Sk className="w-11 h-11 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Sk className="h-4 w-24" />
                  <Sk className="h-4 w-40" />
                  <Sk className="h-3.5 w-32" />
                </div>
              </div>
              <Sk className="w-8 h-8 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExamSchedulePage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();

  const [groups, setGroups] = useState<ExamScheduleGroup[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected exam details for the bottom drawer
  const [selectedExam, setSelectedExam] = useState<ExamScheduleEntry | null>(null);


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

  // Load fresh from backend
  async function load() {
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;

      setLoading(groups.length > 0 ? false : true);

      const res = await invoke<ExamScheduleResponse>("exam_schedule_get", { semesterSubId: null });
      if (res.success && res.data) {
        setGroups(res.data);
        localStorage.setItem("deskly::cache::exams", JSON.stringify(res.data));
        if (res.data.length > 0) {
          const tabNames = res.data.map(g => g.examType);
          if (!selectedTab || !tabNames.includes(selectedTab)) {
            setSelectedTab(res.data[0].examType);
          }
        } else {
          setGroups([]);
          localStorage.removeItem("deskly::cache::exams");
        }
      } else {
        const errMsg = res.error ?? "Failed to fetch exam schedule.";
        if (errMsg.includes("Could not find exam schedule table")) {
          setGroups([]);
          localStorage.removeItem("deskly::cache::exams");
          setError("Could not find exam schedule table");
        } else {
          setError(errMsg);
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes("Could not find exam schedule table")) {
        setGroups([]);
        localStorage.removeItem("deskly::cache::exams");
        setError("Could not find exam schedule table");
      } else {
        setError(errMsg);
      }
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

  // Formatted Tabs list
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

  const shell = (children: React.ReactNode) => <>{children}</>;

  if (!isOnline && groups.length === 0) {
    return shell(<OfflineDisplay onRetry={load} />);
  }

  if (authLoading || (loading && groups.length === 0)) {
    return shell(<ExamSkeleton />);
  }

  const isNotReleased = error?.includes("Could not find exam schedule table");

  if (error && groups.length === 0 && !isNotReleased) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-6 h-6 text-sky-500 shrink-0 mt-0.5 flex items-center justify-center">
            {/* Blue Calendar grid icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
              <path d="M8 18h.01" />
              <path d="M12 18h.01" />
              <path d="M16 18h.01" />
            </svg>
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
              My Exams
            </h1>
            <p className="text-xs text-muted-foreground leading-none pt-0.5">Your exam schedule at a glance</p>
          </div>
        </div>
      </header>

      {/* ── Exam Type Tabs ────────────────────────────────────────────────────── */}
      {groups.length > 0 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 shrink-0">
          {tabsList.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex flex-col items-start gap-1.5 px-4 py-3 rounded-2xl border text-left cursor-pointer transition-all duration-150 shrink-0 min-w-[130px]
                  ${active
                    ? "bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "bg-muted/30 dark:bg-[#0e0e0f]/40 border-border/40 dark:border-border/10 text-muted-foreground hover:bg-muted/20"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wide text-xs uppercase flex items-center gap-1.5">
                    {tab.label}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0
                      ${active ? "bg-white" : "bg-muted-foreground/45"}`}
                    />
                  </span>
                </div>
                <span className={`text-[10px] font-semibold leading-none
                  ${active ? "text-white/80" : "text-muted-foreground/60"}`}
                >
                  {tab.range}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content View ────────────────────────────────────────────────────── */}
      {isNotReleased ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
          <CalendarRange className="w-8 h-8 text-muted-foreground/20" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Exams Not Uploaded</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs px-4">
              The university has not released or uploaded the exam schedule for this semester on VTOP yet.
            </p>
          </div>
        </div>
      ) : activeSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-bold text-foreground">No exam schedules loaded</p>
            <p className="text-xs text-muted-foreground mt-1">Select a semester or check VTOP records.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 leading-none uppercase">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500">
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
                <path d="M8 14h.01" />
                <path d="M12 14h.01" />
                <path d="M16 14h.01" />
              </svg>
              {formatExamTypeLabel(selectedTab)} Schedule
            </h2>
          </div>

          <div className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
            {activeSchedules.map((item, idx) => {
              const examDate = parseDateStr(item.examDate);
              const dayNum = examDate.getDate();
              const weekDayStr = examDate.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
              
              // Calculate gap indicators between this exam and the next
              let gapElement = null;
              if (idx < activeSchedules.length - 1) {
                const nextExam = activeSchedules[idx + 1];
                const nextDate = parseDateStr(nextExam.examDate);
                const dayDiff = getCalendarDayDifference(examDate, nextDate);
                if (dayDiff > 1) {
                  const gapDays = dayDiff - 1;
                  gapElement = (
                    <div className="flex justify-center py-2 bg-muted/5">
                      <span className="bg-sky-500/10 text-sky-400 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{gapDays} {gapDays === 1 ? "Day" : "Days"} Gap</span>
                      </span>
                    </div>
                  );
                }
              }

              return (
                <div key={`${item.courseCode}-${idx}`} className="flex flex-col divide-y divide-border/10">
                  <div
                    onClick={() => setSelectedExam(item)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/5 transition-colors duration-150"
                  >
                    {/* Date bubble */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border border-border/10 bg-muted/20 text-muted-foreground">
                        <span className="text-base font-bold leading-none">{dayNum}</span>
                        <span className="text-[8px] font-bold uppercase leading-none mt-1">{weekDayStr}</span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black tracking-wider text-sky-400 uppercase leading-none">
                            {item.courseCode}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/75 bg-muted/40 px-1.5 py-0.5 rounded leading-none">
                            Slot: {item.slot}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground truncate leading-snug">
                          {item.courseTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground/60 leading-none flex items-center gap-1 pt-0.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                          <span>{item.examTime.split("-")[0].trim()}</span>
                          <span className="mx-1">•</span>
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" />
                          <span className="truncate">{item.venue}</span>
                        </p>
                      </div>
                    </div>

                    {/* Seat & Icon */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg border border-border/10 bg-muted/10 text-foreground/80 leading-none">
                        Seat {item.seatNo}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/45" />
                    </div>
                  </div>

                  {/* Render Day Gap element if applicable */}
                  {gapElement}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Slide-up Drawer for Details ─────────────────────────────────────── */}
      <Drawer
        open={selectedExam !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedExam(null);
        }}
      >
        <DrawerContent className="pb-8 font-saira max-h-[85vh]">
          <div className="overflow-y-auto no-scrollbar px-6 space-y-6 pt-5">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border/10 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 leading-none">
                  Exam Details ({selectedExam?.examType})
                </span>
                <h3 className="text-xl font-bold text-foreground leading-none">
                  {selectedExam?.courseTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedExam ? `${selectedExam.courseCode} • ${selectedExam.examDate}` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="w-8 h-8 rounded-full bg-muted/65 flex items-center justify-center text-foreground hover:bg-muted active:opacity-75 transition-colors border-none cursor-pointer shrink-0 font-sans"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            {/* Drawer Body details */}
            {selectedExam && (
              <div className="space-y-5">
                {/* Visual Cards grid of details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/15 border border-border/10 rounded-xl space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Course Type</span>
                    <p className="text-xs font-bold text-foreground leading-none">{selectedExam.courseType}</p>
                  </div>
                  <div className="p-3 bg-muted/15 border border-border/10 rounded-xl space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Class ID</span>
                    <p className="text-xs font-bold text-foreground leading-none">{selectedExam.classId}</p>
                  </div>
                  <div className="p-3 bg-muted/15 border border-border/10 rounded-xl space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Slot & Session</span>
                    <p className="text-xs font-bold text-foreground leading-none">{selectedExam.slot} ({selectedExam.examSession})</p>
                  </div>
                  <div className="p-3 bg-muted/15 border border-border/10 rounded-xl space-y-1">
                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Seat Number</span>
                    <p className="text-xs font-bold text-sky-400 leading-none">Seat {selectedExam.seatNo}</p>
                  </div>
                </div>

                {/* Larger rows for Venue & Timing */}
                <div className="space-y-3">
                  <div className="p-4 bg-muted/15 border border-border/10 rounded-2xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Exam Timing</span>
                      <p className="text-sm font-bold text-foreground leading-none">{selectedExam.examTime}</p>
                      <p className="text-xs text-muted-foreground/80 leading-none pt-0.5">Reporting Time: {selectedExam.reportingTime}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/15 border border-border/10 rounded-2xl flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none">Venue / Room</span>
                      <p className="text-sm font-bold text-foreground leading-none">{selectedExam.venue}</p>
                      {selectedExam.seatLocation !== "-" && (
                        <p className="text-xs text-muted-foreground/80 leading-none pt-0.5">Location: {selectedExam.seatLocation}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calendar Add Button */}
                <button
                  onClick={async () => {
                    const icsContent = generateExamGroupIcs([selectedExam]);
                    const filename = `${selectedExam.courseCode}_Exam.ics`;
                    try {
                      await invoke("save_calendar_file", {
                        content: icsContent,
                        filename,
                      });
                    } catch (e) {
                      console.error("Failed to save calendar file", e);
                    }
                  }}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 active:opacity-75 transition-all text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  <CalendarRange className="w-4 h-4 shrink-0" />
                  <span>Add to Calendar</span>
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
