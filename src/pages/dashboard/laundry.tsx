import { useEffect, useState } from "react";
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

const BLOCKS: LaundryBlock[] = ["A", "B", "CB", "CG", "D1", "D2", "E"];

export default function LaundryPage() {
  const [block, setBlock] = useState<LaundryBlock>("A");
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await getLaundrySchedule(block);
      if (res.success && res.data) {
        setEntries(res.data);
        setError(null);
      } else {
        setError(res.error ?? "Failed to fetch laundry schedule");
      }
      setLoading(false);
    };

    void run();
  }, [block]);

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Laundry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Block-wise laundry schedule
        </p>
      </header>

      <section className="rounded-xl border p-4 bg-card/30">
        <label className="text-sm text-muted-foreground mr-4">Hostel Block</label>
        <Select value={block} onValueChange={(value) => setBlock(value as LaundryBlock)}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue placeholder="Select hostel block" />
          </SelectTrigger>
          <SelectContent>
            {BLOCKS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {loading ? (
        <main className="p-6 h-full flex items-center justify-center">
          Loading schedule...
        </main>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
          {error}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <article
              key={`${entry.id}-${entry.date}`}
              className="rounded-xl border p-4 bg-card/30"
            >
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{entry.date}</p>
              <p className="text-sm text-muted-foreground mt-2">Room Number</p>
              <p>{entry.roomNumber || "Not assigned"}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
