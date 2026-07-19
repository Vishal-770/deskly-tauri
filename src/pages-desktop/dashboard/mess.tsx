import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getMessMenu,
  getStudentProfile,
  MessMenuItem,
  MessType,
  ProfileData,
} from "@/lib/features";
import { MESS_OPTIONS } from "@/lib/constants";

import { ErrorDisplay } from "@/components/error-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChefHat,
  Coffee,
  Utensils,
  Cookie,
  Soup,
  Calendar,
  LayoutGrid,
  Clock,
} from "lucide-react";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeMessType(messType: string | undefined): MessType {
  if (!messType) return "Veg-mens";
  const clean = messType.trim().toLowerCase();
  const isWomens = clean.includes("women") || clean.includes("ladies") || clean.includes("girl");
  if (clean.includes("special")) return isWomens ? "Special-womens" : "Special-mens";
  if (clean.includes("non-veg") || clean.includes("nonveg")) return isWomens ? "Non-Veg-womens" : "Non-Veg-mens";
  if (clean.includes("veg")) return isWomens ? "Veg-womens" : "Veg-mens";
  return isWomens ? "Veg-womens" : "Veg-mens";
}

function formatMessTypeLabel(type: MessType): string {
  const map: Record<MessType, string> = {
    "Veg-mens": "Veg (Men)", "Non-Veg-mens": "Non-Veg (Men)", "Special-mens": "Special (Men)",
    "Veg-womens": "Veg (Women)", "Non-Veg-womens": "Non-Veg (Women)", "Special-womens": "Special (Women)",
  };
  return map[type] ?? type;
}

const MEAL_META: Record<string, { timing: string; icon: (cls: string) => React.ReactNode; accent: string }> = {
  Breakfast: {
    timing: "07:00 AM – 09:00 AM",
    icon: (cls) => <Coffee className={`${cls} text-amber-500`} />,
    accent: "from-amber-500/10 to-amber-500/5 border-amber-500/15",
  },
  Lunch: {
    timing: "12:00 PM – 02:00 PM",
    icon: (cls) => <Utensils className={`${cls} text-emerald-500`} />,
    accent: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15",
  },
  Snacks: {
    timing: "05:00 PM – 06:30 PM",
    icon: (cls) => <Cookie className={`${cls} text-orange-500`} />,
    accent: "from-orange-500/10 to-orange-500/5 border-orange-500/15",
  },
  Dinner: {
    timing: "07:00 PM – 09:00 PM",
    icon: (cls) => <Soup className={`${cls} text-indigo-500`} />,
    accent: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/15",
  },
};

