import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getLaundrySchedule,
  LaundryEntry,
  LaundryBlock,
} from "@/lib/features";
import { LAUNDRY_BLOCKS } from "@/lib/constants";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shirt, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/65 ${className}`} />;
}

function LaundrySkeleton() {
  return (
    <div className="w-full space-y-6 flex flex-col flex-1">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-border/10 space-y-2">
        <Sk className="h-6 w-40" />
        <Sk className="h-4 w-72" />
      </div>
      
      {/* Options skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/10">
        <Sk className="h-4 w-48" />
        <Sk className="h-8 w-28 rounded-xl ml-auto sm:ml-0" />
      </div>
      
      {/* Month title skeleton */}
      <Sk className="h-6 w-36 animate-pulse" />
      
      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 border-t border-l border-border/10 rounded-2xl overflow-hidden bg-background">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 text-center border-b border-r border-border/10 bg-muted/5">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase animate-pulse">
              {day}
            </span>
          </div>
        ))}
        {[...Array(35)].map((_, i) => (
          <div key={i} className="min-h-[48px] sm:min-h-[75px] md:min-h-[95px] p-2 border-b border-r border-border/10 flex flex-col justify-between">
            <Sk className="h-4 w-5" />
            <Sk className="h-3 w-12 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaundryPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [selectedBlock, setSelectedBlock] = useState<LaundryBlock>("A");
  const [laundryData, setLaundryData] = useState<LaundryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current reference date (locked to active month)
  const currentDate = useMemo(() => new Date(), []);

  // Load block settings from localStorage
  useEffect(() => {
    const savedBlock = localStorage.getItem("deskly::settings::hostelBlock");
    if (savedBlock) {
      setSelectedBlock(savedBlock as LaundryBlock);
    }
  }, []);

  // Fetch laundry schedule
  const fetchSchedule = async (block: LaundryBlock) => {
    setLoading(laundryData && laundryData.length > 0 ? false : true);
    setError(null);
    try {
      const res = await getLaundrySchedule(block);
      if (res.success && res.data) {
        setLaundryData(res.data);
        localStorage.setItem(`deskly::cache::laundry_schedule_${block}`, JSON.stringify(res.data));
      } else {
        setError(res.error ?? `Failed to fetch laundry schedule for Block ${block}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchSchedule(selectedBlock);
    }
  }, [selectedBlock, isLoggedIn]);

  // Generate calendar grid cells (only for current month, with empty placeholders for padding to maintain weekday columns)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Previous Month padding days (empty placeholders)
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        day: 0,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }
    
    // Current Month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
      });
    }
    
    // Next Month padding days to complete the final week row
    const totalCells = days.length;
    const totalCellsNeeded = Math.ceil(totalCells / 7) * 7;
    const remainingCells = totalCellsNeeded - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: 0,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  const getLaundryForDay = (dayNum: number) => {
    if (!laundryData || dayNum === 0) return null;
    return laundryData.find((entry) => parseInt(entry.date, 10) === dayNum) || null;
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background flex flex-col gap-6">
        {children}
      </main>
    </div>
  );

  if (authLoading || (loading && !laundryData)) {
    return shell(<LaundrySkeleton />);
  }

  if (error && !laundryData) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay
          title="Laundry Schedule Unreachable"
          message={error}
          onRetry={() => fetchSchedule(selectedBlock)}
        />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6 flex flex-col flex-1">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shirt className="w-6 h-6 text-primary shrink-0" />
            Laundry Calendar
          </h1>
          <p className="text-xs text-muted-foreground">
            Hostel washing schedule and room ranges
          </p>
        </div>
      </header>

      {/* ── Block Selection Options ────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-border/10">
        <span className="text-xs text-muted-foreground font-semibold">
          Select Hostel Block:
        </span>
        <Select
          value={selectedBlock}
          onValueChange={(val) => {
            setSelectedBlock(val as LaundryBlock);
            localStorage.setItem("deskly::settings::hostelBlock", val);
          }}
        >
          <SelectTrigger className="w-[110px] h-8 rounded-xl bg-muted/10 border-border/20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/20 bg-card">
            {LAUNDRY_BLOCKS.map((b) => (
              <SelectItem key={b} value={b} className="text-xs">
                Block {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Calendar Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground/55 shrink-0" />
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
      </div>

      {/* ── Calendar Grid ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full flex-1 min-h-0"
      >
        <div className="grid grid-cols-7 bg-background gap-y-3 pb-6">
          {/* Weekday Names */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div 
              key={day} 
              className={`py-2 text-center select-none
                ${idx !== 6 ? "border-r border-border/10" : ""}
              `}
            >
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/65 uppercase">
                {day}
              </span>
            </div>
          ))}

          {/* Day Cells */}
          {calendarDays.map((cell, idx) => {
            const isLastInRow = (idx + 1) % 7 === 0;

            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={idx}
                  className={`min-h-[48px] sm:min-h-[75px] md:min-h-[95px] bg-muted/5 opacity-10 pointer-events-none
                    ${!isLastInRow ? "border-r border-border/10" : ""}
                  `}
                />
              );
            }

            const laundryEntry = getLaundryForDay(cell.day);
            
            const isToday =
              cell.day === new Date().getDate() &&
              cell.month === new Date().getMonth() &&
              cell.year === new Date().getFullYear() &&
              cell.isCurrentMonth;

            return (
              <div
                key={idx}
                className={`min-h-[48px] sm:min-h-[75px] md:min-h-[95px] p-2 flex flex-col justify-between select-none transition-colors duration-150 relative overflow-hidden group
                  ${!isLastInRow ? "border-r border-border/10" : ""}
                  ${isToday 
                    ? "bg-primary/[0.03]" 
                    : "bg-transparent hover:bg-muted/5"
                  }
                `}
              >
                {isToday && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                )}
                <div className="flex items-center justify-center w-full">
                  <span
                    className={`text-xs md:text-sm font-semibold rounded-full flex items-center justify-center transition-all
                      ${isToday
                        ? "bg-primary text-primary-foreground font-bold w-5 h-5 sm:w-6 sm:h-6 shadow-sm shadow-primary/20"
                        : "text-foreground/90"
                      }
                    `}
                  >
                    {cell.day}
                  </span>
                </div>
                
                <div className="mt-auto pt-1 flex flex-col items-center justify-center gap-0.5 min-w-0 w-full">
                  {laundryEntry?.roomNumber ? (
                    <span className="text-[9px] sm:text-xs leading-none break-words tracking-tight font-medium text-foreground/80 truncate sm:whitespace-normal text-center w-full">
                      {laundryEntry.roomNumber.toLowerCase().includes("all") 
                        ? "All Rooms" 
                        : laundryEntry.roomNumber.replace(/\s*-\s*/g, "-")}
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-xs text-muted-foreground/25 font-semibold text-center w-full">
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
