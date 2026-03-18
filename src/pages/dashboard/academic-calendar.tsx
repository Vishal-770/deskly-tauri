import { useEffect, useState } from "react";
import { Calendar, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAcademicCalendarOptions,
  getAcademicCalendarView,
  type CalendarMonthOption,
  type MonthlySchedule,
  type CalendarDay,
} from "@/lib/features";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { cn } from "@/lib/utils";
import { useSemester } from "@/hooks/useSemester";

/* -------------------- Utility Functions -------------------- */

function createCalendarGrid(
  monthStr: string,
  days: CalendarDay[],
): (CalendarDay | null)[] {
  // Parse month and year from "FEBRUARY 2026"
  const parts = monthStr.split(" ");
  if (parts.length < 2) return days.map(d => d as CalendarDay | null);
  
  const monthName = parts[0];
  const year = parseInt(parts[1]);
  
  const monthIndex = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ].indexOf(monthName.toUpperCase());

  if (monthIndex === -1) return days.map(d => d as CalendarDay | null);

  // Get day of week for 1st of month (0 = Sunday, 1 = Monday, etc.)
  const firstDay = new Date(year, monthIndex, 1).getDay();

  // Create 42-cell grid (6 weeks)
  const grid: (CalendarDay | null)[] = new Array(42).fill(null);

  // Place days starting from firstDay position
  days.forEach((day) => {
    const position = firstDay + (day.date - 1);
    if (position < 42) {
      grid[position] = day;
    }
  });

  // Trim empty rows at the end (7 cells per row)
  let lastNonNullIndex = -1;
  for (let i = grid.length - 1; i >= 0; i--) {
    if (grid[i] !== null) {
      lastNonNullIndex = i;
      break;
    }
  }

  if (lastNonNullIndex >= 0) {
    const lastRowEnd = Math.ceil((lastNonNullIndex + 1) / 7) * 7;
    return grid.slice(0, lastRowEnd);
  }

  return grid;
}

export default function AcademicCalendarPage() {
  const { authState, loading: authLoading } = useAuth();
  const { currentSemester } = useSemester();

  const [options, setOptions] = useState<CalendarMonthOption[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [calendarData, setCalendarData] = useState<Record<string, MonthlySchedule>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        console.log("Fetching academic calendar options...");
        setLoading(true);
        const res = await getAcademicCalendarOptions();
        console.log("Calendar options response:", res);
        
        if (res.success && res.data) {
          if (res.data.length === 0) {
            setError("No months found for the selected semester.");
            setLoading(false);
            return;
          }

          setOptions(res.data);
          
          // Select current month if possible
          const currentDate = new Date();
          const currentMonthName = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
          ][currentDate.getMonth()];
          const currentYear = currentDate.getFullYear();
          const currentMonthYear = `${currentMonthName} ${currentYear}`;

          // Try to match by label first since it's more human-readable
          const currentMonthItem = res.data.find(
            (item) => item.label.toUpperCase().includes(currentMonthName.substring(0, 3).toUpperCase()) &&
                      item.label.includes(currentYear.toString())
          );
          
          const defaultTab = currentMonthItem ? currentMonthItem.dateValue : res.data[0].dateValue;
          console.log("Setting default tab:", defaultTab);
          setActiveTab(defaultTab);
          await fetchView(defaultTab);
        } else {
          setError(res.error || "Failed to fetch calendar options");
        }
      } catch (err) {
        console.error("Error in fetchOptions:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (authState?.loggedIn) {
      fetchOptions();
    }
  }, [authState?.loggedIn, currentSemester?.id]);

  const fetchView = async (dateValue: string) => {
    if (calendarData[dateValue]) return;

    try {
      console.log(`Fetching view for dateValue: ${dateValue}`);
      const res = await getAcademicCalendarView(dateValue);
      console.log(`Calendar view response for ${dateValue}:`, res);
      
      if (res.success && res.data) {
        setCalendarData(prev => ({ ...prev, [dateValue]: res.data! }));
      } else {
        console.error(`Failed to fetch view for ${dateValue}:`, res.error);
        // Maybe set a specific error for this tab if we want
      }
    } catch (err) {
      console.error(`Error in fetchView for ${dateValue}:`, err);
    }
  };

  const handleTabChange = (dateValue: string) => {
    setActiveTab(dateValue);
    fetchView(dateValue);
  };

  if (authLoading || (loading && options.length === 0)) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay title="Calendar Error" message={error} onRetry={() => window.location.reload()} />;
  }

  const currentSchedule = calendarData[activeTab];

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 border-b bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Academic Calendar</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                <Info className="w-3.5 h-3.5 text-primary" />
                Important dates for {currentSemester?.name || "the semester"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Month Tabs */}
      <nav className="px-6 py-4 border-b bg-muted/20 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex gap-2 min-w-max">
          {options.map((option) => (
            <button
              key={option.dateValue}
              onClick={() => handleTabChange(option.dateValue)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                activeTab === option.dateValue
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                  : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              {option.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </nav>

      {/* Calendar Content */}
      <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {currentSchedule ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary rounded-full" />
                {currentSchedule.month}
              </h2>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-xl">
              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[800px] p-6">
                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-3 mb-4">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                      <div key={day} className="text-center text-xs font-bold text-muted-foreground tracking-wider pb-2 border-b border-border/30">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-7 gap-3">
                    {createCalendarGrid(currentSchedule.month, currentSchedule.days).map((day, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[120px] p-3 rounded-xl border transition-all duration-200 group",
                          day
                            ? "bg-background border-border/50 hover:border-primary/40 hover:shadow-md hover:-translate-y-1"
                            : "bg-muted/5 border-transparent opacity-20"
                        )}
                      >
                        {day && (
                          <>
                            <div className={cn(
                              "text-lg font-bold mb-2 inline-flex items-center justify-center w-8 h-8 rounded-lg",
                              day.content.length > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground/60"
                            )}>
                              {day.date}
                            </div>
                            <div className="space-y-1.5">
                              {day.content.map((text: string, cIdx: number) => (
                                <div
                                  key={cIdx}
                                  className="text-[10px] leading-tight p-1.5 rounded-lg bg-muted/40 text-muted-foreground border border-border/30 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors"
                                >
                                  {text}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
           <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <Loader />
            <p className="animate-pulse">Fetching details for {options.find(o => o.dateValue === activeTab)?.label || activeTab}...</p>
          </div>
        )}
      </main>
    </div>
  );
}
