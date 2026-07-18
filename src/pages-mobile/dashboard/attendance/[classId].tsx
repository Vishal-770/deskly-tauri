import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "@/router";
import { getAttendanceDetail, AttendanceDetailRecord, AttendanceRecord } from "@/lib/attendance";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "lucide-react";

// ─── Circular Progress ────────────────────────────────────────────────────────

function BigCircularProgress({ percentage }: { percentage: number }) {
  const size = 68;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const stroke = percentage >= 75 ? "stroke-emerald-500" : "stroke-destructive";

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
      <span className="absolute text-sm font-bold text-foreground leading-none">{percentage}%</span>
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 leading-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Present
      </span>
    );
  }
  if (isAbsent) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 leading-none">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
        Absent
      </span>
    );
  }
  if (isOd) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/20 leading-none">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-muted-foreground bg-muted/20 border border-border/20 leading-none">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
      {status}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/65 ${className}`} />;
}

function DetailSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira">
      <div className="p-5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Sk className="h-4 w-20" />
          <Sk className="h-6 w-48" />
          <Sk className="h-4 w-32" />
        </div>
        <Sk className="w-16 h-16 rounded-full shrink-0" />
      </div>
      <Sk className="h-28 w-full rounded-[24px]" />
      <div className="space-y-3 pt-2">
        <Sk className="h-5 w-28" />
        {[...Array(4)].map((_, i) => (
          <Sk key={i} className="h-16 w-full rounded-[24px]" />
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
          className="text-xs font-semibold text-primary underline underline-offset-2 bg-transparent border-none cursor-pointer"
        >
          Go back to Attendance
        </button>
      </div>
    );
  }

  const isLab = record.courseType.toLowerCase().includes("lab");
  const displayType = isLab ? "Lab Only" : "Theory Only";

  const odSlots = details.filter((d) => {
    const s = d.status.trim().toLowerCase();
    return s.includes("od") || s.includes("duty") || s === "on duty";
  }).length;

  const totalClasses = isLab ? record.totalClasses / 2 : record.totalClasses;
  const attendedClasses = isLab ? record.attendedClasses / 2 : record.attendedClasses;
  const absentClasses = totalClasses - attendedClasses;

  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain relative">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Course Hero Card ─────────────────────────────────────────────────── */}
      <div className="p-5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md flex items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
            <span className="text-xs font-bold text-primary uppercase tracking-wide leading-none">{record.courseCode}</span>
            <span>&bull;</span>
            <span className="uppercase">{displayType}</span>
            <span>&bull;</span>
            <span className="font-mono">{record.slot}</span>
          </div>
          <h1 className="text-lg font-bold text-foreground leading-snug">
            {record.courseTitle}
          </h1>
          <p className="text-xs text-muted-foreground/60 leading-none">
            {record.faculty?.name} {record.faculty?.school ? `(${record.faculty.school})` : ""}
          </p>
        </div>

        {/* Circular progress */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <BigCircularProgress percentage={record.attendancePercentage} />
          <span className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest leading-none">
            Status
          </span>
        </div>
      </div>

      {/* ── 4-Column Stats Card ────────────────────────────────────────────── */}
      <div className="p-5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md flex items-center justify-between text-center">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none mb-2">
            {isLab ? "Total Labs" : "Total Classes"}
          </p>
          <p className="text-2xl font-black text-foreground leading-none">{totalClasses}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/15 shrink-0 mx-1" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none mb-2">
            Present
          </p>
          <p className="text-2xl font-black text-emerald-500 leading-none">{attendedClasses}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/15 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none mb-2">
            OD
          </p>
          <p className="text-2xl font-black text-foreground leading-none">{odSlots}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/15 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none mb-2">
            Absent
          </p>
          <p className="text-2xl font-black text-destructive leading-none">{absentClasses}</p>
        </div>
      </div>

      {/* ── Session Log Section ───────────────────────────────────────────────── */}
      <section className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest leading-none">
            Session Log
          </h2>
          <span className="text-xs text-muted-foreground/60 font-semibold">
            {details.length || record.totalClasses} sessions
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Sk key={i} className="h-16 w-full rounded-[24px]" />
            ))}
          </div>
        ) : details.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md">
            <Calendar className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No session logs available</p>
            <p className="text-xs text-muted-foreground">Detailed logs haven't been synchronized.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {details.map((row, i) => (
              <div
                key={`${row.serialNo}-${i}`}
                className="p-4.5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md flex items-center justify-between gap-4"
              >
                {/* Left: Serial Number */}
                <span className="text-xs font-semibold text-muted-foreground/30 tabular-nums w-5 shrink-0">
                  {row.serialNo ?? i + 1}
                </span>

                {/* Middle: Date, Time & Slot */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
                    <span className="text-xs font-semibold text-primary font-mono leading-none">
                      {row.slot || record.slot}
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono">{row.dayAndTime || "10:30 AM – 11:30 AM"}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug truncate">
                    {row.date}
                  </p>
                </div>

                {/* Right: Status badge */}
                <div className="shrink-0">
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
