import { useEffect, useState } from "react";
import { getMessMenu, type MessMenuItem, type MessType } from "@/lib/features";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MESS_OPTIONS } from "@/lib/constants";

export default function MessPage() {
  const [messType, setMessType] = useState<MessType>("Veg-mens");
  const [menu, setMenu] = useState<MessMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await getMessMenu(messType);
      if (res.success && res.data) {
        setMenu(res.data);
        setError(null);
      } else {
        setError(res.error ?? "Failed to fetch mess menu");
      }
      setLoading(false);
    };

    void run();
  }, [messType]);

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Mess</h1>
        <p className="text-sm text-muted-foreground mt-1">Weekly meal menu</p>
      </header>

      <section className="rounded-xl border p-4 bg-card/30">
        <label className="text-sm text-muted-foreground mr-4">Mess Type</label>
        <Select value={messType} onValueChange={(value) => setMessType(value as MessType)}>
          <SelectTrigger className="mt-2 w-full">
            <SelectValue placeholder="Select mess type" />
          </SelectTrigger>
          <SelectContent>
            {MESS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {loading ? (
        <main className="p-6 h-full flex items-center justify-center">
          Loading menu...
        </main>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
          {error}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menu.map((item) => (
            <article
              key={`${item.id}-${item.day}`}
              className="rounded-xl border p-4 bg-card/30"
            >
              <h2 className="text-lg font-semibold">{item.day}</h2>
              <p className="text-sm mt-2">
                <span className="font-medium">Breakfast:</span> {item.breakfast}
              </p>
              <p className="text-sm mt-2">
                <span className="font-medium">Lunch:</span> {item.lunch}
              </p>
              <p className="text-sm mt-2">
                <span className="font-medium">Snacks:</span> {item.snacks}
              </p>
              <p className="text-sm mt-2">
                <span className="font-medium">Dinner:</span> {item.dinner}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
