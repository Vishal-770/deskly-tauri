import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTimetableCourses, TimetableCourse } from "@/lib/features";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

import { ErrorDisplay } from "@/components/error-display";
import { DrawerSelect } from "@/components/ui/drawer-select";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import {
  Layers,
  Monitor,
  Beaker,
  Globe,
  Users,
  FileText,
  User,
  MapPin,
  Hash,
  LayoutGrid,
  GraduationCap,
  School,
  ChevronRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CourseDetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: TimetableCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  const displayType = item.courseType.toLowerCase().includes("lab") ? "Lab Only" : "Theory Only";

  const details = [
    { icon: Hash,          label: "Course Code",  value: item.code },
    { icon: LayoutGrid,    label: "Slot",         value: item.slot || "—" },
    { icon: GraduationCap, label: "Course Type",  value: item.courseType },
    { icon: Monitor,       label: "Credits",      value: `${item.credits?.total ?? 0} Credits` },
    { icon: User,          label: "Faculty",      value: item.faculty?.name ?? "—" },
    { icon: School,        label: "School",       value: item.faculty?.school ?? "—" },
    { icon: MapPin,        label: "Venue / Room", value: item.venue || "—" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8 font-saira max-h-[92vh]">
        <div className="overflow-y-auto no-scrollbar px-6 space-y-7 pt-5">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-sm font-medium tracking-wide text-primary uppercase">
                  {item.code}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  ({displayType})
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground leading-snug tracking-tight">
                {item.title}
              </h2>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-muted/65 flex items-center justify-center text-foreground hover:bg-muted active:opacity-75 transition-colors border-none cursor-pointer shrink-0"
            >
              <span className="text-lg leading-none font-sans">×</span>
            </button>
          </div>

          <Separator className="bg-border/25" />

          {/* Course Details List */}
          <div className="space-y-3 pt-1">
            <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground/60 uppercase leading-none">
              Course Details
            </p>

            <div className="divide-y divide-border/10">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3">
                  {/* Left Column: Icon Box */}
                  <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                  </div>
                  
                  {/* Right Column: Text contents */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold leading-none mb-1">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function CoursesSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4">
      <div className="space-y-1">
        <Sk className="h-7 w-44" />
        <Sk className="h-3 w-56" />
      </div>
      <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-border/10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Sk className="h-3 w-14" />
              <Sk className="h-7 w-10" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Sk className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Sk className="h-10 rounded-xl" />
          <Sk className="h-10 rounded-xl" />
        </div>
      </div>
      <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="flex-1 space-y-2">
              <Sk className="h-3 w-24" />
              <Sk className="h-4 w-48" />
            </div>
            <Sk className="h-6 w-10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function CoursesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();

  const [courses, setCourses] = useState<TimetableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<TimetableCourse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::courses");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TimetableCourse[];
        if (parsed.length > 0) {
          setCourses(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached courses", e);
      }
    }
  }, []);

  async function load() {
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;
      setLoading(courses.length > 0 ? false : true);
      const res = await getTimetableCourses();
      if (res.success && res.data) {
        setCourses(res.data);
        localStorage.setItem("deskly::cache::courses", JSON.stringify(res.data));
      } else {
        setError(res.error ?? "Failed to fetch registered courses.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) load();
  }, [isLoggedIn, authLoading]);

  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const categories = new Set<string>();
    courses.forEach((c) => {
      if (c.courseType) types.add(c.courseType.trim());
      if (c.category) categories.add(c.category.trim());
    });
    return { types: Array.from(types).sort(), categories: Array.from(categories).sort() };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesType = selectedTypeFilter === "ALL" || c.courseType.trim() === selectedTypeFilter;
      const matchesCategory = selectedCategoryFilter === "ALL" || c.category.trim() === selectedCategoryFilter;
      return matchesType && matchesCategory;
    });
  }, [courses, selectedTypeFilter, selectedCategoryFilter]);

  const courseStats = useMemo(() => {
    let total = 0, theoryCount = 0, theoryCredits = 0, labCount = 0, labCredits = 0;
    let onlineCount = 0, onlineCredits = 0, softSkillCount = 0, softSkillCredits = 0, totalCredits = 0;
    courses.forEach((c) => {
      total++;
      const type = c.courseType.toLowerCase();
      const credits = c.credits.total;
      totalCredits += credits;
      if (type.includes("embedded theory")) { theoryCount++; theoryCredits += credits; }
      else if (type.includes("embedded lab")) { labCount++; labCredits += credits; }
      else if (type.includes("theory")) { theoryCount++; theoryCredits += credits; }
      else if (type.includes("lab")) { labCount++; labCredits += credits; }
      else if (type.includes("online")) { onlineCount++; onlineCredits += credits; }
      else if (type.includes("soft skill") || type.includes("skill")) { softSkillCount++; softSkillCredits += credits; }
      else {
        if (c.code.endsWith("P")) { labCount++; labCredits += credits; }
        else { theoryCount++; theoryCredits += credits; }
      }
    });
    return { total, theory: { count: theoryCount, credits: theoryCredits }, lab: { count: labCount, credits: labCredits }, online: { count: onlineCount, credits: onlineCredits }, softSkill: { count: softSkillCount, credits: softSkillCredits }, totalCredits };
  }, [courses]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = courses.length === 0 && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={load} />);
  }

  if (authLoading || (loading && courses.length === 0)) return shell(<CoursesSkeleton />);

  if (error && courses.length === 0) {
    return shell(
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay message={error} onRetry={load} />
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
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <Layers className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none truncate">
            My Courses
          </h1>
        </div>
      </header>

      <Separator className="bg-border/25" />

      {/* ── Stats block ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-1 text-center">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-2">Total</p>
          <p className="text-2xl font-bold text-foreground leading-none">{courseStats.total}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/25 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-2">Credits</p>
          <p className="text-2xl font-bold text-foreground leading-none">{courseStats.totalCredits}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/25 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-2">Labs</p>
          <p className="text-2xl font-bold text-foreground leading-none">{courseStats.lab.count}</p>
        </div>
      </div>

      <Separator className="bg-border/25" />

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <DrawerSelect
            value={selectedTypeFilter}
            onValueChange={setSelectedTypeFilter}
            title="Filter by Type"
            triggerClassName="w-full h-10"
            options={[
              { value: "ALL", label: "All Types" },
              ...filterOptions.types.map((type) => ({ value: type, label: type })),
            ]}
          />
          <DrawerSelect
            value={selectedCategoryFilter}
            onValueChange={setSelectedCategoryFilter}
            title="Filter by Category"
            triggerClassName="w-full h-10"
            options={[
              { value: "ALL", label: "All Categories" },
              ...filterOptions.categories.map((cat) => ({ value: cat, label: cat })),
            ]}
          />
        </div>
      </div>

      {/* ── Section label ────────────────────────────────────────────────────── */}
      <h2 className="text-base font-semibold text-foreground tracking-tight leading-none uppercase">
        Registered Courses
      </h2>

      {/* ── Course List ──────────────────────────────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-muted/15 dark:bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No courses found</p>
          <p className="text-xs text-muted-foreground">Try modifying the type or category filters.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {filteredCourses.map((item, idx) => {
            return (
              <div
                key={`${item.code}-${idx}`}
                onClick={() => {
                  setSelectedCourse(item);
                  setDrawerOpen(true);
                }}
                className="py-4 flex items-center justify-between gap-4 active:opacity-75 hover:bg-muted/5 transition-all cursor-pointer"
              >
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Top row: index, code, type, slot, credits as plain text items */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
                    <span className="font-semibold text-muted-foreground/30 tabular-nums w-4 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide leading-none">
                      {item.code}
                    </span>
                    <span>&bull;</span>
                    <span className="uppercase">{item.courseType}</span>
                    {item.slot && (
                      <>
                        <span>&bull;</span>
                        <span className="font-mono">{item.slot}</span>
                      </>
                    )}
                    <span>&bull;</span>
                    <span>{item.credits?.total ?? 0} Credits</span>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {item.title}
                  </p>

                  {/* Faculty & Venue */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {item.faculty?.name && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs text-muted-foreground/75 truncate">{item.faculty.name}</span>
                      </div>
                    )}
                    {item.venue && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs text-muted-foreground/75">{item.venue}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chevron indicator */}
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer Summary ───────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/10">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
            Credit Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Monitor, label: "Theory", count: courseStats.theory.count, credits: courseStats.theory.credits },
              { icon: Beaker, label: "Lab", count: courseStats.lab.count, credits: courseStats.lab.credits },
              { icon: Globe, label: "Online", count: courseStats.online.count, credits: courseStats.online.credits },
              { icon: Users, label: "Soft Skill", count: courseStats.softSkill.count, credits: courseStats.softSkill.credits },
            ].map(({ icon: Icon, label, count, credits }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 leading-none mb-1">{label}</p>
                  <p className="text-sm font-semibold text-foreground leading-none">
                    {count} <span className="text-[10px] font-normal text-muted-foreground/50 ml-0.5">({credits} Cr)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CourseDetailDrawer
        item={selectedCourse}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
