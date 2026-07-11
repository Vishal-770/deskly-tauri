import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@/router";
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
import { Coffee, Utensils, Cookie, Soup, MapPin, Clock, Bell, Calendar } from "lucide-react";

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

type MealMeta = {
  timing: string;
  icon: React.ElementType;
  illustration: React.ReactNode;
};

const MEAL_META: Record<string, MealMeta> = {
  Breakfast: {
    timing: "07:30 – 09:30 AM",
    icon: Coffee,
    illustration: (
      <svg className="absolute bottom-2 right-2 w-24 h-24 text-primary opacity-[0.035] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <path d="M6 1v3" />
        <path d="M10 1v3" />
        <path d="M14 1v3" />
      </svg>
    ),
  },
  Lunch: {
    timing: "12:30 – 02:30 PM",
    icon: Utensils,
    illustration: (
      <svg className="absolute bottom-2 right-2 w-24 h-24 text-primary opacity-[0.035] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M2 12a10 10 0 0 0 20 0H2Z" />
        <path d="M12 2v3M8 3v2M16 3v2" />
        <path d="M6 18c0-1.5 2-2.5 6-2.5s6 1 6 2.5" />
      </svg>
    ),
  },
  Snacks: {
    timing: "05:00 – 06:30 PM",
    icon: Cookie,
    illustration: (
      <svg className="absolute bottom-2 right-2 w-24 h-24 text-primary opacity-[0.035] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="12" cy="12" r="10" />
        <circle cx="8" cy="9" r="1.5" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        <circle cx="7" cy="15" r="1" fill="currentColor" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  Dinner: {
    timing: "07:30 – 09:30 PM",
    icon: Soup,
    illustration: (
      <svg className="absolute bottom-2 right-2 w-24 h-24 text-primary opacity-[0.035] pointer-events-none select-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M3 12a9 9 0 0 0 18 0H3Z" />
        <path d="M12 2c-.5 2-1.5 3-2 5M16 2c-.5 2-1.5 3-2 5M8 2c-.5 2-1.5 3-2 5" />
      </svg>
    ),
  },
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
  const navigate = useNavigate();
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
    const abbr = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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
    return `${activeDay}, ${d.dateNum} ${d.month}`;
  }, [activeDay, weekDays]);

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
    <div className="w-full select-none overscroll-contain pb-8 space-y-7">

      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-2 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h1 className="text-[28px] font-black tracking-tight text-foreground leading-tight">
            Mess <span className="text-primary">Menu</span>
            <span className="text-[16px] text-primary ml-1.5 align-super">✨</span>
          </h1>
          <div className="space-y-0.5">
            <p className="text-[12.5px] font-semibold text-foreground/80 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {profile?.hostel?.blockName ? `${profile.hostel.blockName} Block` : "Block A Block"} {profile?.student?.gender?.toLowerCase() === "female" ? "Womens" : "Mens"} Hostel (MH)
              </span>
            </p>
            {profile?.hostel?.roomNumber && (
              <p className="text-[11.5px] text-muted-foreground/50 pl-5">
                {profile.hostel.blockName ? `${profile.hostel.blockName} - Block, ` : ""}Room {profile.hostel.roomNumber}
              </p>
            )}
          </div>
        </div>
        <DrawerSelect
          value={selectedMess}
          onValueChange={(val) => setSelectedMess(val as MessType)}
          title="Select Mess"
          triggerClassName="h-8.5 text-xs px-3.5 bg-muted/40 border border-border/30 rounded-full shrink-0 font-semibold"
          options={MESS_OPTIONS.map((m) => ({ value: m, label: formatMessTypeLabel(m) }))}
        />
      </div>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="mx-5 flex items-center justify-between gap-3 px-4 py-2.5 bg-destructive/8 border border-destructive/15 text-destructive rounded-2xl">
          <p className="text-[11px] font-semibold truncate">Sync failed — {error}</p>
          <button onClick={() => fetchMenu(selectedMess)} className="text-[11px] font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Day Picker ── */}
      <div className="px-5">
        <div className="border border-border/20 bg-muted/20 rounded-2.5xl p-2 flex gap-1.5 justify-between">
          {weekDays.map((d) => {
            const isSelected = d.name.toLowerCase() === activeDay.toLowerCase();
            const isToday = d.name.toLowerCase() === currentWeekday.toLowerCase();
            return (
              <button
                key={d.name}
                onClick={() => setActiveDay(d.name)}
                className={`flex flex-col items-center justify-center rounded-2xl flex-1 py-3.5 gap-0.5 cursor-pointer transition-all duration-200 border border-transparent focus:outline-none relative
                  ${isSelected
                    ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(var(--primary),0.15)]"
                    : "bg-transparent text-muted-foreground hover:bg-muted/10"
                  }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground/40"}`}>
                  {d.abbr}
                </span>
                <span className={`text-[16px] font-black leading-none mt-0.5 ${isSelected ? "text-primary-foreground" : "text-foreground/90"}`}>
                  {d.dateNum}
                </span>
                {/* Today dot indicator */}
                {isToday && (
                  <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Date Title with horizontal lines ── */}
      <div className="px-5 flex items-center justify-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/20" />
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-widest">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{activeDayLabel}</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/20" />
      </div>

      {/* ── Meals ── */}
      {activeDayMenu ? (
        <div className="px-5 space-y-6">
          {MEALS.map((meal) => {
            const meta = MEAL_META[meal];
            const Icon = meta.icon;
            const items = parseItems(
              (activeDayMenu[meal.toLowerCase() as keyof MessMenuItem] as string) || ""
            );

            // Split items into 2 columns for a clean visual hierarchy
            const mid = Math.ceil(items.length / 2);
            const leftCol = items.slice(0, mid);
            const rightCol = items.slice(mid);

            return (
              <div
                key={meal}
                className="relative rounded-[24px] border border-border/60 bg-card hover:border-primary/20 transition-all p-6 space-y-5 overflow-hidden shadow-sm"
              >
                {/* Graphic Illustration Background */}
                {meta.illustration}

                {/* Meal header */}
                <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-border/80 bg-muted/30 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-foreground leading-tight">{meal}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/35 shrink-0" />
                        <span className="text-[11.5px] text-muted-foreground/50">{meta.timing}</span>
                      </div>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-border/60 bg-muted/40 text-muted-foreground">
                      {items.length} items
                    </span>
                  )}
                </div>

                {/* Split Two-Column list */}
                {items.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 pl-13 pr-6 relative z-10 pt-1">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {leftCol.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-primary/70" />
                          <span className="text-[13px] text-foreground/80 leading-snug font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                    {/* Right Column */}
                    <div className="space-y-3">
                      {rightCol.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-primary/70" />
                          <span className="text-[13px] text-foreground/80 leading-snug font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-muted-foreground/30 italic pl-13 relative z-10">
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

      {/* ── Notice Banner at bottom ── */}
      <div className="px-5">
        <div className="bg-card border border-border/50 rounded-[20px] p-5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bell className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] text-foreground/80 font-medium leading-normal">
                Menu may change based on availability and seasonal variations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard/timetable")}
            className="bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 px-3.5 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View Timetable</span>
          </button>
        </div>
      </div>

    </div>
  );
}
