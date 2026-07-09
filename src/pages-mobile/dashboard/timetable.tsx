import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { invoke } from "@tauri-apps/api/core";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { ErrorDisplay } from "@/components/error-display";
import { isNetworkError } from "@/lib/utils";
import SingleCourseExportModal from "@/components/single-course-export-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Clock,
  Calendar,
  User,
  MapPin,

  Hash,
  LayoutGrid,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  slot: string;
  venue: string;
  faculty: string;
}

interface WeeklySchedule {
  monday: ScheduleEntry[];
  tuesday: ScheduleEntry[];
  wednesday: ScheduleEntry[];
  thursday: ScheduleEntry[];
  friday: ScheduleEntry[];
  saturday: ScheduleEntry[];
  sunday: ScheduleEntry[];
}

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AttendanceFaculty {
  id: string;
  name: string;
  school: string;
}

interface AttendanceRecord {
  slNo: number;
  classId: string;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  slot: string;
  faculty: AttendanceFaculty;
  attendanceType: string;
  registrationDate: string;
  attendanceDate: string;
  attendedClasses: number;
  totalClasses: number;
  attendancePercentage: number;
  status: string;
}

interface AttendanceResponse {
  success: boolean;
  data?: AttendanceRecord[];
  semesterId?: string;
  error?: string;
}

