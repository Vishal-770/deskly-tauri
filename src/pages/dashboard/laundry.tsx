import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getLaundrySchedule,
  getStudentProfile,
  LaundryEntry,
  LaundryBlock,
  ProfileData,
} from "@/lib/features";
import { LAUNDRY_BLOCKS } from "@/lib/constants";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import Loader from "@/components/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shirt,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper: Normalize block names from profile to match LaundryBlock values
function normalizeBlockName(blockName: string | undefined): LaundryBlock {
  if (!blockName) return "A";
  const clean = blockName.trim().toUpperCase();
  if (clean.includes("CB") || clean.includes("COMSOP") || clean.includes("COMMUNITY")) return "CB";
  if (clean.includes("CG")) return "CG";
  if (clean.includes("D1") || clean.includes("D-1")) return "D1";
  if (clean.includes("D2") || clean.includes("D-2")) return "D2";
  if (clean.includes("D")) return "D1"; // default D block fallback
  if (clean.includes("E")) return "E";
  if (clean.includes("B")) return "B";
  return "A";
}

// Helper: Match a student's room number to a laundry day room range
function isRoomInLaundryRange(studentRoom: string | undefined, laundryRoomRange: string | null | undefined): boolean {
  if (!studentRoom || !laundryRoomRange) return false;
  
  const cleanRoom = studentRoom.trim();
  const cleanRange = laundryRoomRange.trim().toLowerCase();
  
  if (cleanRange === "all rooms" || cleanRange === "all" || cleanRange === "all room") return true;
  
  // Extract number from studentRoom (e.g. "D-203" or "203A" -> 203)
  const studentRoomNum = parseInt(cleanRoom.replace(/\D/g, ""), 10);
  if (isNaN(studentRoomNum)) return false;
  
  // Try matching ranges like "112 - 336" or "112-336" or "112 to 336"
  const parts = cleanRange.split(/[\-\s至to]+/).map(p => p.trim());
  if (parts.length >= 2) {
    const startNum = parseInt(parts[0].replace(/\D/g, ""), 10);
    const endNum = parseInt(parts[parts.length - 1].replace(/\D/g, ""), 10);
    if (!isNaN(startNum) && !isNaN(endNum)) {
      return studentRoomNum >= startNum && studentRoomNum <= endNum;
    }
  }
  
  // Check direct string match or list match
  if (cleanRange.includes(cleanRoom.toLowerCase())) {
    return true;
  }
  
  return false;
}