const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function MessSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header */}
      <div className="pb-4 border-b border-border/20 space-y-2">
        <Sk className="h-6 w-32" />
        <Sk className="h-3 w-56" />
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center pb-4 border-b border-border/10">
        <Sk className="h-4 w-40" />
        <div className="flex gap-3">
          <Sk className="h-8 w-24 rounded-xl" />
          <Sk className="h-8 w-32 rounded-xl" />
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 pb-3 border-b border-border/5">
        {WEEKDAYS.map((d) => <Sk key={d} className="h-9 w-16 rounded-xl" />)}
      </div>

      {/* Meal grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MEALS.map((m) => (
          <div key={m} className="space-y-4 py-4 border-b border-border/10">
            <div className="flex items-center justify-between border-b border-border/5 pb-3">
              <div className="flex items-center gap-2">
                <Sk className="w-9 h-9 rounded-xl" />
                <Sk className="h-5 w-24" />
              </div>
              <Sk className="h-4 w-36" />
            </div>
            <div className="space-y-2.5 pl-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Sk className="w-2 h-2 rounded-full shrink-0 mt-1.5" />
                  <Sk className={`h-4 ${i % 2 === 0 ? "w-40" : "w-56"}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessMenuPage() {
  const { loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedMess, setSelectedMess] = useState<MessType>("Veg-mens");
  const [menuData, setMenuData] = useState<MessMenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [activeDay, setActiveDay] = useState<string>("");

  const currentWeekday = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  useEffect(() => {
    setActiveDay(WEEKDAYS.includes(currentWeekday) ? currentWeekday : "Monday");
  }, [currentWeekday]);

  // Load profile from Cache first
  useEffect(() => {
    const cachedProfile = localStorage.getItem("deskly::cache::mess_profile");
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setProfile(parsed);
        setSelectedMess(normalizeMessType(parsed.hostel?.messType));
      } catch (e) {
        console.error("Failed to parse cached mess profile", e);
      }
    }
  }, []);

  // Load menu from Cache first when selectedMess changes
  useEffect(() => {
    const cachedMenu = localStorage.getItem(`deskly::cache::mess_menu_${selectedMess}`);
    if (cachedMenu) {
      try {
        const parsed = JSON.parse(cachedMenu);
        if (parsed && parsed.length > 0) {
          setMenuData(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached mess menu", e);
      }
    }
    setMenuData(null);
    setLoading(true);
  }, [selectedMess]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getStudentProfile();
        if (res.success && res.data) {
          setProfile(res.data);
          localStorage.setItem("deskly::cache::mess_profile", JSON.stringify(res.data));
          setSelectedMess(normalizeMessType(res.data.hostel?.messType));
        }
      } catch { /* silent */ }
      finally { setIsInitialized(true); }
    }
    loadProfile();
  }, []);

  const fetchMenu = async (messType: MessType) => {
    setLoading(menuData && menuData.length > 0 ? false : true);
    setError(null);
    try {
      const res = await getMessMenu(messType);
      if (res.success && res.data) {
        setMenuData(res.data);
        localStorage.setItem(`deskly::cache::mess_menu_${messType}`, JSON.stringify(res.data));
      } else {
        setError(res.error ?? `Failed to fetch menu for ${formatMessTypeLabel(messType)}.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isInitialized) fetchMenu(selectedMess); }, [selectedMess, isInitialized]);

  const activeDayMenu = useMemo(() => {
    if (!menuData) return null;
    return menuData.find((item) => item.day.trim().toLowerCase() === activeDay.trim().toLowerCase()) ?? null;
  }, [activeDay, menuData]);

  const parseItems = (str: string) =>
    str.split(/[+,•]/)
      .map((i) => i.trim().replace(/^\d+[\s.\-)]+/, "").trim())
      .flatMap((i) => i.split(/\s+\d+\.\s+/))
      .map((i) => i.trim())
      .filter(Boolean);


  const shell = (children: React.ReactNode) => (
    <>{children}</>
  );

  if (error && !menuData) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay title="Mess Menu Unreachable" message={error} onRetry={() => fetchMenu(selectedMess)} />
      </div>
    );
  }

  const isLoading = authLoading || (loading && !menuData);

  return shell(
    <div className="w-full space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary shrink-0" />
            Mess Menu
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Weekly meal schedule for student hostels
          </p>
        </div>

        {profile?.hostel?.messType && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 pb-0.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            Roster: <span className="font-extrabold text-foreground ml-1">{profile.hostel.messType}</span>
          </div>
        )}
      </header>

      {/* ── Toolbar ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/10">
        {/* Day / Week toggle */}
        <div className="flex items-center rounded-xl bg-muted/20 border border-border/10 p-0.5 self-start">
          {(["day", "week"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none
                ${viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {mode === "day" ? <Calendar className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              {mode === "day" ? "Day view" : "Full week"}
            </button>
          ))}
        </div>

        {/* Mess type selector */}
        <Select value={selectedMess} onValueChange={(val) => setSelectedMess(val as MessType)}>
          <SelectTrigger className="w-full sm:w-[155px] h-9 rounded-xl bg-muted/20 hover:bg-muted/30 border-border/20 text-xs sm:text-sm focus:ring-1 focus:ring-primary/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/20 bg-popover/95 backdrop-blur-md">
            {MESS_OPTIONS.map((m) => (
              <SelectItem key={m} value={m} className="rounded-lg text-xs sm:text-sm">
                {formatMessTypeLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <MessSkeleton /> : (
        <>
          {/* ── Day Tabs ────────────────────────────────────────────────────────── */}
          {viewMode === "day" && (
            <div className="w-full flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-border/5 pb-2">
              {WEEKDAYS.map((day) => {
                const isToday = day.toLowerCase() === currentWeekday.toLowerCase();
                const isSelected = day.toLowerCase() === activeDay.toLowerCase();
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer focus:outline-none
                      ${isSelected
                        ? "bg-primary/10 text-primary border-primary/15"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                      }
                    `}
                  >
                    <span className="hidden sm:inline">{day.substring(0, 3)}</span>
                    <span className="sm:hidden">{day.substring(0, 2)}</span>
                    {isToday && (
                      <span className="text-xs font-black uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md leading-none">
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── VIEW 1: Day Focus ──────────────────────────────────────────────── */}
            {viewMode === "day" && activeDayMenu && (
              <div
                key={activeDay}
                className="grid grid-cols-1 sm:grid-cols-2 gap-px border border-border/10 rounded-2xl overflow-hidden bg-border/10"
              >
                {MEALS.map((meal) => {
                  const meta = MEAL_META[meal];
                  const items = parseItems(activeDayMenu[meal.toLowerCase() as keyof MessMenuItem] as string || "");

                  return (
                    <div
                      key={meal}
                      className={`bg-background p-5 sm:p-6 space-y-4`}
                    >
                      {/* Meal Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${meta.accent} border flex items-center justify-center shrink-0`}>
                            {meta.icon("w-4.5 h-4.5 sm:w-5 sm:h-5")}
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-foreground leading-none">{meal}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              <span className="text-xs sm:text-xs text-muted-foreground/70 font-semibold tracking-tight">
                                {meta.timing}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/30 pt-0.5">
                          {items.length} items
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border/30" />

                      {/* Items list */}
                      <ul className="space-y-2.5">
                        {items.length > 0 ? (
                          items.map((item, i) => (
                            <li
                              key={i}
                              className="text-xs sm:text-sm text-foreground/80 font-medium flex items-start gap-2 leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-xs sm:text-sm text-muted-foreground/40 italic">
                            No items scheduled.
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── VIEW 2: Full Week Table ────────────────────────────────────── */}
            {viewMode === "week" && menuData && (
              <div
                className="w-full overflow-x-auto no-scrollbar rounded-2xl border border-border/10"
              >
                <table className="w-full text-left border-collapse min-w-[660px]">
                  <thead>
                    <tr className="border-b border-border/10 bg-muted/5">
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground/50 uppercase tracking-widest w-[90px]">
                        Day
                      </th>
                      {MEALS.map((meal) => (
                        <th key={meal} className="px-4 py-3 text-xs font-black text-muted-foreground/50 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            {MEAL_META[meal].icon("w-3.5 h-3.5")}
                            {meal}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/5">
                    {menuData.map((row) => {
                      const isToday = row.day.trim().toLowerCase() === currentWeekday.trim().toLowerCase();
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${isToday ? "bg-primary/5" : "hover:bg-muted/5"}`}
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs font-extrabold ${isToday ? "text-primary" : "text-foreground"}`}>
                                {row.day.substring(0, 3)}
                              </span>
                              {isToday && (
                                <span className="text-xs font-black uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md leading-none w-fit">
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          {MEALS.map((meal) => {
                            const raw = row[meal.toLowerCase() as keyof MessMenuItem] as string;
                            const items = parseItems(raw || "");
                            return (
                              <td key={meal} className="px-4 py-4 align-top">
                                {items.length > 0 ? (
                                  <ul className="space-y-1">
                                    {items.map((item, i) => (
                                      <li key={i} className="text-xs sm:text-xs text-foreground/75 font-medium flex items-start gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0 mt-1.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-xs text-muted-foreground/30 italic">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </>
      )}
    </div>
  );
}
