import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getLaundrySchedule,
  LaundryEntry,
  LaundryBlock,
} from "@/lib/features";
import { LAUNDRY_BLOCKS } from "@/lib/constants";

import { ErrorDisplay } from "@/components/error-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shirt, Calendar as CalendarIcon, CalendarPlus } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function LaundrySkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      <div className="space-y-1">
        <Sk className="h-7 w-40" />
        <Sk className="h-3.5 w-72" />
      </div>
      <Sk className="h-16 w-full rounded-xl" />
      <div className="space-y-3">
        <Sk className="h-5 w-32" />
        <div className="bg-muted/10 border border-border/10 rounded-2xl divide-y divide-border/10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Sk className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Sk className="h-4 w-28" />
                  <Sk className="h-3 w-36" />
                </div>
              </div>
              <Sk className="w-8 h-8 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
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
  
  const currentDate = useMemo(() => new Date(), []);

  const getLaundryGCalLink = (dayStr: string, roomNumber: string) => {
    const day = parseInt(dayStr, 10);
    if (isNaN(day)) return "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const eventDate = new Date(year, month, day);
    
    const startY = eventDate.getFullYear();
    const startM = String(eventDate.getMonth() + 1).padStart(2, "0");
    const startD = String(eventDate.getDate()).padStart(2, "0");

    const nextDate = new Date(eventDate);
    nextDate.setDate(eventDate.getDate() + 1);
    const endY = nextDate.getFullYear();
    const endM = String(nextDate.getMonth() + 1).padStart(2, "0");
    const endD = String(nextDate.getDate()).padStart(2, "0");

    const dates = `${startY}${startM}${startD}/${endY}${endM}${endD}`;
    
    const title = encodeURIComponent(`Laundry Schedule - Block ${selectedBlock}`);
    const details = encodeURIComponent(`Room Range: ${roomNumber}\nAllocated wash day for your block/room.`);
    const location = encodeURIComponent(`Laundry Room, Block ${selectedBlock}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  // Load saved block settings
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

  // Sort laundry list chronologically by date number
  const sortedLaundryData = useMemo(() => {
    if (!laundryData) return [];
    return [...laundryData].sort((a, b) => {
      return parseInt(a.date, 10) - parseInt(b.date, 10);
    });
  }, [laundryData]);

  // Helper to dynamically calculate weekday details based on current year/month and date
  const getDayDetails = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return (dateStr: string) => {
      const day = parseInt(dateStr, 10);
      if (isNaN(day)) return { name: "Monday", abbr: "Mon" };
      const date = new Date(year, month, day);
      return {
        name: date.toLocaleDateString("en-US", { weekday: "long" }),
        abbr: date.toLocaleDateString("en-US", { weekday: "short" })
      };
    };
  }, [currentDate]);

  const activeMonthStr = useMemo(() => {
    return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  }, [currentDate]);

  const currentDayNum = useMemo(() => new Date().getDate(), []);
  const currentMonthNum = useMemo(() => new Date().getMonth(), []);

  const shell = (children: React.ReactNode) => <>{children}</>;

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
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <Shirt className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
            Laundry
          </h1>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            Hostel washing schedule calendar and room allocations
          </p>
        </div>
      </header>

      {/* ── Block Selection Options ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
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
          <SelectTrigger className="w-[110px] h-8 rounded-xl bg-muted/20 border-border/10 text-xs shrink-0">
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

      {/* ── Chronological Schedule List ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 leading-none uppercase">
            <CalendarIcon className="w-4 h-4 text-sky-500 shrink-0" />
            {activeMonthStr} Schedule
          </h2>
        </div>

        {sortedLaundryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
            <Shirt className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No schedule available</p>
            <p className="text-xs text-muted-foreground">Select a block or check back later.</p>
          </div>
        ) : (
          <div className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
            {sortedLaundryData.map((item, idx) => {
              const dayNum = parseInt(item.date, 10);
              const isToday = dayNum === currentDayNum && currentDate.getMonth() === currentMonthNum;
              
              const roomNum = item.roomNumber || "";
              const hasWashing = roomNum.trim() !== "" && !roomNum.toLowerCase().includes("no washing") && !roomNum.toLowerCase().includes("holiday") && !roomNum.toLowerCase().includes("sunday");
              const details = getDayDetails(item.date);

              return (
                <div
                  key={`${item.date}-${idx}`}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors duration-150
                    ${isToday ? "bg-sky-500/10 text-sky-400 font-bold" : "hover:bg-muted/5 text-foreground"}`}
                >
                  {/* Date Column */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border
                      ${isToday
                        ? "bg-sky-500 text-white border-sky-500 font-black"
                        : "bg-muted/20 border-border/10 text-muted-foreground"
                      }`}
                    >
                      <span className="text-base font-bold leading-none">{item.date}</span>
                      <span className="text-[8px] font-bold uppercase leading-none mt-1">{details.abbr}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap leading-none">
                        <span className="text-sm font-bold text-foreground truncate">
                          {details.name}
                        </span>
                        {isToday && (
                          <span className="text-[8px] font-black uppercase bg-sky-500 text-white px-1.5 py-0.5 rounded leading-none shrink-0">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-1.5 leading-none">
                        {hasWashing ? `Allocated Rooms` : "No washing slots"}
                      </p>
                    </div>
                  </div>

                  {/* Room Allocations / Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {hasWashing ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border leading-none
                        ${isToday
                          ? "bg-sky-500/20 border-sky-500/30 text-sky-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {roomNum.toLowerCase().includes("all") 
                          ? "All Rooms" 
                          : roomNum.replace(/\s*-\s*/g, "-")}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground/40 leading-none">
                        No Schedule
                      </span>
                    )}

                    {hasWashing && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = getLaundryGCalLink(item.date, roomNum);
                          try {
                            await openUrl(url);
                          } catch (err) {
                            console.error("Failed to open calendar link:", err);
                          }
                        }}
                        className="p-2 rounded-xl border border-border/10 bg-muted/10 text-muted-foreground hover:text-sky-400 hover:bg-muted/20 transition-colors cursor-pointer flex items-center justify-center shrink-0 border-0"
                        title="Add to Google Calendar"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
