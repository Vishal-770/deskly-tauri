import { useEffect, useMemo, useState } from "react";
import { useSemester } from "@/hooks/useSemester";
import {
  getAttendanceDetail,
  getCurrentAttendance,
  type AttendanceDetailRecord,
  type AttendanceRecord,
} from "@/lib/attendance";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { cn } from "@/lib/utils";

/* -------------------- Utility Functions -------------------- */

function calculateHoursFromTimeRange(timeRange: string): number {
  const timePart = timeRange.includes(",")
    ? timeRange.split(",")[1]
    : timeRange;
  const match = timePart.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!match) return 0;

  const [, startHour, startMin, endHour, endMin] = match.map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  return (endTime - startTime) / 60;
}

function formatDayAndTime(dayAndTime: string): string {
  const dayMap: Record<string, string> = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday",
  };

  if (dayAndTime.includes(",")) {
    const [day, time] = dayAndTime.split(",");
    const fullDay = dayMap[day] || day;
    return `${fullDay} ${time.replace("-", " - ")}`;
  }

  return dayAndTime.replace("-", " - ");
}

function calculateAttendanceNeeded(
  attended: number,
  total: number,
  minPercentage = 75,
) {
  const currentPercentage = (attended / Math.max(total, 1)) * 100;

  if (currentPercentage >= minPercentage) {
    const canSkip = Math.floor(attended / (minPercentage / 100) - total);
    return { canSkip: Math.max(0, canSkip), needToAttend: 0, isSafe: true };
  }

  const actualNeed = Math.ceil(3 * total - 4 * attended);
  return { canSkip: 0, needToAttend: Math.max(0, actualNeed), isSafe: false };
}

