import { useEffect, useState, useMemo } from "react";
import { Clock, User, Calendar } from "lucide-react";
import { getTimetableWeekly, type WeeklySchedule, type ScheduleEntry } from "@/lib/features";
import { cn } from "@/lib/utils";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { useSemester } from "@/hooks/useSemester";
import { motion } from "framer-motion";

const dayShortNames: Record<keyof WeeklySchedule, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function SessionItem({ session, index }: { session: ScheduleEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col gap-4 py-8 border-b border-border/50 hover:bg-muted/5 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {session.courseCode}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {session.slot}
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
            {session.courseTitle}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-8 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Time</p>
            <div className="flex items-center gap-2">
               <Clock className="w-3 h-3 text-muted-foreground" />
               <p className="text-lg font-black tracking-tightest text-foreground font-mono">
                 {session.startTime} – {session.endTime}
               </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Venue</p>
            <p className="text-lg font-black tracking-tightest text-foreground">{session.venue}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Faculty</p>
            <p className="text-xs font-bold text-foreground">{session.faculty}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyDay() {
  return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Calendar className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <p className="text-xl font-black text-foreground tracking-tight">No classes scheduled</p>
      <p className="text-sm text-muted-foreground font-medium opacity-50">Enjoy your free day!</p>
    </div>
  );
}

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<keyof WeeklySchedule | null>(null);
  const { currentSemester, loading: semesterLoading } = useSemester();

  const currentDay = useMemo(() => {
    const days: (keyof WeeklySchedule)[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[new Date().getDay()];
  }, []);

  const fetchTimetable = async () => {
    if (!currentSemester) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await getTimetableWeekly(currentSemester.id);
      if (res.success && res.data) {
        setTimetable(res.data);
        if (!activeDay) {
            setActiveDay(currentDay);
        }
      } else {
        setError(res.error ?? "Failed to load timetable");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [currentSemester]);

  if (loading || semesterLoading) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTimetable} />;
  if (!timetable) return null;

  const sortedDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as (keyof WeeklySchedule)[];

  return (
    <div className="p-6 lg:p-10 space-y-12 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-primary rounded-full" />
             <h1 className="text-4xl md:text-5xl font-black tracking-tightest text-foreground uppercase">
               Timetable
             </h1>
           </div>
           <p className="text-sm text-muted-foreground font-medium opacity-50 tracking-wide pl-4">
             {currentSemester?.name || "Semester Academic Overview"}
           </p>
        </div>

        {/* Day Tabs */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 border-b border-border pb-1">
          {sortedDays.map((day) => {
            const sessions = timetable[day] || [];
            const isActive = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={cn(
                  "group relative pb-4 transition-all",
                  isActive ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                   <span className="text-sm font-black uppercase tracking-widest">
                     <span className="hidden sm:inline">{day}</span>
                     <span className="sm:hidden">{dayShortNames[day]}</span>
                   </span>
                   {sessions.length > 0 && (
                     <span className={cn(
                       "text-[10px] font-black px-1.5 py-0.5 rounded-full border transition-colors",
                       isActive ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border opacity-50 group-hover:opacity-100"
                     )}>
                       {sessions.length}
                     </span>
                   )}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeDay"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Day Content */}
      <section>
        {activeDay && (
          <div key={activeDay} className="flex flex-col">
            {timetable[activeDay] && timetable[activeDay].length > 0 ? (
              timetable[activeDay].map((session: ScheduleEntry, index: number) => (
                <SessionItem
                  key={`${session.courseCode}-${index}`}
                  session={session}
                  index={index}
                />
              ))
            ) : (
              <EmptyDay />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
