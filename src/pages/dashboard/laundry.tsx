import { useEffect, useState, useMemo } from "react";
import {
  getLaundrySchedule,
  type LaundryBlock,
  type LaundryEntry,
} from "@/lib/features";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WashingMachine } from "lucide-react";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { LAUNDRY_BLOCKS } from "@/lib/constants";

export default function LaundryPage() {
  const [block, setBlock] = useState<LaundryBlock>(() => {
    return (localStorage.getItem("preferred_laundry_block") as LaundryBlock) || "A";
  });
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const fetchSchedule = async (selectedBlock: LaundryBlock) => {
    setLoading(true);
    const res = await getLaundrySchedule(selectedBlock);
    if (res.success && res.data) {
      setEntries(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Failed to fetch laundry schedule");
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchSchedule(block);
  }, [block]);

  const onBlockChange = (newBlock: LaundryBlock) => {
    setBlock(newBlock);
    localStorage.setItem("preferred_laundry_block", newBlock);
  };

  const scheduleByDay = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const day = parseInt(entry.date);
        if (!acc[day]) acc[day] = [];
        if (entry.roomNumber) {
          acc[day].push(entry.roomNumber);
        }
        return acc;
      },
      {} as Record<number, string[]>,
    );
  }, [entries]);

  return (
    <div className="h-full w-full bg-background px-6 lg:px-10 py-10 pb-20 overflow-y-auto no-scrollbar">
      <div className="mb-8 flex items-center gap-3">
        <WashingMachine className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Laundry Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View laundry schedule per block
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border p-4 bg-card/30 max-w-sm">
          <label className="text-sm text-muted-foreground block mb-2 font-medium">
            Hostel Block
          </label>
          <Select value={block} onValueChange={(v) => onBlockChange(v as LaundryBlock)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select hostel block" />
            </SelectTrigger>
            <SelectContent>
              {LAUNDRY_BLOCKS.map((b) => (
                <SelectItem key={b} value={b}>
                  Block {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {error && (
          <ErrorDisplay
            title="Failed to Load Laundry Schedule"
            message={error}
            onRetry={() => fetchSchedule(block)}
          />
        )}

        <main className="flex-1 min-h-0 min-w-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader />
            </div>
          ) : (
            <div className="flex flex-col h-full max-h-[70vh]">
              <div className="text-center text-sm font-semibold mb-6 text-muted-foreground uppercase tracking-wider shrink-0">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              
              <div className="overflow-auto no-scrollbar rounded-xl border bg-card/10 p-2 md:p-4 h-full">
                <div className="min-w-[800px] w-full">
                  <div className="grid grid-cols-7 gap-2 mb-4 text-center">
                    {dayNames.map((day) => (
                      <div key={day} className="text-xs font-bold text-muted-foreground py-1 md:py-2 uppercase tracking-tighter">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOfMonth }, (_, i) => (
                      <div key={`empty-${i}`} className="min-h-16 md:min-h-20" />
                    ))}
                    
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const rooms = scheduleByDay[day] || [];
                      const isToday = day === currentDate.getDate() && currentMonth === (currentDate.getMonth() + 1);
                      const hasSchedule = rooms.length > 0;

                      return (
                        <div
                          key={day}
                          className={`min-h-16 md:min-h-20 border rounded-lg p-1.5 flex flex-col items-center justify-start transition-all ${
                            hasSchedule
                              ? "bg-primary/5 border-primary/30 shadow-sm"
                              : "border-muted/50 bg-muted/5 opacity-80"
                          } ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                        >
                          <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                            isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                          }`}>
                            {day}
                          </div>
                          
                          {hasSchedule ? (
                            <div className="text-[9px] md:text-[10px] font-medium text-primary text-center leading-tight line-clamp-2">
                              {rooms.join(", ")}
                            </div>
                          ) : (
                            <div className="text-[8px] text-muted-foreground/30 italic">--</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