function CircularProgress({
  percentage,
  size = 56,
}: {
  percentage: number;
  size?: number;
}) {
  const colors =
    percentage >= 75
      ? { progress: "text-primary", text: "text-foreground" }
      : percentage >= 60
        ? { progress: "text-foreground/60", text: "text-foreground/60" }
        : { progress: "text-destructive", text: "text-destructive" };

  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={colors.progress}
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-[10px] font-bold", colors.text)}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

function AttendanceRow({
  record,
  details,
}: {
  record: AttendanceRecord;
  details: AttendanceDetailRecord[] | null;
}) {
  const attendanceStatus = calculateAttendanceNeeded(
    record.attendedClasses,
    record.totalClasses,
  );
  
  const statusColor = record.attendancePercentage >= 75 
    ? "text-primary" 
    : record.attendancePercentage >= 60 
      ? "text-foreground/60" 
      : "text-destructive";

  return (
    <AccordionItem value={record.classId} className="border-b border-border/50 last:border-0">
      <AccordionTrigger className="group hover:bg-accent/30 px-6 py-4 transition-all hover:no-underline">
        <div className="flex items-center gap-5 flex-1 text-left">
          <CircularProgress percentage={record.attendancePercentage} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                {record.courseCode}
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {record.courseType}
              </span>
            </div>
            <h3 className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
              {record.courseTitle}
            </h3>
            <p className={cn("text-[11px] mt-1 font-medium", statusColor)}>
              {attendanceStatus.isSafe
                ? attendanceStatus.canSkip > 0
                  ? `Can skip ${attendanceStatus.canSkip} classes`
                  : "On track - maintain attendance"
                : `Need to attend ${attendanceStatus.needToAttend} more classes`}
            </p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-10 text-right mr-4">
          <div className="w-16">
            <p className="text-[10px] text-muted-foreground uppercase">Slot</p>
            <p className="text-xs font-mono font-bold">{record.slot}</p>
          </div>
          <div className="w-20">
            <p className="text-[10px] text-muted-foreground uppercase">Classes</p>
            <p className="text-xs font-mono font-bold">
              {record.attendedClasses}/{record.totalClasses}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="bg-muted/10 px-6 py-4">
        {details ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
              Attendance History
            </h4>
            <div className="bg-background/50 rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-5 gap-2 p-3 text-[10px] font-bold text-muted-foreground uppercase border-b border-border/30">
                <span className="pl-2">Date</span>
                <span>Slot</span>
                <span className="col-span-2">Time</span>
                <span className="text-right pr-2">Status</span>
              </div>
              <div className="max-h-64 overflow-y-auto no-scrollbar">
                {details.map((detail, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 p-3 text-[11px] items-center hover:bg-accent/30 transition-colors border-b border-border/10 last:border-0">
                    <span className="font-medium">{detail.date}</span>
                    <span className="font-mono text-muted-foreground">{detail.slot}</span>
                    <span className="col-span-2 text-muted-foreground truncate">
                      {formatDayAndTime(detail.dayAndTime)}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full justify-self-end mr-2",
                      detail.status === "Present" ? "bg-primary/10 text-primary" :
                      detail.status === "Absent" ? "bg-destructive/10 text-destructive" :
                      "bg-foreground/10 text-foreground/60"
                    )}>
                      {detail.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function StatsOverview({
  data,
  detailsMap,
}: {
  data: AttendanceRecord[];
  detailsMap: Record<string, AttendanceDetailRecord[] | null>;
}) {
  const totals = useMemo(() => {
    const tot = data.reduce((acc, r) => acc + r.totalClasses, 0);
    const att = data.reduce((acc, r) => acc + r.attendedClasses, 0);
    const perc = tot > 0 ? (att / tot) * 100 : 0;
    
    // Calculate OD hours
    let odMinutes = 0;
    Object.values(detailsMap).forEach(details => {
      details?.filter(d => d.status === "On Duty").forEach(d => {
        odMinutes += calculateHoursFromTimeRange(d.dayAndTime) * 60;
      });
    });
    
    return {
      total: tot,
      attended: att,
      percentage: Math.round(perc),
      odHours: Math.floor(odMinutes / 60),
      odMinutes: Math.round(odMinutes % 60),
      critical: data.filter(r => r.attendancePercentage < 75).length
    };
  }, [data, detailsMap]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-5">
        <CircularProgress percentage={totals.percentage} size={64} />
        <div>
          <p className="text-2xl font-black text-foreground">{totals.percentage}%</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Overall</p>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <p className="text-2xl font-black text-foreground">{totals.attended}<span className="text-muted-foreground text-sm">/{totals.total}</span></p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Classes</p>
      </div>
      
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <p className="text-2xl font-black text-foreground">
          {totals.odHours}h {totals.odMinutes}m
        </p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">On Duty Time</p>
      </div>

      <div className={cn(
        "p-6 rounded-2xl border shadow-sm transition-colors",
        totals.critical > 0 ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
      )}>
        <p className={cn("text-2xl font-black", totals.critical > 0 ? "text-destructive" : "text-foreground")}>
          {totals.critical}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">Below 75%</p>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[] | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, AttendanceDetailRecord[] | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentSemester } = useSemester();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await getCurrentAttendance();
        if (res.success && res.data) {
          setAttendanceData(res.data);
          
          // Fetch details for each course sequentially to avoid rate limiting or congestion
          const details: Record<string, AttendanceDetailRecord[] | null> = {};
          for (const record of res.data) {
            const detailRes = await getAttendanceDetail(record.classId, record.slot);
            if (detailRes.success) {
              details[record.classId] = detailRes.data || [];
            }
          }
          setExpandedDetails(details);
        } else {
          setError(res.error || "Failed to load attendance");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [currentSemester?.id]);

  if (loading && !attendanceData) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground font-medium">
            {currentSemester?.name || "Academic Year 2024-25"}
          </p>
        </div>
      </header>

      {attendanceData && (
        <>
          <StatsOverview data={attendanceData} detailsMap={expandedDetails} />
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-xl">
            <Accordion type="single" collapsible className="w-full">
              {attendanceData.map((record) => (
                <AttendanceRow
                  key={record.classId}
                  record={record}
                  details={expandedDetails[record.classId] || null}
                />
              ))}
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
}
