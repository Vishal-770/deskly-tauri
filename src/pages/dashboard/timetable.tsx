import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { getTimetableWeekly, type WeeklySchedule, type ScheduleEntry } from "@/lib/features";
import { cn } from "@/lib/utils";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { useSemester } from "@/hooks/useSemester";

const dayShortNames: Record<keyof WeeklySchedule, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

interface SessionCardProps {
  session: ScheduleEntry;
}

function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {session.courseCode}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {session.slot}
              </span>
            </div>
            <h4 className="mt-1 text-sm font-medium text-foreground/80 leading-snug">
              {session.courseTitle}
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {session.startTime} – {session.endTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{session.venue}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>{session.faculty}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <Calendar className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-lg font-medium text-muted-foreground">
        No classes scheduled
      </p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        Enjoy your free day!
      </p>
    </div>
  );
}

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<keyof WeeklySchedule | null>(null);
  const { currentSemester, loading: semesterLoading } = useSemester();

  // Get current day for default tab
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
  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <ErrorDisplay
            title="Unable to Load Timetable"
            message={error}
            onRetry={fetchTimetable}
          />
        </div>
      </main>
    );
  }
  if (!timetable) return null;

  const days = Object.keys(timetable) as (keyof WeeklySchedule)[];
  const sortedDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as (keyof WeeklySchedule)[];

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
             Academic Schedule
          </span>
          <h1 className="text-4xl font-light mt-2 mb-1">Timetable</h1>
          <p className="text-muted-foreground">
            {currentSemester?.name} · Weekly overview
          </p>
        </div>

        {/* Day tabs */}
        <div className="flex flex-wrap gap-2">
          {sortedDays.map((day) => {
            const sessions = timetable[day] || [];
            const isActive = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={cn(
                  "relative rounded-full border-0 bg-muted/50 px-4 py-2 text-sm font-medium transition-all hover:bg-muted",
                  isActive && "bg-foreground text-background shadow-md"
                )}
              >
                <span className="hidden sm:inline capitalize">{day}</span>
                <span className="sm:hidden">{dayShortNames[day]}</span>
                {sessions.length > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                      isActive ? "bg-background/30" : "bg-primary/10 text-primary"
                    )}
                  >
                    {sessions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day content */}
        <div className="mt-8 transition-all">
          {activeDay && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {timetable[activeDay] && timetable[activeDay].length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {timetable[activeDay].map((session, index) => (
                    <SessionCard
                      key={`${session.courseCode}-${index}`}
                      session={session}
                    />
                  ))}
                </div>
              ) : (
                <EmptyDay />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
