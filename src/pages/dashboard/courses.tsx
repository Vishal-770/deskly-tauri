import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTimetableCourses, TimetableCourse } from "@/lib/features";

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
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCourseTypeStyle(type: string): { label: string; className: string } {
  const clean = type.trim().toUpperCase();
  if (clean.includes("EMBEDDED THEORY")) return { label: type, className: "text-sky-400 bg-sky-500/10 border-sky-500/15" };
  if (clean.includes("EMBEDDED LAB")) return { label: type, className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" };
  if (clean.includes("THEORY")) return { label: type, className: "text-sky-400 bg-sky-500/10 border-sky-500/15" };
  if (clean.includes("LAB")) return { label: type, className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" };
  if (clean.includes("ONLINE")) return { label: type, className: "text-purple-400 bg-purple-500/10 border-purple-500/15" };
  if (clean.includes("SOFT SKILL") || clean.includes("SKILL")) return { label: type, className: "text-amber-400 bg-amber-500/10 border-amber-500/15" };
  return { label: type, className: "text-muted-foreground bg-muted/30 border-border/20" };
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

  const isLoading = authLoading || loading;
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
        <Layers className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none truncate">
            My Courses
          </h1>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            {!isLoading ? `${filteredCourses.length} of ${courses.length} courses` : "Registered this semester"}
          </p>
        </div>
      </header>

      {/* ── Stats Card ──────────────────────────────────────────────────────── */}
      <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-border/10" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-border/10" />
        <div className="grid grid-cols-3">
          {[
            { icon: Layers, label: "Total", value: courseStats.total, color: "text-sky-400" },
            { icon: Monitor, label: "Credits", value: courseStats.totalCredits, color: "text-emerald-400" },
            { icon: Beaker, label: "Labs", value: courseStats.lab.count, color: "text-amber-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</span>
              </div>
              <span className="text-2xl font-medium text-foreground leading-none">{value}</span>
            </div>
          ))}
        </div>
      </div>

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
        <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
          {filteredCourses.map((item, idx) => {
            const typeStyle = getCourseTypeStyle(item.courseType);
            return (
              <div key={`${item.code}-${idx}`} className="p-4 space-y-3">
                {/* Top row: index, code, type badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-muted-foreground/30 tabular-nums w-5 shrink-0">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold text-sky-500 uppercase tracking-wide leading-none">
                    {item.code}
                  </span>
                  {item.slot && (
                    <span className="font-mono text-[10px] text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded leading-none">
                      {item.slot}
                    </span>
                  )}
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none ${typeStyle.className}`}>
                    {typeStyle.label}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground/50 bg-muted/30 border border-border/20 px-1.5 py-0.5 rounded leading-none ml-auto">
                    {item.credits?.total ?? 0} Cr
                  </span>
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
                      <span className="text-xs text-muted-foreground/70 truncate">{item.faculty.name}</span>
                    </div>
                  )}
                  {item.venue && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                      <span className="text-xs text-muted-foreground/70">{item.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer Summary ───────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
            Credit Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Monitor, label: "Theory", count: courseStats.theory.count, credits: courseStats.theory.credits, color: "text-sky-400" },
              { icon: Beaker, label: "Lab", count: courseStats.lab.count, credits: courseStats.lab.credits, color: "text-emerald-400" },
              { icon: Globe, label: "Online", count: courseStats.online.count, credits: courseStats.online.credits, color: "text-purple-400" },
              { icon: Users, label: "Soft Skill", count: courseStats.softSkill.count, credits: courseStats.softSkill.credits, color: "text-amber-400" },
            ].map(({ icon: Icon, label, count, credits, color }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 leading-none">{label}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                    {count}
                    <span className="text-[10px] font-medium text-muted-foreground/50 ml-1">({credits} Cr)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
