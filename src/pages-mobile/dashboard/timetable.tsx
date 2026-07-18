import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { invoke } from "@tauri-apps/api/core";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { ErrorDisplay } from "@/components/error-display";
import { isNetworkError } from "@/lib/utils";
import SingleCourseExportModal from "@/components/single-course-export-modal";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Clock,
  Calendar,
  User,
  MapPin,
  Hash,
  LayoutGrid,
  ChevronRight,
  X,
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
  if (pct >= 75) return "text-emerald-500";
  return "text-destructive";
}

function getCircleStrokeColor(pct: number) {
  if (pct >= 75) return "stroke-emerald-500";
  return "stroke-destructive";
}

function getBarBgColor(pct: number) {
  if (pct >= 75) return "bg-emerald-500";
  return "bg-destructive";
}

function formatCourseType(type: string) {
  const t = type.toLowerCase();
  if (t.includes("embedded theory") || t.includes("theory")) return "Theory Only";
  if (t.includes("embedded lab") || t.includes("lab")) return "Lab Only";
  return type;
}

// ─── Attendance Hint ──────────────────────────────────────────────────────────

function AttendanceHint({ attended, total, courseType }: { attended: number; total: number; courseType?: string }) {
  if (total === 0) {
    return <span className="text-xs font-medium text-muted-foreground">No classes conducted yet</span>;
  }
  const isLab = courseType?.toLowerCase().includes("lab") ?? false;
  const factor = isLab ? 2 : 1;
  const unit = isLab ? "lab" : "class";
  const unitPlural = isLab ? "labs" : "classes";

  const rawNeed = 3 * total - 4 * attended;
  const need = Math.ceil(rawNeed / factor);

  const rawCanSkip = Math.floor((4 * attended - 3 * total) / 3);
  const canSkip = Math.floor(rawCanSkip / factor);

  if (need > 0) {
    return (
      <span className="text-xs font-medium text-destructive">
        Attend {need} more {need === 1 ? unit : unitPlural} to reach 75%
      </span>
    );
  }
  if (canSkip === 0) {
    const nextSkipNeed = isLab 
      ? Math.ceil((3 * total - 4 * attended + 6) / 2)
      : (3 * total - 4 * attended + 3);
    return (
      <span className="text-xs font-medium text-emerald-500">
        Can skip 1 if you attend {nextSkipNeed} more {nextSkipNeed === 1 ? unit : unitPlural}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-emerald-500">
      Can skip {canSkip} more {canSkip === 1 ? unit : unitPlural}
    </span>
  );
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
      <span className="absolute text-[10px] font-bold text-foreground leading-none">{Math.round(percentage)}%</span>
    </div>
  );
}

