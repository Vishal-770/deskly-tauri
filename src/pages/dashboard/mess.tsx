import { useEffect, useState } from "react";
import { getMessMenu, type MessMenuItem, type MessType } from "../../lib/features";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { 
  Croissant, 
  UtensilsCrossed, 
  Coffee, 
  Moon
} from "lucide-react";
import { MESS_OPTIONS } from "../../lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../components/Loader";
import { ErrorDisplay } from "../../components/error-display";
import { cn } from "../../lib/utils";

const MEAL_CONFIG = [
  { key: "breakfast", label: "Breakfast", icon: Croissant, color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "snacks", label: "Snacks", icon: Coffee, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "dinner", label: "Dinner", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10" },
] as const;

export default function MessPage() {
  const [messType, setMessType] = useState<MessType>("Veg-mens");
  const [menu, setMenu] = useState<MessMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await getMessMenu(messType);
      if (res.success && res.data) {
        setMenu(res.data);
        // Reset day index if current is out of bounds
        if (selectedDayIndex >= res.data.length) {
          setSelectedDayIndex(0);
        }
        setError(null);
      } else {
        setError(res.error ?? "Failed to fetch mess menu");
      }
      setLoading(false);
    };

    void run();
  }, [messType]);

  const selectedDay = menu[selectedDayIndex];

  const parseFoodItems = (foodString: string) => {
    return foodString
      .split(/[+\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => item.replace(/\s*\(Weeks \d+ & \d+\)\s*/i, "").trim());
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero Header */}
      <header className="px-6 lg:px-10 py-10 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-primary rounded-full" />
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">
                Dining Hall
              </h1>
            </div>
            <p className="text-[10px] text-muted-foreground font-black opacity-30 tracking-[0.3em] pl-4 uppercase">
              Academic Dining Schedule
            </p>
          </div>

          <div className="relative">
            <Select value={messType} onValueChange={(value) => setMessType(value as MessType)}>
              <SelectTrigger className="h-12 w-full md:w-64 rounded-xl border border-border/50 bg-muted/5 text-[10px] font-black uppercase tracking-widest focus:ring-0 focus:border-primary/50 transition-all">
                <SelectValue placeholder="Select Mess" />
              </SelectTrigger>
              <SelectContent>
                {MESS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="text-[10px] font-black uppercase tracking-widest">
                    {option.replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {loading && menu.length === 0 ? (
        <div className="h-[50vh] flex items-center justify-center">
          <Loader />
        </div>
      ) : error ? (
        <div className="max-w-7xl mx-auto px-6">
          <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Day Selector - More subtle */}
          <nav className="px-6 lg:px-10">
            <div className="flex gap-1 p-1 bg-muted/10 rounded-2xl border border-border/50 w-fit">
              {menu.map((item, idx) => (
                <button
                  key={item.day}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={cn(
                    "relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap overflow-hidden",
                    selectedDayIndex === idx
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/10"
                  )}
                >
                  <span className="relative z-10">{item.day.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Meals Content - Professional Grid */}
          <main className="px-6 lg:px-10">
            <AnimatePresence mode="wait">
              {selectedDay && (
                <motion.div
                  key={selectedDay.day}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {MEAL_CONFIG.map((conf) => {
                    const foodItems = parseFoodItems(String(selectedDay[conf.key as keyof MessMenuItem] || ""));
                    
                    return (
                      <section
                        key={conf.key}
                        className="p-8 rounded-[32px] border border-border/50 bg-muted/5 hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <div className={cn("p-3 rounded-xl", conf.bg)}>
                            <conf.icon className={cn("w-5 h-5", conf.color)} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tightest leading-none">
                              {conf.label}
                            </h3>
                            <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">
                              {selectedDay.day}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-3 pl-4 border-l border-border/50">
                          {foodItems.length > 0 ? (
                            foodItems.map((food, fIdx) => (
                              <li
                                key={fIdx}
                                className="flex items-center gap-3 transition-colors"
                              >
                                <div className="w-1 h-1 rounded-full bg-primary/30" />
                                <span className="text-[13px] font-bold text-muted-foreground leading-relaxed">
                                  {food}
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="text-[11px] font-bold text-muted-foreground/20 italic">
                              Menu not available
                            </li>
                          )}
                        </ul>
                      </section>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}
    </div>
  );
}
