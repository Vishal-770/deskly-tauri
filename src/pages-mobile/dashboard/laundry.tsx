import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getLaundrySchedule, LaundryEntry, LaundryBlock } from "@/lib/features";
import { LAUNDRY_BLOCKS } from "@/lib/constants";
import { ErrorDisplay } from "@/components/error-display";
import { DrawerSelect } from "@/components/ui/drawer-select";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import { Shirt, Calendar as CalendarIcon, CalendarPlus } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function LaundrySkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 px-2 py-4">
      <Sk className="h-7 w-40" />
      <Sk className="h-14 w-full rounded-2xl" />
      <Sk className="h-5 w-40" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <Sk key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    </div>
  );
}

export default function LaundryPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
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

  useEffect(() => {
    const savedBlock = localStorage.getItem("deskly::settings::hostelBlock");
    if (savedBlock) setSelectedBlock(savedBlock as LaundryBlock);
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(`deskly::cache::laundry_schedule_${selectedBlock}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as LaundryEntry[];
        if (parsed && parsed.length > 0) { setLaundryData(parsed); setLoading(false); return; }
      } catch (e) { console.error("Failed to parse cached laundry schedule", e); }
    }
    setLaundryData(null);
    setLoading(true);
  }, [selectedBlock]);

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
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isLoggedIn) fetchSchedule(selectedBlock); }, [selectedBlock, isLoggedIn]);

  const sortedLaundryData = useMemo(() => {
    if (!laundryData) return [];
    return [...laundryData].sort((a, b) => parseInt(a.date, 10) - parseInt(b.date, 10));
  }, [laundryData]);

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

  const activeMonthStr = useMemo(() => currentDate.toLocaleString("default", { month: "long", year: "numeric" }), [currentDate]);
  const currentDayNum = useMemo(() => new Date().getDate(), []);
  const currentMonthNum = useMemo(() => new Date().getMonth(), []);

  const shell = (children: React.ReactNode) => <>{children}</>;
  const showOffline = !laundryData && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) return shell(<OfflineDisplay onRetry={() => fetchSchedule(selectedBlock)} />);
  if (authLoading || (loading && !laundryData)) return shell(<LaundrySkeleton />);
  if (error && !laundryData) return shell(
    <div className="flex h-full items-center justify-center font-saira">
      <ErrorDisplay title="Laundry Schedule Unreachable" message={error} onRetry={() => fetchSchedule(selectedBlock)} />
    </div>
  );

  return shell(
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={() => fetchSchedule(selectedBlock)} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-2.5">
        <Shirt className="w-5 h-5 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">Laundry</h1>
      </header>

      {/* Block selector card */}
      <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm">
        <span className="text-[12px] font-bold text-muted-foreground/60 uppercase tracking-wider">Hostel Block</span>
        <DrawerSelect
          value={selectedBlock}
          onValueChange={(val) => {
            setSelectedBlock(val as LaundryBlock);
            localStorage.setItem("deskly::settings::hostelBlock", val);
          }}
          title="Select Hostel Block"
          triggerClassName="h-8 w-[110px]"
          options={LAUNDRY_BLOCKS.map((b) => ({ value: b, label: `Block ${b}` }))}
        />
      </div>

      {/* Month label */}
      <div className="flex items-center gap-2 px-1">
        <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
        <h2 className="text-[12px] font-black text-foreground uppercase tracking-widest leading-none">{activeMonthStr} Schedule</h2>
      </div>

      {/* Schedule cards */}
      {sortedLaundryData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card/60 backdrop-blur-md border border-border/25 rounded-2xl">
          <Shirt className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No schedule available</p>
          <p className="text-xs text-muted-foreground">Select a block or check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLaundryData.map((item, idx) => {
            const dayNum = parseInt(item.date, 10);
            const isToday = dayNum === currentDayNum && currentDate.getMonth() === currentMonthNum;
            const roomNum = item.roomNumber || "";
            const hasWashing =
              roomNum.trim() !== "" &&
              !roomNum.toLowerCase().includes("no washing") &&
              !roomNum.toLowerCase().includes("holiday") &&
              !roomNum.toLowerCase().includes("sunday");
            const details = getDayDetails(item.date);

            return (
              <div
                key={`${item.date}-${idx}`}
                className={`bg-card/70 backdrop-blur-md border rounded-2xl px-4 py-4 flex items-center gap-4 shadow-sm transition-colors duration-150
                  ${isToday ? "border-primary/30 bg-primary/5" : "border-border/30"}`}
              >
                {/* Date badge */}
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border
                  ${isToday ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border/25 text-muted-foreground"}`}
                >
                  <span className="text-[16px] font-black leading-none">{item.date}</span>
                  <span className="text-[8px] font-black uppercase leading-none mt-0.5">{details.abbr}</span>
                </div>

                {/* Day info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-foreground leading-none">{details.name}</span>
                    {isToday && (
                      <span className="text-[8px] font-black uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded leading-none">Today</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 leading-none">
                    {hasWashing
                      ? (roomNum.toLowerCase().includes("all") ? "All Rooms" : roomNum.replace(/\s*-\s*/g, "-"))
                      : "No washing slots"}
                  </p>
                </div>

                {/* Calendar button */}
                {hasWashing && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const url = getLaundryGCalLink(item.date, roomNum);
                      try { await openUrl(url); } catch (err) { console.error("Failed to open calendar link:", err); }
                    }}
                    className="shrink-0 w-9 h-9 rounded-xl border border-border/25 bg-muted/30 text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                    title="Add to Google Calendar"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
