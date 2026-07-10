import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentAttendance, AttendanceRecord } from "@/lib/attendance";
import { isNetworkError } from "@/lib/utils";
import { ErrorDisplay } from "@/components/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import {
  UserCheck,
  CalendarDays,
  User,
  School,
  Hash,
  LayoutGrid,
  RefreshCw,
  Trophy,
  TrendingUp,
  Clock,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { DrawerSelect } from "@/components/ui/drawer-select";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getCourseBadgeStyle(type: string) {
  const t = type.toLowerCase();
  if (t.includes("lab")) {
    return "bg-primary/10 text-primary border border-primary/15";
  }
  return "bg-muted text-muted-foreground border border-border/20";
}

function formatCourseType(type: string) {
  const t = type.toLowerCase();
  if (t.includes("embedded theory") || t.includes("theory")) return "Theory Only";
  if (t.includes("embedded lab") || t.includes("lab")) return "Lab Only";
  return type;
}

// ─── Circular Progress for stats ──────────────────────────────────────────────

function StatCircularProgress({
  percentage,
  size = 64,
  icon: Icon,
}: {
  percentage: number;
  size?: number;
  icon: React.ElementType;
}) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle className="text-muted/15 stroke-current" strokeWidth="4.5" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className="stroke-primary transition-all duration-500"
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-primary">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

// ─── Circular Progress for list rows ──────────────────────────────────────────