function EmptyCircularProgress() {
  return (
    <div className="w-[46px] h-[46px] rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground shrink-0 border border-border/20">
      <Calendar className="w-5 h-5 text-muted-foreground/50" />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/65 ${className}`} />;
}

function TimetableSkeleton() {
  return (
    <div className="space-y-6 px-2 py-4 animate-pulse font-saira">
      <div className="flex items-center gap-2">
        <Sk className="w-6 h-6 rounded-md" />
        <Sk className="h-7 w-36" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <Sk key={i} className="h-16 rounded-[20px]" />
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <Sk className="h-5 w-32" />
        {[...Array(5)].map((_, i) => (
          <Sk key={i} className="h-20 w-full rounded-[24px]" />
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
  const displayType = formatCourseType(item.courseType);

  const details = [
    { icon: Hash,          label: "Course Code",  value: item.courseCode },
    { icon: LayoutGrid,    label: "Slot",         value: item.slot },
    { icon: Clock,         label: "Class Time",   value: `${item.startTime} - ${item.endTime}` },
    { icon: MapPin,        label: "Venue / Room", value: item.venue || "TBA" },
    { icon: User,          label: "Faculty",      value: item.faculty || "TBA" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8 font-saira max-h-[92vh]">
        <div className="overflow-y-auto no-scrollbar px-6 space-y-6 pt-6">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {item.courseCode}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  ({displayType})
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground leading-snug tracking-tight">
                {item.courseTitle}
              </h2>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all border-none cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Attendance Status block */}
          {hasAtt && (
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none">
                Attendance Status
              </p>
              
              <div className="flex items-center gap-4">
                <span className={`text-3xl font-extrabold leading-none ${getPercentageColor(pct)}`}>
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
                <AttendanceHint attended={attendanceRecord.attendedClasses} total={attendanceRecord.totalClasses} courseType={item.courseType} />
                <span className="font-mono tabular-nums whitespace-nowrap shrink-0 text-right">
                  {item.courseType.toLowerCase().includes("lab") ? attendanceRecord.attendedClasses / 2 : attendanceRecord.attendedClasses} /{" "}
                  {item.courseType.toLowerCase().includes("lab") ? attendanceRecord.totalClasses / 2 : attendanceRecord.totalClasses}{" "}
                  {item.courseType.toLowerCase().includes("lab") ? "labs" : "classes"} attended
                </span>
              </div>
            </div>
          )}

          {/* Course Details List */}
          <div className="space-y-3 pt-1">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none">
              Class Schedule Details
            </p>

            <div className="divide-y divide-border/15 border-t border-b border-border/15">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-center gap-3 shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide leading-none">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground text-right truncate max-w-[60%]">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Modal */}
          <div className="pt-1">
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

  const getAtt = (code: string, courseType: string) => {
    const isLab = courseType.toLowerCase().includes("lab");
    return attMap.get(`${code}::${isLab ? "lab" : "th"}`);
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
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain relative">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Sync Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-[20px]">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-2">
        <Clock className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
          My Timetable
        </h1>
      </header>

      {/* Calendar Days Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-2 px-2 pb-0.5">
        {weekDays.map((d, i) => {
          const active = selectedDay === i;
          return (
            <button
              key={d.full}
              onClick={() => setSelectedDay(i)}
              className={`py-3 px-3.5 rounded-[20px] transition-all cursor-pointer border flex flex-col items-center gap-1 shrink-0 min-w-[64px]
                ${active
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-card/80 border-border/40 text-muted-foreground hover:bg-muted/10 backdrop-blur-md"
                }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-primary-foreground/90" : "text-muted-foreground/60"}`}>
                {d.name}
              </span>
              <span className={`text-base font-extrabold leading-none ${active ? "text-primary-foreground" : "text-foreground"}`}>
                {d.num}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Day Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest leading-none">
            {weekDays[selectedDay].full}
          </h2>
          <p className="text-xs text-muted-foreground/60 font-semibold">
            {weekDays[selectedDay].date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>
        </div>
        {!loading && (
          <span className="text-xs font-bold bg-muted/20 border border-border/20 text-muted-foreground px-3 py-1 rounded-full shrink-0">
            {daySchedule.length} {daySchedule.length === 1 ? "Class" : "Classes"}
          </span>
        )}
      </div>

      {/* Class Cards List */}
      {daySchedule.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-center bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md">
          <Calendar className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No classes scheduled</p>
          <p className="text-xs text-muted-foreground">Enjoy your day off!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {daySchedule.map((item, idx) => {
            const att = getAtt(item.courseCode, item.courseType);
            const attendancePct = att ? att.attendancePercentage : 0;
            const hasAttendance = !!att;
            const displayType = formatCourseType(item.courseType);

            return (
              <div
                key={`${item.courseCode}-${item.slot}-${idx}`}
                onClick={() => setSelected(item)}
                className="p-4.5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md flex items-center justify-between gap-4 active:opacity-75 hover:bg-muted/5 transition-all cursor-pointer"
              >
                {/* Left: Circular progress or Empty */}
                {hasAttendance ? (
                  <ListCircularProgress percentage={attendancePct} size={48} />
                ) : (
                  <EmptyCircularProgress />
                )}

                {/* Middle: Details column */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide leading-none">
                      {item.courseCode}
                    </span>
                    <span>&bull;</span>
                    <span className="uppercase">{displayType}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{item.slot}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug truncate">
                    {item.courseTitle}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 font-mono leading-none pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                      {item.startTime} - {item.endTime}
                    </span>
                    {item.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                        {item.venue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Attendance count & Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  {hasAttendance && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground leading-none tabular-nums">
                        {item.courseType.toLowerCase().includes("lab") ? att.attendedClasses / 2 : att.attendedClasses}{" "}
                        <span className="text-muted-foreground/45 text-xs font-normal">
                          / {item.courseType.toLowerCase().includes("lab") ? att.totalClasses / 2 : att.totalClasses}
                        </span>
                      </p>
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <TimetableDrawer
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          item={selected}
          attendanceRecord={getAtt(selected.courseCode, selected.courseType)}
          dayDate={weekDays[selectedDay].date}
        />
      )}
    </div>
  );
}
