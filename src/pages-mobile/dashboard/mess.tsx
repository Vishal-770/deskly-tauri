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
import { DrawerSelect } from "@/components/ui/drawer-select";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import {
  Coffee,
  Utensils,
  Cookie,
  Soup,
  MapPin,
  Clock,
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

const MEAL_META: Record<string, { timing: string; icon: (cls: string) => React.ReactNode }> = {
  Breakfast: {
    timing: "07:30 AM – 09:30 AM",
    icon: (cls) => <Coffee className={cls} />,
  },
  Lunch: {
    timing: "12:30 PM – 02:30 PM",
    icon: (cls) => <Utensils className={cls} />,
  },
  Snacks: {
    timing: "05:00 PM – 06:30 PM",
    icon: (cls) => <Cookie className={cls} />,
  },
  Dinner: {
    timing: "07:30 PM – 09:30 PM",
    icon: (cls) => <Soup className={cls} />,
  },
};

const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/65 ${className}`} />;
}

function MessSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira">
      {/* Header */}
      <div className="space-y-2">
        <Sk className="h-7 w-32" />
        <Sk className="h-3 w-40" />
      </div>
      {/* Weekday selector */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
        {[...Array(7)].map((_, i) => (
          <Sk key={i} className="h-12 w-11 rounded-xl shrink-0" />
        ))}
      </div>
      {/* Meal cards list */}
      <div className="divide-y divide-border/10 border-t border-b border-border/10 animate-pulse">
        {MEALS.map((m) => (
          <div key={m} className="py-4 space-y-4">
            <div className="flex items-center gap-3">
              <Sk className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Sk className="h-4 w-24" />
                <Sk className="h-3 w-36" />
              </div>
              <Sk className="h-3 w-12 rounded ml-auto" />
            </div>
            <div className="space-y-2 pl-11">
              <Sk className="h-4.5 w-3/4" />
              <Sk className="h-4.5 w-2/3" />
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
  const isOnline = useOnlineStatus();
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
    str.split(/[+,•]/)
      .map((i) => i.trim().replace(/^\d+[\s.\-)]+/, "").trim())
      .filter(Boolean);

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

  const showOffline = !menuData && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={() => fetchMenu(selectedMess)} />);
  }

  if (authLoading || (loading && !menuData)) {
    return shell(<MessSkeleton />);
  }

  if (error && !menuData) {
    return shell(
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay title="Mess Menu Unreachable" message={error} onRetry={() => fetchMenu(selectedMess)} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={() => fetchMenu(selectedMess)} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground flex items-center gap-2 leading-none">
            <Home className="w-6 h-6 text-primary shrink-0" />
            Mess
          </h1>
          {profile?.hostel?.blockName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 leading-none pt-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground/45 shrink-0" />
              <span>Block {profile.hostel.blockName} &bull; Room {profile.hostel.roomNumber}</span>
            </p>
          )}
        </div>

        {/* Mess selector */}
        <DrawerSelect
          value={selectedMess}
          onValueChange={(val) => setSelectedMess(val as MessType)}
          title="Select Mess"
          triggerClassName="h-9 w-[130px]"
          options={MESS_OPTIONS.map((m) => ({ value: m, label: formatMessTypeLabel(m) }))}
        />
      </header>

      {/* ── Weekday Selector Horizontal Strip ──────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 shrink-0">
        {weekDays.map((d) => {
          const isSelected = d.name.toLowerCase() === activeDay.toLowerCase();
          const isToday = d.name.toLowerCase() === currentWeekday.toLowerCase();

          return (
            <button
              key={d.name}
              onClick={() => setActiveDay(d.name)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs cursor-pointer transition-colors duration-150 shrink-0 w-11
                ${isSelected
                  ? "bg-primary/10 border-primary/25 text-primary font-bold"
                  : "bg-muted/15 border-transparent text-muted-foreground hover:bg-muted/30"
                }`}
            >
              <span className="text-[9px] uppercase tracking-wider leading-none text-muted-foreground/60">{d.abbr}</span>
              <span className="text-sm font-bold leading-none mt-1.5">{d.dateNum}</span>
              {isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-primary mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Day Title ─────────────────────────────────────────────────── */}
      <div className="pt-2">
        <h2 className="text-xs font-bold text-primary uppercase tracking-widest leading-none">
          {activeDayLabel} Menu
        </h2>
      </div>

      {/* ── Meal Cards List ───────────────────────────────────────────────────── */}
      {activeDayMenu && (
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {MEALS.map((meal) => {
            const meta = MEAL_META[meal];
            const items = parseItems(activeDayMenu[meal.toLowerCase() as keyof MessMenuItem] as string || "");

            return (
              <div key={meal} className="py-4 space-y-3">
                {/* Header of meal card */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 text-primary">
                      {meta.icon("w-4.5 h-4.5")}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-none">{meal}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60 leading-none">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <span>{meta.timing}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-primary uppercase leading-none">
                    {items.length} ITEMS
                  </span>
                </div>

                {/* Items list inside card */}
                {items.length > 0 ? (
                  <ul className="space-y-1.5 pl-11">
                    {items.map((item, i) => (
                      <li key={i} className="text-xs font-semibold text-foreground/80 flex items-start gap-2.5 leading-relaxed">
                        <span className="w-1 h-1 rounded-full bg-primary/45 shrink-0 mt-2" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-muted-foreground/40 italic pl-11">
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