function ListCircularProgress({ percentage, size = 48 }: { percentage: number; size?: number }) {
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
      <span className="absolute text-[11px] font-semibold text-foreground leading-none">{Math.round(percentage)}%</span>
    </div>
  );
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AttendanceSkeleton() {
  return (
    <div className="space-y-8 px-2 py-4 animate-pulse font-saira">
      {/* Header: icon + title + refresh */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-md" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-3.5 w-36" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      </div>

      {/* Stats: 2 circular columns with separator */}
      <div className="flex items-center py-1">
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <Skeleton className="w-[60px] h-[60px] rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="w-px h-14 mx-4 bg-border/20 shrink-0" />
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <Skeleton className="w-[60px] h-[60px] rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section label + filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg shrink-0" />
      </div>

      {/* Course rows: circle progress + code/title + count + bar */}
      <div className="space-y-1 divide-y divide-border/10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="w-[46px] h-[46px] rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              <Skeleton className="h-3 w-full max-w-[200px]" />
            </div>
            <div className="shrink-0 space-y-1.5 text-right">
              <Skeleton className="h-4 w-14 ml-auto" />
              <Skeleton className="h-1 w-16 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attendance Row Component ──────────────────────────────────────────────────

function AttendanceRow({
  item,
  onSelect,
}: {
  item: AttendanceRecord;
  onSelect: () => void;
}) {
  const pct = item.attendancePercentage;
  const badgeStyle = getCourseBadgeStyle(item.courseType);
  const displayType = formatCourseType(item.courseType);

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-4 py-4 text-left active:bg-muted/15 transition-colors border-none bg-transparent cursor-pointer"
    >
      <ListCircularProgress percentage={pct} size={46} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap leading-none">
          <span className="text-sm font-semibold tracking-wide text-foreground uppercase">
            {item.courseCode}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeStyle}`}>
            {displayType}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate leading-none">
          {item.courseTitle}
        </p>
      </div>

            <div className="shrink-0 min-w-19 text-right space-y-1.5">
              <p className="text-sm font-semibold text-foreground leading-none tabular-nums whitespace-nowrap">
                {item.courseType.toLowerCase().includes("lab") ? item.attendedClasses / 2 : item.attendedClasses}{" "}
                <span className="text-muted-foreground/45 text-xs font-normal">
                  / {item.courseType.toLowerCase().includes("lab") ? item.totalClasses / 2 : item.totalClasses}
                </span>
        </p>
        <div className="w-16 h-0.75 bg-muted/30 rounded-full overflow-hidden ml-auto">
          <div
            className={`h-full rounded-full ${getBarBgColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Detail Drawer Component ──────────────────────────────────────────────────

function AttendanceDrawer({
  item,
  open,
  onOpenChange,
  onViewDetail,
}: {
  item: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetail: () => void;
}) {
  if (!item) return null;

  const pct = item.attendancePercentage;
  const displayType = formatCourseType(item.courseType);

  const details = [
    { icon: Hash,          label: "Course Code",   value: item.courseCode },
    { icon: LayoutGrid,    label: "Slot",          value: item.slot },
    { icon: GraduationCap, label: "Course Type",   value: item.courseType },
    { icon: User,          label: "Faculty",       value: item.faculty?.name ?? "—" },
    { icon: School,        label: "School",        value: item.faculty?.school ?? "—" },
    { icon: CalendarDays,  label: "Registered On", value: item.registrationDate || "—" },
    { icon: Clock,         label: "Last Updated",  value: item.attendanceDate || "—" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8 font-saira max-h-[92vh]">
        <div className="overflow-y-auto no-scrollbar px-6 space-y-7 pt-5">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <ListCircularProgress percentage={pct} size={54} />
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

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground leading-none pt-0.5">
              <AttendanceHint attended={item.attendedClasses} total={item.totalClasses} courseType={item.courseType} />
              <span className="font-mono tabular-nums whitespace-nowrap shrink-0 text-right">
                {item.courseType.toLowerCase().includes("lab") ? item.attendedClasses / 2 : item.attendedClasses} /{" "}
                {item.courseType.toLowerCase().includes("lab") ? item.totalClasses / 2 : item.totalClasses}{" "}
                {item.courseType.toLowerCase().includes("lab") ? "labs" : "classes"} attended
              </span>
            </div>

            {/* View Full Details button */}
            <button
              onClick={onViewDetail}
              className="w-full flex items-center justify-between mt-3 px-4 py-3 rounded-xl bg-muted/30 border border-border/10 text-xs font-semibold text-foreground hover:bg-muted/50 active:opacity-85 transition-colors cursor-pointer"
            >
              <span>View Detailed Session Log</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* Course Information Details */}
          <div className="space-y-3 pt-1">
            <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground/60 uppercase leading-none">
              Course Information
            </p>

            <div className="divide-y divide-border/10">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3">
                  {/* Left Column: Icon Box */}
                  <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground/75 shrink-0" />
                  </div>
                  
                  {/* Right Column: Text contents */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold leading-none mb-1">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isDetailRoute = useMatch("/dashboard/attendance/:classId");
  const isOnline = useOnlineStatus();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);
  const [filterType, setFilterType] = useState("all");



  useEffect(() => {
    try {
      const cached = localStorage.getItem("deskly::cache::attendance");
      if (cached) {
        const parsed = JSON.parse(cached) as AttendanceRecord[];
        if (parsed.length > 0) {
          setAttendance(parsed);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  async function load() {
    if (authLoading || !isLoggedIn) return;
    setError(null);
    setLoading(attendance.length === 0);
    try {
      const res = await getCurrentAttendance();
      if (res.success && res.data) {
        setAttendance(res.data);
        const sem = res.semesterId ?? "";
        localStorage.setItem("deskly::cache::attendance", JSON.stringify(res.data));
        localStorage.setItem("deskly::cache::attendance_semester", sem);
      } else {
        setError(res.error ?? "Failed to fetch attendance.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) load();
  }, [isLoggedIn, authLoading]);

  const stats = useMemo(() => {
    let totalAttended = 0;
    let totalClasses = 0;
    attendance.forEach((r) => {
      totalAttended += r.attendedClasses ?? 0;
      totalClasses += r.totalClasses ?? 0;
    });
    return {
      totalCourses: attendance.length,
      totalAttended,
      totalClasses,
      overallPercentage: totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0,
    };
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    if (filterType === "theory") {
      return attendance.filter((item) => {
        const t = item.courseType.toLowerCase();
        return t.includes("theory") && !t.includes("lab");
      });
    }
    if (filterType === "lab") {
      return attendance.filter((item) => item.courseType.toLowerCase().includes("lab"));
    }
    return attendance;
  }, [attendance, filterType]);

  if (isDetailRoute) {
    return <Outlet />;
  }

  const showOffline = attendance.length === 0 && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline) {
    return <OfflineDisplay onRetry={load} />;
  }

  if (authLoading || (loading && attendance.length === 0)) {
    return <AttendanceSkeleton />;
  }

  if (error && attendance.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 px-2 py-4 font-saira select-none overscroll-y-contain">
      {/* Google Font Saira Injection */}
      <style>{`
        .font-saira {
          font-family: 'Saira', sans-serif !important;
        }
      `}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary shrink-0" />
            <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none truncate">
              My Attendance
            </h1>
          </div>
        </div>
        <button
          onClick={load}
          className="p-1 hover:opacity-80 text-foreground shrink-0 border-0 bg-transparent cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* ── Stats (Clean columns, no boxes, split by vertical line separator) ──── */}
      <div className="flex items-center py-1">
        {/* Average Attendance Column */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <StatCircularProgress percentage={stats.overallPercentage} icon={TrendingUp} size={60} />
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
              Average Attendance
            </p>
            <p className="text-2xl font-semibold text-foreground leading-none py-1">
              {stats.overallPercentage}%
            </p>
          </div>
        </div>

        <Separator orientation="vertical" className="h-14 mx-4 bg-border/20 shrink-0" />

        {/* Classes Attended Column */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <StatCircularProgress percentage={Math.round((stats.totalAttended / (stats.totalClasses || 1)) * 100)} icon={CalendarDays} size={60} />
          <div className="min-w-0 space-y-0.5 shrink-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
              Classes Attended
            </p>
            <p className="text-xl font-semibold text-foreground leading-none py-1 tabular-nums whitespace-nowrap">
              {stats.totalAttended} / {stats.totalClasses}
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* ── Course List Section ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 leading-none">
              <span className="w-1 h-4 bg-primary rounded-full shrink-0" />
              <h2 className="text-lg font-medium tracking-tight text-foreground leading-none">
                Course Attendance
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-none">{filteredAttendance.length} courses</p>
          </div>

          {/* Filter selector */}
          <DrawerSelect
            value={filterType}
            onValueChange={setFilterType}
            title="Filter Courses"
            triggerClassName="h-8 px-3"
            options={[
              { value: "all", label: "All Courses" },
              { value: "theory", label: "Theory Only" },
              { value: "lab", label: "Lab Only" },
            ]}
          />
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <UserCheck className="w-10 h-10 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No records found</p>
            <p className="text-xs text-muted-foreground">Check filter settings or reload.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filteredAttendance.map((item, idx) => (
              <AttendanceRow
                key={`${item.classId}-${idx}`}
                item={item}
                onSelect={() => setSelected(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom Motivation Section (subtle separator-aligned bar) ──────────── */}
      <div className="pt-2">
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-foreground leading-none">Keep it up!</p>
              <p className="text-xs text-muted-foreground leading-tight">
                You're doing great. Aim for 75%+ overall attendance.
              </p>
            </div>
          </div>
          {/* Wave indicator inline SVG */}
          <div className="w-16 h-8 shrink-0 flex items-center justify-center">
            <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
              <path
                d="M1 20 C 15 20, 15 5, 30 10 C 45 15, 45 2, 59 2"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="58" cy="2" r="2.5" fill="currentColor" className="text-primary" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ────────────────────────────────────────────────────── */}
      {selected && (
        <AttendanceDrawer
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          item={selected}
          onViewDetail={() => {
            setSelected(null);
            navigate(`/dashboard/attendance/${selected.classId}`, { state: { record: selected } });
          }}
        />
      )}
    </div>
  );
}
