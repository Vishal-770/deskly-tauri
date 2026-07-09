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
  Coffee,
  Utensils,
  Cookie,
  Soup,
  MapPin,
  Clock,
  ChevronDown,
  Home
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

const MEAL_META: Record<string, { timing: string; icon: (cls: string) => React.ReactNode; accent: string; bgAccent: string }> = {
  Breakfast: {
    timing: "07:30 AM – 09:30 AM",
    icon: (cls) => <Coffee className={`${cls} text-amber-500`} />,
    accent: "bg-amber-500/10 border-amber-500/20",
    bgAccent: "border-amber-500/10",
  },
  Lunch: {
    timing: "12:30 PM – 02:30 PM",
    icon: (cls) => <Utensils className={`${cls} text-emerald-500`} />,
    accent: "bg-emerald-500/10 border-emerald-500/20",
    bgAccent: "border-emerald-500/10",
  },
  Snacks: {
    timing: "05:00 PM – 06:30 PM",
    icon: (cls) => <Cookie className={`${cls} text-orange-500`} />,
    accent: "bg-orange-500/10 border-orange-500/20",
    bgAccent: "border-orange-500/10",
  },
  Dinner: {
    timing: "07:30 PM – 09:30 PM",
    icon: (cls) => <Soup className={`${cls} text-indigo-500`} />,
    accent: "bg-indigo-500/10 border-indigo-500/20",
    bgAccent: "border-indigo-500/10",
  },
};

const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function MessSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4">
      {/* Header */}
      <div className="space-y-2">
        <Sk className="h-7 w-32" />
        <Sk className="h-3.5 w-56" />
        <Sk className="h-3 w-40" />
      </div>
      {/* Weekday selector */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
        {[...Array(7)].map((_, i) => (
          <Sk key={i} className="h-10 w-12 rounded-xl shrink-0" />
        ))}
      </div>
      {/* Meal cards list */}
      <div className="space-y-4">
        {MEALS.map((m) => (
          <div key={m} className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Sk className="h-4.5 w-24" />
                <Sk className="h-3 w-36" />
              </div>
              <Sk className="h-4 w-12 rounded ml-auto" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border/10">
              <Sk className="h-4 w-3/4" />
              <Sk className="h-4 w-2/3" />
              <Sk className="h-4 w-5/6" />
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
    str.split(/[+,•]/).map((i) => i.replace(/\d+/g, "").trim()).filter(Boolean);

  const weekDays = useMemo(() => {
    const current = new Date();
    const dayOfWeek = current.getDay();
    const distance = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current.setDate(current.getDate() + distance));
    
    const days = [];
    const weekdaysAbbr = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      days.push({
        name: WEEKDAYS[i],
        abbr: weekdaysAbbr[i],
        dateNum: date.getDate(),
        monthStr: monthNames[date.getMonth()],
        displayLabel: `${date.getDate()} ${monthNames[date.getMonth()]}`
      });
    }
    return days;
  }, []);

  const activeDayLabel = useMemo(() => {
    const selected = weekDays.find(d => d.name === activeDay);
    if (!selected) return "";
    const isToday = activeDay.toLowerCase() === currentWeekday.toLowerCase();
    return `${isToday ? "Today" : activeDay} (${selected.dateNum} ${selected.monthStr.toLowerCase()})`;
  }, [activeDay, weekDays, currentWeekday]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  if (error && !menuData) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay title="Mess Menu Unreachable" message={error} onRetry={() => fetchMenu(selectedMess)} />
      </div>
    );
  }

  const isLoading = authLoading || (loading && !menuData);

  if (isLoading) return shell(<MessSkeleton />);

  return shell(
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground flex items-center gap-2 leading-none">
            <Home className="w-6 h-6 text-sky-500 shrink-0" />
            Mess Menu
          </h1>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            Weekly meal schedule for student hostels
          </p>
          {profile?.hostel?.blockName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 leading-none pt-1">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>Hostel: <span className="font-semibold text-foreground">{profile.hostel.blockName} – {profile.hostel.roomNumber}</span></span>
            </p>
          )}
        </div>

        {/* Mess selector */}
        <Select value={selectedMess} onValueChange={(val) => setSelectedMess(val as MessType)}>
          <SelectTrigger className="w-[120px] h-9 rounded-xl bg-muted/20 border-border/10 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/20 bg-card">
            {MESS_OPTIONS.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {formatMessTypeLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* ── Today / Day Selector Dropdown label ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-foreground cursor-pointer">
          <span className="text-sm font-semibold capitalize">{activeDayLabel}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* ── Weekday Selector Horizontal Strip ──────────────────────────────────── */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 shrink-0">
        {weekDays.map((d) => {
          const isSelected = d.name.toLowerCase() === activeDay.toLowerCase();
          return (
            <button
              key={d.name}
              onClick={() => setActiveDay(d.name)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs cursor-pointer transition-colors duration-150 shrink-0 min-w-[52px]
                ${isSelected
                  ? "bg-sky-500/15 border-sky-500/30 text-sky-400 font-bold"
                  : "bg-muted/10 border-border/10 text-muted-foreground hover:bg-muted/20"
                }`}
            >
              {isSelected ? (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] leading-none mb-1">{d.abbr}</span>
                  <span className="text-xs font-semibold leading-none uppercase">{d.displayLabel}</span>
                </div>
              ) : (
                <span className="text-xs font-semibold leading-none">{d.abbr}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Meal Cards List ───────────────────────────────────────────────────── */}
      {activeDayMenu && (
        <div className="space-y-4">
          {MEALS.map((meal) => {
            const meta = MEAL_META[meal];
            const items = parseItems(activeDayMenu[meal.toLowerCase() as keyof MessMenuItem] as string || "");

            return (
              <div key={meal} className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-4">
                {/* Header of meal card */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${meta.accent} flex items-center justify-center shrink-0`}>
                      {meta.icon("w-5 h-5")}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-none">{meal}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60 leading-none">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <span>{meta.timing}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-500 uppercase leading-none">
                    {items.length} ITEMS
                  </span>
                </div>

                {/* Items list inside card */}
                {items.length > 0 ? (
                  <ul className="space-y-2 pt-2 border-t border-border/10 pl-0.5">
                    {items.map((item, i) => (
                      <li key={i} className="text-xs font-semibold text-foreground/80 flex items-start gap-2.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground/40 italic pt-2 border-t border-border/10">
                    No items scheduled
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
