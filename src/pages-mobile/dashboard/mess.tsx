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
import { Coffee, Utensils, Cookie, Soup, MapPin, Clock } from "lucide-react";

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

const MEAL_META: Record<string, { timing: string; icon: React.ElementType }> = {
  Breakfast: { timing: "07:30 – 09:30 AM", icon: Coffee },
  Lunch:     { timing: "12:30 – 02:30 PM", icon: Utensils },
  Snacks:    { timing: "05:00 – 06:30 PM", icon: Cookie },
  Dinner:    { timing: "07:30 – 09:30 PM", icon: Soup },
};

const MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"] as const;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-muted/40 ${className}`} style={style} />;
}

function MessSkeleton() {
  return (
    <div className="w-full space-y-6 px-4 pt-4 pb-8">
      <div className="space-y-2">
        <Sk className="h-7 w-24" />
        <Sk className="h-3.5 w-44" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[...Array(7)].map((_, i) => <Sk key={i} className="h-[60px] w-11 rounded-2xl shrink-0" />)}
      </div>
      <div className="space-y-5 pt-1">
        {MEALS.map((m) => (
          <div key={m} className="space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-2xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Sk className="h-4 w-20" />
                <Sk className="h-3 w-32" />
              </div>
            </div>
            <div className="space-y-2 pl-[52px]">
              {[...Array(3)].map((_, j) => <Sk key={j} className="h-3.5" style={{ width: `${65 + j * 10}%` }} />)}
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

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::mess_profile");
    if (cached) {
      try {
        const p = JSON.parse(cached);
        setProfile(p);
        setSelectedMess(normalizeMessType(p.hostel?.messType));
      } catch { /* silent */ }
    }
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem(`deskly::cache::mess_menu_${selectedMess}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.length > 0) { setMenuData(parsed); setLoading(false); return; }
      } catch { /* silent */ }
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
        setError(res.error ?? `Failed to fetch menu.`);
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

  const weekDays = useMemo(() => {
    const current = new Date();
    const dayOfWeek = current.getDay();
    const distance = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current.setDate(current.getDate() + distance));
    const abbr = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday.getTime() + i * 86400000);
      return {
        name: WEEKDAYS[i],
        abbr: abbr[i],
        dateNum: date.getDate(),
        month: months[date.getMonth()],
      };
    });
  }, []);

  const activeDayLabel = useMemo(() => {
    const d = weekDays.find((d) => d.name === activeDay);
    if (!d) return "";
    const isToday = activeDay.toLowerCase() === currentWeekday.toLowerCase();
    return isToday ? `Today, ${d.dateNum} ${d.month}` : `${activeDay}, ${d.dateNum} ${d.month}`;
  }, [activeDay, weekDays, currentWeekday]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = !menuData && (isOnline === false || isNetworkError(error, isOnline));
  if (showOffline && !loading) return shell(<OfflineDisplay onRetry={() => fetchMenu(selectedMess)} />);
  if (authLoading || (loading && !menuData)) return shell(<MessSkeleton />);
  if (error && !menuData) return shell(
    <div className="flex h-full items-center justify-center px-4">
      <ErrorDisplay title="Mess Menu Unreachable" message={error} onRetry={() => fetchMenu(selectedMess)} />
    </div>
  );

  return shell(
    <div className="w-full select-none overscroll-contain">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-tight">
            Mess Menu
          </h1>
          {profile?.hostel?.blockName && (
            <p className="text-[12px] text-muted-foreground/60 flex items-center gap-1.5 leading-none">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                Block {profile.hostel.blockName} · Room {profile.hostel.roomNumber}
              </span>
            </p>
          )}
        </div>
        <DrawerSelect
          value={selectedMess}
          onValueChange={(val) => setSelectedMess(val as MessType)}
          title="Select Mess"
          triggerClassName="h-8 text-xs px-3 shrink-0"
          options={MESS_OPTIONS.map((m) => ({ value: m, label: formatMessTypeLabel(m) }))}
        />
      </div>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="mx-4 mb-3 flex items-center justify-between gap-3 px-4 py-2.5 bg-destructive/8 border border-destructive/15 text-destructive rounded-2xl">
          <p className="text-[11px] font-semibold truncate">Sync failed — {error}</p>
          <button onClick={() => fetchMenu(selectedMess)} className="text-[11px] font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Day Picker ── */}
      <div className="px-4 pb-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {weekDays.map((d) => {
            const isSelected = d.name.toLowerCase() === activeDay.toLowerCase();
            const isToday = d.name.toLowerCase() === currentWeekday.toLowerCase();
            return (
              <button
                key={d.name}
                onClick={() => setActiveDay(d.name)}
                className={`flex flex-col items-center justify-center rounded-2xl shrink-0 w-[42px] py-2.5 gap-0.5 cursor-pointer transition-all duration-150 border-0 focus:outline-none
                  ${isSelected
                    ? "bg-foreground text-background"
                    : "bg-transparent text-muted-foreground hover:bg-muted/20"
                  }`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? "text-background/60" : "text-muted-foreground/50"}`}>
                  {d.abbr}
                </span>
                <span className={`text-[15px] font-bold leading-none ${isSelected ? "text-background" : "text-foreground/80"}`}>
                  {d.dateNum}
                </span>
                {/* Today dot */}
                <span className={`w-1 h-1 rounded-full transition-colors ${
                  isToday
                    ? isSelected ? "bg-background/50" : "bg-primary"
                    : "bg-transparent"
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Date label + divider ── */}
      <div className="px-4 pb-4 flex items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 shrink-0">
          {activeDayLabel}
        </p>
        <div className="flex-1 h-px bg-border/10" />
      </div>

      {/* ── Meals ── */}
      {activeDayMenu ? (
        <div className="divide-y divide-border/10 border-t border-border/10">
          {MEALS.map((meal) => {
            const meta = MEAL_META[meal];
            const Icon = meta.icon;
            const items = parseItems(
              (activeDayMenu[meal.toLowerCase() as keyof MessMenuItem] as string) || ""
            );

            return (
              <div key={meal} className="px-4 py-5 space-y-3.5">
                {/* Meal header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-muted/15 flex items-center justify-center shrink-0">
                      <Icon className="w-[18px] h-[18px] text-foreground/60" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-foreground leading-tight">{meal}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                        <span className="text-[11px] text-muted-foreground/50">{meta.timing}</span>
                      </div>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground/30 tabular-nums">
                      {items.length} items
                    </span>
                  )}
                </div>

                {/* Items */}
                {items.length > 0 ? (
                  <ul className="space-y-2 pl-12">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/30 shrink-0 mt-[7px]" />
                        <span className="text-[13px] text-foreground/75 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-muted-foreground/30 italic pl-12">
                    No items scheduled
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
          <p className="text-[15px] font-semibold text-foreground/40">No menu for {activeDay}</p>
          <p className="text-[12px] text-muted-foreground/30">Try selecting a different day</p>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
}