const EMPTY: WeeklySchedule = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIdx(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function getPercentageColor(pct: number) {
  if (pct >= 75) return "text-primary";
  return "text-destructive";
}

function getCircleStrokeColor(pct: number) {
  if (pct >= 75) return "stroke-primary";
  return "stroke-destructive";
}

function getBarBgColor(pct: number) {
  if (pct >= 75) return "bg-primary";
  return "bg-destructive";
}

// ─── Attendance Hint ──────────────────────────────────────────────────────────

function AttendanceHint({ attended, total }: { attended: number; total: number }) {
  const need = Math.ceil(3 * total - 4 * attended);
  const canSkip = Math.floor((4 * attended - 3 * total) / 3);
  if (need > 0)
    return <span className="text-xs font-medium text-destructive">Attend {need} more to reach 75%</span>;
  if (canSkip > 0)
    return <span className="text-xs font-medium text-emerald-500">Can miss {canSkip} more classes</span>;
  return <span className="text-xs font-medium text-muted-foreground">On track ✓</span>;
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function ListCircularProgress({ percentage, size = 46 }: { percentage: number; size?: number }) {
  const radius = (size - 5) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle className="text-muted/15 stroke-current" strokeWidth="3" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className={`${getCircleStrokeColor(percentage)} transition-all duration-500`}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-foreground leading-none">{percentage}%</span>
    </div>
  );
}

function EmptyCircularProgress() {
  return (
    <div className="w-[46px] h-[46px] rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground shrink-0 border border-border/5">
      <Calendar className="w-5 h-5 text-muted-foreground/60" />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TimetableSkeleton() {
  return (
    <div className="space-y-6 px-2 py-4 animate-pulse font-saira">
      {/* Header: title + refresh */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-md" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      </div>

      {/* Day chip strip: 7 columns */}
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>

      <Separator />

      {/* Active day info: class count */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Class rows: circle + slot chip + code/title + time + venue */}
      <div className="divide-y divide-border/10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="w-[46px] h-[46px] rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-8 rounded" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-12 rounded ml-auto" />
              </div>
              <Skeleton className="h-3 w-full max-w-[180px]" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Drawer Component ──────────────────────────────────────────────────

function TimetableDrawer({
  item,
  open,
  onOpenChange,
  attendanceRecord,
  dayDate,
}: {
  item: ScheduleEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceRecord: AttendanceRecord | undefined;
  dayDate: Date;
}) {
  if (!item) return null;

  const hasAtt = !!attendanceRecord;
  const pct = attendanceRecord ? attendanceRecord.attendancePercentage : 0;
  const displayType = item.courseType.toLowerCase().includes("lab") ? "Lab Only" : "Theory Only";

  const details = [
    { icon: Hash,          label: "Course Code",  value: item.courseCode, color: "text-muted-foreground/60" },
    { icon: LayoutGrid,    label: "Slot",         value: item.slot,       color: "text-muted-foreground/60" },
    { icon: Clock,         label: "Class Time",   value: `${item.startTime} - ${item.endTime}`, color: "text-muted-foreground/60" },
    { icon: MapPin,        label: "Venue / Room", value: item.venue || "TBA", color: "text-muted-foreground/60" },
    { icon: User,          label: "Faculty",      value: item.faculty || "TBA", color: "text-muted-foreground/60" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8 font-saira max-h-[92vh]">
        <div className="overflow-y-auto no-scrollbar px-6 space-y-7 pt-5">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {hasAtt ? (
                <ListCircularProgress percentage={pct} size={54} />
              ) : (
                <div className="w-[54px] h-[54px] rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground shrink-0 border border-border/5">
                  <Calendar className="w-6 h-6 text-muted-foreground/60" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-sm font-medium tracking-wide text-primary uppercase">
                    {item.courseCode}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground/60">
                    ({displayType})
                  </span>
                </div>
                <h2 className="text-xl font-medium text-foreground leading-snug tracking-tight">
                  {item.courseTitle}
                </h2>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-muted/65 flex items-center justify-center text-foreground hover:bg-muted active:opacity-75 transition-colors border-none cursor-pointer shrink-0"
            >
              <span className="text-lg leading-none font-sans">×</span>
            </button>
          </div>

          {/* Attendance Status block */}
          {hasAtt && (
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground/60 uppercase leading-none">
                Attendance Status
              </p>
              
              <div className="flex items-center gap-4">
                <span className={`text-[32px] font-medium leading-none ${getPercentageColor(pct)}`}>
                  {pct}%
                </span>
                <div className="h-2.5 flex-1 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getBarBgColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground leading-none pt-0.5">
                <AttendanceHint attended={attendanceRecord.attendedClasses} total={attendanceRecord.totalClasses} />
                <span className="font-mono">{attendanceRecord.attendedClasses} / {attendanceRecord.totalClasses} classes attended</span>
              </div>
            </div>
          )}

          {/* Course Details Timeline */}
          <div className="space-y-4 pt-1">
            <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground/60 uppercase leading-none">
              Class Schedule Details
            </p>

            <div className="space-y-0">
              {details.map(({ icon: Icon, label, value, color }, index) => (
                <div key={label} className="flex gap-4 relative">
                  
                  {/* Left Column: Icon */}
                  <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-[1px]">
                    <Icon className={`w-5 h-5 ${color} shrink-0`} />
                  </div>
                  
                  {/* Middle Column: Timeline node */}
                  <div className="relative flex flex-col items-center shrink-0 w-3">
                    {/* Line */}
                    {index < details.length - 1 && (
                      <div className="absolute top-[22px] bottom-0 w-px bg-border/20 left-1/2 -translate-x-1/2" />
                    )}
                    {/* Dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/45 mt-2.5 z-10" />
                  </div>
                  
                  {/* Right Column: Text contents */}
                  <div className="min-w-0 pb-5 pt-[3px] flex-1">
                    <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>

          {/* Action: Export Modal inside the drawer */}
          <div className="pt-2">
            <SingleCourseExportModal entry={item} dayDate={dayDate} fullWidth />
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TimetablePage() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();

  const [selectedDay, setSelectedDay] = useState(() => todayIdx());
  const [weekStart] = useState<Date>(() => {
    const n = new Date(),
      d = n.getDay();
    const mon = new Date(n.setDate(n.getDate() - d + (d === 0 ? -6 : 1)));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });
  const [schedule, setSchedule] = useState<WeeklySchedule>(EMPTY);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScheduleEntry | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) navigate("/");
  }, [isLoggedIn, authLoading]);

  // Load from Cache (SWR) first
  useEffect(() => {
    try {
      const cachedTt = localStorage.getItem("deskly::cache::timetable");
      const cachedAtt = localStorage.getItem("deskly::cache::timetable_attendance");
      let hasData = false;
      if (cachedTt) {
        const parsedTt = JSON.parse(cachedTt);
        if (parsedTt && Object.values(parsedTt).some((arr: any) => arr.length > 0)) {
          setSchedule(parsedTt);
          hasData = true;
        }
      }
      if (cachedAtt) {
        const parsedAtt = JSON.parse(cachedAtt);
        if (parsedAtt && parsedAtt.length > 0) {
          setAttendance(parsedAtt);
          hasData = true;
        }
      }
      if (hasData) {
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to parse cached timetable/attendance", e);
    }
  }, []);

  async function load() {
    try {
      setError(null);
      const isScheduleEmpty = Object.values(schedule).every((arr) => arr.length === 0);
      setLoading(isScheduleEmpty);

      const [tt, att] = await Promise.all([
        invoke<ApiResult<WeeklySchedule>>("timetable_get_weekly", { semesterSubId: null }),
        invoke<AttendanceResponse>("attendance_get_current").catch(() => ({ success: false } as AttendanceResponse)),
      ]);

      let updatedTt = schedule;
      let updatedAtt = attendance;

      if (tt.success && tt.data) {
        setSchedule(tt.data);
        updatedTt = tt.data;
      } else if (tt.error) {
        setError(tt.error);
      }

      if (att.success && att.data) {
        setAttendance(att.data);
        updatedAtt = att.data;
      }

      localStorage.setItem("deskly::cache::timetable", JSON.stringify(updatedTt));
      localStorage.setItem("deskly::cache::timetable_attendance", JSON.stringify(updatedAtt));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) load();
  }, [isLoggedIn]);

  const DAY_KEYS: (keyof WeeklySchedule)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const weekDays = useMemo(() => {
    return DAY_SHORT.map((name, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        name,
        full: DAY_FULL[i],
        num: d.getDate(),
        month: d.toLocaleString("default", { month: "short" }),
        date: d,
      };
    });
  }, [weekStart]);



  const daySchedule = useMemo(() => schedule[DAY_KEYS[selectedDay]] || [], [schedule, selectedDay]);

  const attMap = useMemo(() => {
    const m = new Map<string, AttendanceRecord>();
    for (const r of attendance) {
      m.set(`${r.courseCode}::${r.courseType.toLowerCase().includes("lab") ? "lab" : "th"}`, r);
    }
    return m;
  }, [attendance]);

  const getAtt = (code: string, slot: string) => {
    return attMap.get(`${code}::${slot.toUpperCase().startsWith("L") ? "lab" : "th"}`);
  };

  const isScheduleEmpty = Object.values(schedule).every((arr) => arr.length === 0);
  const showOffline = isScheduleEmpty && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline) {
    return <OfflineDisplay onRetry={load} />;
  }

  if (authLoading || (loading && isScheduleEmpty)) {
    return <TimetableSkeleton />;
  }

  if (error && isScheduleEmpty) {
    return (
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      {/* Google Font Saira Injection */}
      <style>{`
        .font-saira {
          font-family: 'Saira', sans-serif !important;
        }
      `}</style>

      {/* Sync Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl gap-4 shrink-0">
          <p className="truncate">Sync failed: {error}</p>
          <button onClick={load} className="text-[10px] uppercase font-bold tracking-wider hover:underline shrink-0 border-none bg-transparent text-destructive">
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary shrink-0" />
            <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none truncate">
              My Timetable
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            Stay on track with your classes
          </p>
        </div>

      </header>

      {/* ── Calendar Days Horizontally Scrollable / Slidable Row ────────────────── */}
      <div className="border-b border-border/10 pb-4 overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full py-1 snap-x snap-mandatory">
          {weekDays.map((d, i) => {
            const active = selectedDay === i;

            return (
              <button
                key={d.full}
                onClick={() => setSelectedDay(i)}
                className={`relative flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all duration-200 cursor-pointer border-none min-w-[72px] shrink-0 snap-center ${
                  active
                    ? "bg-primary/10 border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-primary" : "opacity-55"}`}>
                  {d.name}
                </span>
                
                <span className={`text-[18px] font-semibold leading-none ${active ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                  {d.num}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Day Info ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight leading-none">
            {weekDays[selectedDay].full}
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-none">
            {weekDays[selectedDay].date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        {!loading && (
          <span className="text-xs font-semibold bg-muted/20 text-muted-foreground px-3 py-1 rounded-full shrink-0">
            {daySchedule.length} {daySchedule.length === 1 ? "Class" : "Classes"}
          </span>
        )}
      </div>

      {/* ── Class List (Clean, Separator-divided layout like attendance page) ─── */}
      <div className="pt-2">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl w-full" />
            ))}
          </div>
        ) : daySchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No classes scheduled</p>
            <p className="text-xs text-muted-foreground">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {daySchedule.map((item, idx) => {
              const att = getAtt(item.courseCode, item.slot);
              
              const attendancePct = att ? att.attendancePercentage : 0;
              const hasAttendance = !!att;
              
              const barColor = hasAttendance ? getBarBgColor(attendancePct) : "bg-muted";

              return (
                <button
                  key={`${item.courseCode}-${item.slot}-${idx}`}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-4 py-4 text-left border-none bg-transparent cursor-pointer active:bg-muted/15 transition-colors"
                >
                  {/* Left: Circular progress matching attendance circular progress */}
                  {hasAttendance ? (
                    <ListCircularProgress percentage={attendancePct} size={46} />
                  ) : (
                    <EmptyCircularProgress />
                  )}

                  {/* Middle: Details block with slot next to code and time aligned right */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 leading-none">
                      <span className="text-sm font-semibold tracking-wide text-foreground uppercase">
                        {item.courseCode}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground/60 font-mono leading-none">
                        ({item.slot})
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground/75 font-mono leading-none ml-auto">
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate leading-none">
                      {item.courseTitle}
                    </p>
                  </div>
                  {/* Right: Progress bar & fraction details */}
                  {hasAttendance ? (
                    <div className="shrink-0 text-right space-y-1.5">
                      <p className="text-base font-semibold text-foreground leading-none tabular-nums">
                        {att.attendedClasses} <span className="text-muted-foreground/45 text-xs font-normal">/ {att.totalClasses}</span>
                      </p>
                      <div className="w-16 h-[3px] bg-muted/30 rounded-full overflow-hidden ml-auto">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.min(attendancePct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Drawer ────────────────────────────────────────────────────── */}
      {selected && (
        <TimetableDrawer
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          item={selected}
          attendanceRecord={getAtt(selected.courseCode, selected.slot)}
          dayDate={weekDays[selectedDay].date}
        />
      )}
    </div>
  );
}
