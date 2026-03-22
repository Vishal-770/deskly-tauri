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
import { StatItem } from "@/components/stat-item";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Percent, ScrollText, Calendar, Coffee } from "lucide-react";

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

/* -------------------- Helper Components -------------------- */


function CircularProgress({
  percentage,
  size = 48,
}: {
  percentage: number;
  size?: number;
}) {
  const isCritical = percentage < 75;
  const isSafe = percentage >= 80;
  
  const strokeColor = isCritical 
    ? "text-destructive" 
    : isSafe 
      ? "text-primary" 
      : "text-foreground/60";

  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative group/circle" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/10"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className={strokeColor}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-[9px] font-black tracking-tighter", isCritical ? "text-destructive" : "text-foreground/50")}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

function AttendanceItem({
  record,
  details,
  index,
}: {
  record: AttendanceRecord;
  details: AttendanceDetailRecord[] | null;
  index: number;
}) {
  const status = useMemo(() => {
    const minPercentage = 75;
    const attended = record.attendedClasses;
    const total = record.totalClasses;
    const currentPct = (attended / Math.max(total, 1)) * 100;

    if (currentPct >= minPercentage) {
      const canSkip = Math.floor(attended / (minPercentage / 100) - total);
      return { canSkip: Math.max(0, canSkip), isSafe: true };
    }
    const needToAttend = Math.ceil(3 * total - 4 * attended);
    return { needToAttend: Math.max(0, needToAttend), isSafe: false };
  }, [record]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <AccordionItem value={record.classId} className="border-b border-border/50 group/item">
        <AccordionTrigger className="hover:no-underline py-8 px-2 transition-all hover:bg-muted/5">
          <div className="flex items-center gap-8 text-left flex-1">
            <CircularProgress percentage={record.attendancePercentage} />
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 leading-none">
                  {record.courseCode}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">
                  {record.courseType}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tightest text-foreground group-hover/item:text-primary transition-colors truncate">
                {record.courseTitle}
              </h3>
              <div className="flex items-center gap-2">
                {status.isSafe ? (
                  <CheckCircle2 className="w-3 h-3 text-primary opacity-40" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-destructive opacity-40" />
                )}
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  status.isSafe ? "text-primary/60" : "text-destructive/80"
                )}>
                  {status.isSafe 
                    ? (status.canSkip ?? 0) > 0 ? `Can skip ${status.canSkip} sess.` : "On track"
                    : `Attend ${status.needToAttend} more sess.`}
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-16 mr-8 text-right shrink-0">
               <div className="w-12">
                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mb-1">Slot</p>
                 <p className="text-sm font-black tracking-tightest text-foreground">{record.slot}</p>
               </div>
               <div className="w-20">
                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mb-1">Session</p>
                 <p className="text-sm font-black tracking-tightest text-foreground">{record.attendedClasses} <span className="opacity-20">/ {record.totalClasses}</span></p>
               </div>
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="bg-muted/5 rounded-3xl mb-4 px-8 py-10">
          {details ? (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                  Detailed Session History
                </h4>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                   <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Present</div>
                   <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-destructive" /> Absent</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {details.map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      detail.status === "Present" 
                        ? "bg-primary/[0.02] border-primary/10 hover:bg-primary/[0.04]" 
                        : detail.status === "Absent"
                          ? "bg-destructive/[0.02] border-destructive/10 hover:bg-destructive/[0.04]"
                          : "bg-muted/30 border-border/50 hover:bg-muted/40"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 opacity-30" />
                        <p className="text-[10px] font-black tracking-tighter text-foreground/70 uppercase">{detail.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 opacity-30" />
                        <p className="text-[9px] font-bold text-muted-foreground/60 tracking-widest uppercase truncate max-w-[120px]">
                           {detail.dayAndTime.split(',')[1] || detail.dayAndTime}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                      detail.status === "Present" ? "text-primary" :
                      detail.status === "Absent" ? "text-destructive" :
                      "text-muted-foreground"
                    )}>
                      {detail.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
              <Loader />
              <p className="text-[10px] font-black uppercase tracking-widest">Hydrating Session Data...</p>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  );
}

/* -------------------- Page -------------------- */

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

  const totals = useMemo(() => {
    if (!attendanceData) return null;
    const tot = attendanceData.reduce((acc, r) => acc + r.totalClasses, 0);
    const att = attendanceData.reduce((acc, r) => acc + r.attendedClasses, 0);
    const perc = tot > 0 ? (att / tot) * 100 : 0;
    
    // Calculate OD hours
    let odMinutes = 0;
    Object.values(expandedDetails).forEach(details => {
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
      critical: attendanceData.filter(r => r.attendancePercentage < 75).length
    };
  }, [attendanceData, expandedDetails]);

  if (loading && !attendanceData) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-6 lg:p-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-12">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
             <h1 className="text-4xl md:text-6xl font-black tracking-tightest text-foreground uppercase leading-none">
               Presence Tracking
             </h1>
           </div>
           <p className="text-sm text-muted-foreground font-bold opacity-30 tracking-widest pl-4 uppercase">
             Live Attendance status — {currentSemester?.name}
           </p>
        </div>

        {/* Hero Stats */}
        {totals && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-20">
             <StatItem 
               label="Overall Percent" 
               value={`${totals.percentage}%`} 
               subValue="Weighted"
               icon={Percent}
             />
             <StatItem 
               label="On Duty" 
               value={`${totals.odHours}h`} 
               subValue={`${totals.odMinutes}m`}
               icon={Coffee}
             />
              <StatItem 
               label="Total Cleared" 
               value={totals.attended} 
               subValue={`/ ${totals.total} Sess.`}
               icon={ScrollText}
             />
             <StatItem 
               label="Critical Courses" 
               value={totals.critical} 
               subValue="Below 75%"
               icon={AlertCircle}
               critical={totals.critical > 0}
             />
          </div>
        )}
      </header>

      {/* Attendance List */}
      <section className="space-y-4">
        {attendanceData && (
          <Accordion type="single" collapsible className="w-full space-y-4 border-none">
            {attendanceData.map((record, index) => (
              <AttendanceItem
                key={record.classId}
                index={index}
                record={record}
                details={expandedDetails[record.classId] || null}
              />
            ))}
          </Accordion>
        )}
      </section>
    </div>
  );
}
