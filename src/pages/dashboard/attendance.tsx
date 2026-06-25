import { useState, useEffect, useMemo } from "react";
import { useNavigate, useMatch, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentAttendance, AttendanceRecord } from "@/lib/attendance";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import {
  BookOpen,
  CheckCircle,
  UserCheck,
  AlertCircle,
  User,
} from "lucide-react";

// ─── Loader Skeleton Layout ───────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-muted/65 ${className}`} />;
}

function AttendanceSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-border/20 flex items-center gap-4">
        <Sk className="w-8 h-8 rounded-full" />
        <div className="space-y-2">
          <Sk className="h-6 w-36 rounded-full" />
          <Sk className="h-3 w-56 rounded-full" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-b border-border/15">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Sk className="w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-2 w-full">
              <Sk className="h-2 w-16 rounded-full" />
              <Sk className="h-4 w-24 rounded-full" />
              <Sk className="h-1.5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-6 pt-2">
        <div className="space-y-2">
          <Sk className="h-4 w-32 rounded-full" />
          <Sk className="h-2.5 w-48 rounded-full" />
        </div>
        
        <div className="flex flex-col border-t border-border/10 divide-y divide-border/10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5">
              <div className="flex items-start gap-4 flex-1">
                <Sk className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2.5 flex-1">
                  <div className="flex gap-2">
                    <Sk className="h-3 w-20 rounded-full" />
                    <Sk className="h-3 w-12 rounded-full" />
                    <Sk className="h-3 w-16 rounded-full" />
                  </div>
                  <Sk className="h-4 w-64 rounded-full" />
                  <Sk className="h-2.5 w-40 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-3 sm:pt-0">
                <Sk className="h-6 w-16 rounded-full" />
                <Sk className="h-5 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ percentage, size = 48 }: { percentage: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  let stroke = "text-destructive";
  if (percentage >= 75) stroke = "text-chart-2";
  else if (percentage >= 60) stroke = "text-chart-3";
  else if (percentage >= 40) stroke = "text-chart-4";

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-muted/30 stroke-current"
          strokeWidth="3.5"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${stroke} stroke-current transition-all duration-500`}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-[10px] font-black text-foreground leading-none">{percentage}%</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCourseTypeStyle(type: string): string {
  const c = type.trim().toUpperCase();
  if (c.includes("EMBEDDED THEORY")) return "text-primary";
  if (c.includes("EMBEDDED LAB")) return "text-chart-2";
  if (c.includes("THEORY")) return "text-primary";
  if (c.includes("LAB")) return "text-chart-2";
  if (c.includes("ONLINE")) return "text-chart-1";
  if (c.includes("SOFT SKILL") || c.includes("SKILL")) return "text-chart-4";
  return "text-muted-foreground";
}

function AttendanceHint({ attended, total }: { attended: number; total: number }) {
  const need = Math.ceil(3 * total - 4 * attended);
  const canSkip = Math.floor((4 * attended - 3 * total) / 3);

  if (need > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/8 px-2 py-0.5 rounded-full">
        Attend {need} more
      </span>
    );
  }
  if (canSkip > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-chart-2 bg-chart-2/8 px-2 py-0.5 rounded-full">
        Can miss {canSkip}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
      On track
    </span>
  );
}

function AttendanceCard({ item, index }: { item: AttendanceRecord; index: number }) {
  const typeColor = getCourseTypeStyle(item.courseType);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        navigate(`/dashboard/attendance/${item.classId}`, { state: { record: item } });
      }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 border-b border-border/10 hover:bg-muted/5 cursor-pointer transition-colors min-w-0 w-full"
    >
      {/* Course Info */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* Progress circle */}
        <div className="shrink-0 pt-0.5">
          <CircularProgress percentage={item.attendancePercentage} size={52} />
        </div>
        
        {/* Texts */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground/45 tabular-nums shrink-0">
              {item.slNo ?? index + 1}
            </span>
            <span className="text-sm md:text-base font-extrabold tracking-widest text-primary uppercase leading-none shrink-0">
              {item.courseCode}
            </span>
            <span className="font-mono text-[10px] font-black text-muted-foreground/60 bg-muted/70 px-1.5 py-0.5 rounded-md leading-none shrink-0">
              {item.slot}
            </span>
            <span className={`text-xs font-semibold shrink-0 ${typeColor}`}>
              {item.courseType}
            </span>
          </div>
          
          <p className="text-sm md:text-base lg:text-lg font-bold text-foreground leading-snug">
            {item.courseTitle}
          </p>
          
          {item.faculty?.name && (
            <p className="text-xs md:text-sm text-muted-foreground/80 font-medium truncate flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              <span>{item.faculty.name}</span>
              {item.faculty.school && (
                <span className="text-[10px] md:text-xs text-muted-foreground/50 font-bold uppercase">
                  · {item.faculty.school}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Attendance Stats & Action */}
      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t border-border/5 sm:border-t-0 pt-3 sm:pt-0">
        <div className="flex items-baseline gap-1">
          <span className="text-xl md:text-2xl lg:text-3xl font-black text-foreground tabular-nums leading-none">
            {item.attendedClasses}
          </span>
          <span className="text-muted-foreground/30 text-sm font-light">/</span>
          <span className="text-sm md:text-base font-bold text-muted-foreground tabular-nums leading-none">
            {item.totalClasses}
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground/50 font-medium ml-1">classes</span>
        </div>
        
        <div className="w-28 flex justify-end">
          <AttendanceHint attended={item.attendedClasses} total={item.totalClasses} />
        </div>
      </div>
    </div>
  );
}
// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [semesterId, setSemesterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::attendance");
    const cachedSem = localStorage.getItem("deskly::cache::attendance_semester");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AttendanceRecord[];
        if (parsed.length > 0) {
          setAttendance(parsed);
          if (cachedSem) setSemesterId(cachedSem);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached attendance", e);
      }
    }
  }, []);

  async function load() {
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;

      setLoading(attendance.length > 0 ? false : true);

      const res = await getCurrentAttendance();
      if (res.success && res.data) {
        setAttendance(res.data);
        const sem = res.semesterId || "";
        setSemesterId(sem);
        localStorage.setItem("deskly::cache::attendance", JSON.stringify(res.data));
        localStorage.setItem("deskly::cache::attendance_semester", sem);
      } else {
        setError(res.error ?? "Failed to fetch attendance records.");
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
      totalAttended += r.attendedClasses || 0;
      totalClasses += r.totalClasses || 0;
    });
    const overallPercentage =
      totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
    return { totalCourses: attendance.length, totalAttended, totalClasses, overallPercentage };
  }, [attendance]);



  // Detect if we're on a child route (detail page) — if so, render only the Outlet
  const isDetailRoute = useMatch("/dashboard/attendance/:classId");

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  // If we're on the detail child route, render the Outlet (detail page) inside the shell
  if (isDetailRoute) {
    return shell(<Outlet />);
  }

  if (authLoading || (loading && attendance.length === 0)) {
    return shell(<AttendanceSkeleton />);
  }

  if (error && attendance.length === 0) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-8">
      {error && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl gap-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shrink-0" />
            <span className="truncate">Sync failed: {error} (Viewing cached data)</span>
          </div>
          <button 
            onClick={load}
            className="text-[10px] uppercase font-bold tracking-wider hover:underline focus:outline-none shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary shrink-0" />
              My Attendance
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {semesterId
                ? <>Semester: <code className="font-mono font-bold text-foreground">{semesterId}</code></>
                : "Semester Overview"}
            </p>
          </div>
        </div>
      </header>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-b border-border/15">
        {[
          {
            label: "Courses",
            value: stats.totalCourses,
            sub: "Registered",
            icon: <BookOpen className="w-4 h-4 md:w-5 h-5 text-primary" />,
          },
          {
            label: "Attended",
            value: stats.totalAttended,
            sub: `of ${stats.totalClasses} classes`,
            icon: <CheckCircle className="w-4 h-4 md:w-5 h-5 text-primary" />,
          },
          {
            label: "Overall",
            value: `${stats.overallPercentage}%`,
            sub: "Average Attendance",
            icon: <UserCheck className="w-4 h-4 md:w-5 h-5 text-primary" />,
          },
          {
            label: "Min. Required",
            value: "75%",
            sub: "Good standing Limit",
            icon: <AlertCircle className="w-4 h-4 md:w-5 h-5 text-primary" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 md:gap-4 py-2 min-w-0"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground/60 uppercase tracking-wider leading-none">
                {s.label}
              </p>
              <p className="text-lg md:text-2xl lg:text-3xl font-black text-foreground mt-1.5 leading-none">{s.value}</p>
              <p className="text-[9px] md:text-xs text-muted-foreground/65 font-bold mt-1.5 leading-none truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── List Section ────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm md:text-base lg:text-lg font-bold text-foreground tracking-tight">Course Attendance</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{attendance.length} courses tracked</p>
        </div>

        {attendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <UserCheck className="w-8 h-8 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-bold text-foreground">No attendance records found</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later or refresh.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col border-t border-border/10">
            {attendance.map((item, idx) => (
              <AttendanceCard key={`${item.classId}-${idx}`} item={item} index={idx} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