export default function LaundryPage() {
  const { loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<LaundryBlock>("A");
  const [laundryData, setLaundryData] = useState<LaundryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Current month reference date (locked to active month)
  const currentDate = useMemo(() => new Date(), []);
  
  // User selected day in the calendar grid
  const [selectedDay, setSelectedDay] = useState<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
  } | null>(null);

  // 1. Initial Load: Fetch student profile to resolve their default block & room
  useEffect(() => {
    async function loadProfile() {
      try {
        const profileRes = await getStudentProfile();
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          const normBlock = normalizeBlockName(profileRes.data.hostel?.blockName);
          setSelectedBlock(normBlock);
        }
      } catch (err) {
        console.warn("Failed to load profile for laundry block defaults:", err);
      } finally {
        setIsInitialized(true);
      }
    }
    loadProfile();
  }, []);

  // 2. Schedule Fetch: Load laundry schedule whenever block changes
  const fetchSchedule = async (block: LaundryBlock) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLaundrySchedule(block);
      if (res.success && res.data) {
        setLaundryData(res.data);
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
    if (isInitialized) {
      fetchSchedule(selectedBlock);
    }
  }, [selectedBlock, isInitialized]);

  // 3. Calendar Math: Generate 42 calendar grid cells (6 rows * 7 columns)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous Month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
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
    
    // Next Month padding days
    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  // Helper: Get laundry entry for a specific day of the month (1-31)
  const getLaundryForDay = (dayNum: number) => {
    if (!laundryData) return null;
    return laundryData.find((entry) => parseInt(entry.date, 10) === dayNum) || null;
  };



  // Determine current active day to show in details panel (defaults to today or selected calendar cell)
  const activeDay = useMemo(() => {
    if (selectedDay) return selectedDay;
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      isCurrentMonth: true,
    };
  }, [selectedDay]);

  const activeLaundryEntry = useMemo(() => {
    return getLaundryForDay(activeDay.day);
  }, [activeDay, laundryData]);

  const activeIsStudentDay = useMemo(() => {
    return isRoomInLaundryRange(profile?.hostel?.roomNumber, activeLaundryEntry?.roomNumber);
  }, [profile, activeLaundryEntry]);

  // Clean block name for display (removes brackets like "D2 Block Mens Hostel (D2 - Block)")
  const cleanBlockName = useMemo(() => {
    if (!profile?.hostel?.blockName) return "";
    const name = profile.hostel.blockName;
    return name.includes("(") ? name.split("(")[0].trim() : name;
  }, [profile]);

  // UI Shell layout
  const renderShell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-4 sm:pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background flex flex-col gap-6">
        {children}
      </main>
    </div>
  );

  if (authLoading || (loading && !laundryData)) {
    return renderShell(<Loader />);
  }

  if (error && !laundryData) {
    return renderShell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay
          title="Laundry Schedule Unreachable"
          message={error}
          onRetry={() => fetchSchedule(selectedBlock)}
        />
      </div>
    );
  }

  return renderShell(
    <div className="w-full space-y-6 flex flex-col flex-1">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent flex items-center gap-2">
            <Shirt className="w-5 h-5 text-primary shrink-0" />
            Laundry Calendar
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Hostel washing roster and allowed room ranges per day
          </p>
        </div>
      </header>

      {/* ── Sub-header Options (No Card/Box border) ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/10">
        {profile?.hostel?.roomNumber && (
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground/80">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>
              Your Room: <span className="font-extrabold text-foreground">{profile.hostel.roomNumber}</span> ({cleanBlockName})
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Select Block:</span>
          <Select value={selectedBlock} onValueChange={(val) => setSelectedBlock(val as LaundryBlock)}>
            <SelectTrigger className="w-[100px] h-8 rounded-xl bg-muted/20 hover:bg-muted/30 border-border/20 text-xs focus:ring-1 focus:ring-primary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/20 bg-popover/95 backdrop-blur-md">
              {LAUNDRY_BLOCKS.map((b) => (
                <SelectItem key={b} value={b} className="rounded-lg text-xs">
                  Block {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Calendar Header (Current Month Locked) ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground/90 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
      </div>

      {/* ── Calendar Grid (No Boxy Designs, single border grid) ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full flex-1 min-h-0"
      >
        <div className="grid grid-cols-7 border-t border-l border-border/10 rounded-2xl overflow-hidden bg-background">
          {/* Weekday Names */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center border-b border-r border-border/10 bg-muted/5">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                {day}
              </span>
            </div>
          ))}

          {/* Day Cells */}
          {calendarDays.map((cell, idx) => {
            const laundryEntry = getLaundryForDay(cell.day);
            
            const isToday =
              cell.day === new Date().getDate() &&
              cell.month === new Date().getMonth() &&
              cell.year === new Date().getFullYear() &&
              cell.isCurrentMonth;
              
            const isStudentDay = isRoomInLaundryRange(profile?.hostel?.roomNumber, laundryEntry?.roomNumber);
            
            const isSelected =
              selectedDay?.day === cell.day &&
              selectedDay?.month === cell.month &&
              selectedDay?.year === cell.year &&
              selectedDay?.isCurrentMonth === cell.isCurrentMonth;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(cell)}
                className={`min-h-[48px] sm:min-h-[75px] md:min-h-[95px] p-1 sm:p-2 flex flex-col justify-between border-b border-r border-border/10 cursor-pointer select-none transition-colors duration-150 relative group
                  ${cell.isCurrentMonth ? "bg-transparent hover:bg-muted/5" : "bg-muted/5 opacity-20 cursor-default pointer-events-none"}
                  ${isStudentDay && cell.isCurrentMonth ? "bg-primary/5 hover:bg-primary/10" : ""}
                  ${isSelected ? "bg-accent/10 font-bold" : ""}
                `}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[9px] sm:text-xs md:text-sm font-semibold rounded-full flex items-center justify-center transition-all
                      ${isToday
                        ? "bg-primary text-primary-foreground font-extrabold w-4 h-4 sm:w-6 sm:h-6 shadow-sm shadow-primary/20"
                        : cell.isCurrentMonth
                          ? isSelected
                            ? "text-primary font-bold"
                            : "text-foreground/90"
                          : "text-muted-foreground/40"
                      }
                    `}
                  >
                    {cell.day}
                  </span>
                  
                  {isStudentDay && cell.isCurrentMonth && (
                    <span className="text-primary shrink-0 relative flex h-1 w-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1 w-1 bg-primary"></span>
                    </span>
                  )}
                </div>
                
                {/* Cell Body */}
                <div className="mt-auto pt-0.5 flex flex-col gap-0.5 min-w-0">
                  {laundryEntry?.roomNumber ? (
                    <>
                      <span
                        className={`text-[7px] sm:text-[9px] md:text-xs leading-none break-words tracking-tighter sm:tracking-tight truncate sm:whitespace-normal
                          ${isStudentDay && cell.isCurrentMonth
                            ? "font-extrabold text-primary"
                            : "font-semibold text-foreground/75"
                          }
                        `}
                      >
                        {laundryEntry.roomNumber.toLowerCase().includes("all") 
                          ? "All Rooms" 
                          : laundryEntry.roomNumber.replace(/\s*-\s*/g, "-")}
                      </span>
                      
                      {isStudentDay && cell.isCurrentMonth && (
                        <span className="hidden sm:inline text-[7px] md:text-[8px] font-black uppercase text-primary/75 tracking-wider leading-none">
                          Your Day
                        </span>
                      )}
                    </>
                  ) : cell.isCurrentMonth ? (
                    <span className="text-[7px] sm:text-[9px] text-muted-foreground/25 font-semibold">
                      —
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Details Pane (Flat layout at bottom) ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeDay.day}-${activeDay.month}-${activeDay.year}`}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.15 }}
          className="pt-4 border-t border-border/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none">
              Selected Schedule
            </p>
            <h3 className="text-xs sm:text-sm font-bold text-foreground/90 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              {new Date(activeDay.year, activeDay.month, activeDay.day).toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
              {activeDay.day === new Date().getDate() &&
               activeDay.month === new Date().getMonth() &&
               activeDay.year === new Date().getFullYear() && (
                <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                  Today
                </span>
              )}
            </h3>
          </div>

          <div className="flex-1 lg:max-w-xl p-3.5 rounded-2xl bg-muted/10 border border-border/5 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5
              ${activeLaundryEntry?.roomNumber 
                ? activeIsStudentDay 
                  ? "bg-primary/10 text-primary" 
                  : "bg-foreground/5 text-foreground/70"
                : "bg-muted-foreground/5 text-muted-foreground/30"
              }
            `}>
              <Shirt className="w-4 h-4" />
            </div>
            
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground/45 uppercase tracking-widest leading-none">
                Allowed Hostel Rooms
              </p>
              
              {activeLaundryEntry?.roomNumber ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-foreground/95 leading-normal">
                    Rooms: <span className="font-extrabold text-foreground">{activeLaundryEntry.roomNumber}</span>
                  </p>
                  {profile?.hostel?.roomNumber && (
                    <p className="text-[9px] sm:text-xs leading-normal">
                      {activeIsStudentDay ? (
                        <span className="text-primary font-black flex items-center gap-1">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          Your washing day! Feel free to wash clothes.
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">Washing not scheduled for your room today.</span>
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground/40 italic leading-normal">
                  No laundry service scheduled for today.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
