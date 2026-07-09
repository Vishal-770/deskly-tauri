import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "@/router";
import { getAttendanceDetail, AttendanceDetailRecord, AttendanceRecord } from "@/lib/attendance";

import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,

  School,
  MinusCircle,
} from "lucide-react";

// ─── Circular Arc Progress ────────────────────────────────────────────────────

function BigCircularProgress({ percentage }: { percentage: number }) {
  const size = 68;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  let stroke = "stroke-destructive";
  if (percentage >= 75) stroke = "stroke-emerald-500";
  else if (percentage >= 50) stroke = "stroke-amber-500";

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle className="text-muted/15 stroke-current" strokeWidth="4.5" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className={`${stroke} transition-all duration-700`}
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
      <span className="absolute text-sm font-semibold text-foreground leading-none">{percentage}%</span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.trim().toLowerCase();
  const isPresent = s === "present" || s === "p" || s === "1";
  const isAbsent = s === "absent" || s === "a" || s === "0";
  const isOd = s.includes("od") || s.includes("duty") || s === "on duty";

  if (isPresent) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-lg leading-none">
        <CheckCircle2 className="w-3 h-3" />
        Present
      </span>
    );
  }
  if (isAbsent) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/5 border border-destructive/10 px-2 py-0.5 rounded-lg leading-none">
        <XCircle className="w-3 h-3" />
        Absent
      </span>
    );
  }
  if (isOd) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-500/5 border border-sky-500/10 px-2 py-0.5 rounded-lg leading-none">
        <span className="w-3.5 h-3.5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center text-[7px] font-bold border border-sky-500/20 shrink-0">OD</span>
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/20 border border-border/10 px-2 py-0.5 rounded-lg leading-none">
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function DetailSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      <div className="flex items-center gap-2">
        <Sk className="h-6 w-32" />
      </div>
      <div className="flex justify-between items-center gap-4">
        <div className="space-y-2 flex-1">
          <Sk className="h-4 w-20" />
          <Sk className="h-6 w-48" />
          <Sk className="h-4 w-32" />
        </div>
        <Sk className="w-16 h-16 rounded-full shrink-0" />
      </div>
      <Sk className="h-44 w-full rounded-2xl" />
      <div className="space-y-4 pt-2">
        <Sk className="h-8 w-28" />
        <Sk className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendanceDetailPage() {
  const { classId } = useParams("/dashboard/attendance/:classId");
  const location = useLocation();
  const navigate = useNavigate();

  const [record, setRecord] = useState<AttendanceRecord | undefined>(location.state?.record);
  const [details, setDetails] = useState<AttendanceDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

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

  if (loading && !record) {
    return <DetailSkeleton />;
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 font-saira py-16">
        <p className="text-muted-foreground text-sm">No course data found.</p>
        <button
          onClick={() => navigate("/dashboard/attendance")}
          className="text-xs font-semibold text-sky-500 underline underline-offset-2 bg-transparent border-none cursor-pointer"
        >
          Go back to Attendance
        </button>
      </div>
    );
  }

  const isLab = record.courseType.toLowerCase().includes("lab");
  const displayType = isLab ? "Lab Only" : "Theory Only";
  const badgeStyle = isLab
    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
    : "bg-sky-500/10 text-sky-400 border border-sky-500/10";

  // Calculate detailed fractions from logs

  const odSlots = details.filter((d) => {
    const s = d.status.trim().toLowerCase();
    return s.includes("od") || s.includes("duty") || s === "on duty";
  }).length;

  const totalClasses = record.totalClasses;
  const attendedClasses = record.attendedClasses;
  const absentClasses = totalClasses - attendedClasses;

  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      {/* Google Font Saira Injection */}
      <style>{`
        .font-saira {
          font-family: 'Saira', sans-serif !important;
        }
      `}</style>

      {/* ── Header Row (Back Chevron + Title) ─────────────────────────────────── */}
      <header className="flex items-center gap-1">
        <button
          onClick={() => navigate("/dashboard/attendance")}
          className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground bg-transparent border-none p-0 cursor-pointer text-sm font-semibold"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <span>My Attendance</span>
        </button>
      </header>

      {/* ── Course Hero Block ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 leading-none flex-wrap">
            <span className="text-sm font-semibold tracking-wide text-sky-500 uppercase leading-none">
              {record.courseCode}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded leading-none ${badgeStyle}`}>
              {displayType}
            </span>
          </div>
          <h1 className="text-[20px] font-medium text-foreground leading-snug tracking-tight">
            {record.courseTitle}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono leading-none pt-0.5 flex-wrap">
            {record.faculty?.name && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                {record.faculty.name}
              </span>
            )}
            {record.faculty?.school && (
              <>
                <span>|</span>
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  {record.faculty.school}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Attendance circular progress */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <BigCircularProgress percentage={record.attendancePercentage} />
          <p className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider leading-none">
            Attendance
          </p>
        </div>
      </div>

      {/* ── 2x2 Grid Stats Card ───────────────────────────────────────────────── */}
      <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl grid grid-cols-2 overflow-hidden relative">
        {/* Inner vertical separator line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/10 -translate-x-1/2" />
        {/* Inner horizontal separator line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border/10 -translate-y-1/2" />

        {/* cell 1: Total Classes */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground/60 leading-none">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Classes</span>
          </div>
          <span className="text-3xl font-semibold text-foreground leading-none">{totalClasses}</span>
        </div>

        {/* cell 2: Present */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground/60 leading-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Present</span>
          </div>
          <span className="text-3xl font-semibold text-foreground leading-none">{attendedClasses}</span>
        </div>

        {/* cell 3: On Leave */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground/60 leading-none">
            <MinusCircle className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">On Leave</span>
          </div>
          <span className="text-3xl font-semibold text-foreground leading-none">{odSlots}</span>
        </div>

        {/* cell 4: Absent */}
        <div className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground/60 leading-none">
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Absent</span>
          </div>
          <span className="text-3xl font-semibold text-foreground leading-none">{absentClasses}</span>
        </div>
      </div>

      {/* ── Session Log Section ───────────────────────────────────────────────── */}
      <div className="space-y-4 pt-1">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground tracking-tight leading-none uppercase">
            Session Log
          </h2>
          <p className="text-xs text-muted-foreground/75 leading-none">
            {details.length || record.totalClasses} sessions recorded
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Sk key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : details.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-[#0e0e0f]/20 border border-border/10 rounded-2xl">
            <Calendar className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No session logs available</p>
            <p className="text-xs text-muted-foreground">Detailed logs haven't been synchronized.</p>
          </div>
        ) : (
          <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
            {details.map((row, i) => (
              <div
                key={`${row.serialNo}-${i}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/5 transition-colors duration-150"
              >
                {/* Left: Serial Number */}
                <span className="text-xs font-semibold text-muted-foreground/35 tabular-nums w-4 shrink-0 text-left">
                  {row.serialNo ?? i + 1}
                </span>

                {/* Middle: Date and Time Range */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {row.date}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono leading-none">
                    {row.dayAndTime || "10:30 AM – 11:30 AM"}
                  </p>
                </div>

                {/* Slot Code (in blue) */}
                <span className="text-xs font-semibold text-sky-500 font-mono shrink-0">
                  {row.slot || record.slot}
                </span>

                {/* Right: Status badge */}
                <div className="shrink-0">
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
