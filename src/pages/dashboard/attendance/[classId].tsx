import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "@/router";
import { getAttendanceDetail, AttendanceDetailRecord, AttendanceRecord } from "@/lib/attendance";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  BarChart3,
} from "lucide-react";

// ─── Circular Arc Progress ────────────────────────────────────────────────────

function BigCircularProgress({ percentage }: { percentage: number }) {
  const size = 80;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  let stroke = "text-destructive";
  if (percentage >= 75) stroke = "text-chart-2";
  else if (percentage >= 60) stroke = "text-chart-3";
  else if (percentage >= 40) stroke = "text-chart-4";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle className="text-muted/30 stroke-current" strokeWidth="5" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className={`${stroke} stroke-current transition-all duration-700`}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-black text-foreground leading-none block">{percentage}%</span>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.trim().toLowerCase();
  const isPresent = s === "present" || s === "p" || s === "1";
  const isAbsent = s === "absent" || s === "a" || s === "0";

  if (isPresent) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-chart-2 bg-chart-2/10 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Present
      </span>
    );
  }
  if (isAbsent) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">
        <XCircle className="w-3 h-3" />
        Absent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getCourseTypeColor(type: string): string {
  const c = type.trim().toUpperCase();
  if (c.includes("THEORY")) return "text-primary";
  if (c.includes("LAB")) return "text-chart-2";
  if (c.includes("ONLINE")) return "text-chart-1";
  if (c.includes("SKILL")) return "text-chart-4";
  return "text-muted-foreground";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function DetailSkeleton() {
  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-border/20">
        <Sk className="w-8 h-8 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Sk className="h-5 w-48" />
          <Sk className="h-3 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px] space-y-3">
            <div className="flex justify-between">
              <Sk className="h-3 w-14" />
              <Sk className="h-4 w-4 rounded" />
            </div>
            <Sk className="h-6 w-10" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/20">
            <Sk className="h-4 w-6" />
            <Sk className="h-4 w-24" />
            <Sk className="h-4 w-16" />
            <Sk className="h-4 flex-1" />
            <Sk className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendanceDetailPage() {
  const { classId } = useParams("/dashboard/attendance/:classId");
  const location = useLocation();
  const navigate = useNavigate();

  // Record passed from the list page via router state, with cached fallback
  const [record, setRecord] = useState<AttendanceRecord | undefined>(location.state?.record);

  const [details, setDetails] = useState<AttendanceDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!record && classId) {
      const cached = localStorage.getItem("deskly::cache::attendance");
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as AttendanceRecord[];
          const found = parsed.find((r) => String(r.classId) === String(classId));
          if (found) {
            setRecord(found);
          }
        } catch (e) {
          console.error("Failed to parse cached attendance for fallback", e);
        }
      }
    }
  }, [classId, record]);

  useEffect(() => {
    if (!classId || !record) return;

    async function load() {
      try {
        const res = await getAttendanceDetail(classId!, record!.slot);
        if (res.success && res.data) {
          setDetails(res.data);
        } else {
          setError(res.error ?? "Failed to load attendance details.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classId, record]);

  const presentCount = details.filter((d) => {
    const s = d.status.trim().toLowerCase();
    return s === "present" || s === "p" || s === "1";
  }).length;

  const absentCount = details.filter((d) => {
    const s = d.status.trim().toLowerCase();
    return s === "absent" || s === "a" || s === "0";
  }).length;

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  if (!record) {
    return shell(
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground text-sm">No course data found.</p>
        <button
          onClick={() => navigate("/dashboard/attendance")}
          className="text-xs font-bold text-primary underline underline-offset-2"
        >
          Go back to Attendance
        </button>
      </div>
    );
  }

  if (loading) {
    return shell(<DetailSkeleton />);
  }

  if (error) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const need = Math.ceil(3 * record.totalClasses - 4 * record.attendedClasses);
  const canSkip = Math.floor((4 * record.attendedClasses - 3 * record.totalClasses) / 3);

  return shell(
    <div className="w-full space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20">
        <button
          onClick={() => navigate("/dashboard/attendance")}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 duration-150" />
          Back to Attendance
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-extrabold text-primary tracking-widest uppercase">
                {record.courseCode}
              </span>
              <span className="font-mono text-xs font-black text-muted-foreground/60 bg-muted/60 px-2 py-0.5 rounded-md">
                {record.slot}
              </span>
              <span className={`text-xs font-semibold ${getCourseTypeColor(record.courseType)}`}>
                {record.courseType}
              </span>
            </div>
            <h1 className="text-base font-bold text-foreground mt-1 leading-snug">
              {record.courseTitle}
            </h1>
            {record.faculty?.name && (
              <div className="flex items-center gap-1.5 mt-2">
                <User className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <span className="text-xs text-muted-foreground/70 font-semibold">
                  {record.faculty.name}
                  {record.faculty.school && (
                    <span className="text-muted-foreground/45 font-bold uppercase ml-1.5">· {record.faculty.school}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Big circular progress */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <BigCircularProgress percentage={record.attendancePercentage} />
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Attendance</p>
          </div>
        </div>
      </header>

      {/* ── Summary Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Classes</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-foreground leading-none">{record.totalClasses}</span>
          </div>
        </div>

        <div className="bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Present</span>
            <CheckCircle2 className="w-4 h-4 text-chart-2" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-foreground leading-none">{record.attendedClasses}</span>
            {details.length > 0 && presentCount !== record.attendedClasses && (
              <p className="text-[9px] text-muted-foreground/60 font-semibold mt-1">{presentCount} logged</p>
            )}
          </div>
        </div>

        <div className="bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Absent</span>
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-foreground leading-none">{record.totalClasses - record.attendedClasses}</span>
            {details.length > 0 && absentCount !== (record.totalClasses - record.attendedClasses) && (
              <p className="text-[9px] text-muted-foreground/60 font-semibold mt-1">{absentCount} logged</p>
            )}
          </div>
        </div>

        <div className="bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {need > 0 ? "Need to Attend" : "Can Miss"}
            </span>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3">
            {need > 0 ? (
              <>
                <span className="text-xl font-black text-destructive leading-none">{need}</span>
                <p className="text-[9px] text-muted-foreground/60 font-semibold mt-1">to reach 75%</p>
              </>
            ) : canSkip > 0 ? (
              <>
                <span className="text-xl font-black text-chart-2 leading-none">{canSkip}</span>
                <p className="text-[9px] text-muted-foreground/60 font-semibold mt-1">classes safely</p>
              </>
            ) : (
              <>
                <span className="text-xl font-black text-foreground leading-none">0</span>
                <p className="text-[9px] text-muted-foreground/60 font-semibold mt-1">On track at 75%</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Date-wise Log ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-border/20 mb-1">
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Session Log</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{details.length} sessions recorded</p>
          </div>
        </div>

        {details.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-bold text-foreground">No session data available</p>
            <p className="text-xs text-muted-foreground">Detailed log hasn't been recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5 pt-2">
            {details.map((row, i) => (
              <div
                key={`${row.serialNo}-${i}`}
                className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl hover:bg-muted/10 transition-colors duration-150 border border-transparent hover:border-border/20"
              >
                {/* Serial */}
                <span className="text-[11px] font-bold text-muted-foreground/35 tabular-nums w-5 shrink-0 text-right">
                  {row.serialNo ?? i + 1}
                </span>

                {/* Date */}
                <div className="min-w-0 w-24 sm:w-28 shrink-0">
                  <p className="text-xs font-bold text-foreground truncate">{row.date}</p>
                </div>

                {/* Slot */}
                <div className="shrink-0 w-14 sm:w-16">
                  <span className="font-mono text-[10px] font-black text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-md leading-none">
                    {row.slot}
                  </span>
                </div>

                {/* Day & Time */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-xs text-muted-foreground/70 font-medium truncate">{row.dayAndTime}</p>
                </div>

                {/* Status badge */}
                <div className="shrink-0 ml-auto">
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
