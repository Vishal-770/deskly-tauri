import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTimetableCourses, TimetableCourse } from "@/lib/features";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  GraduationCap,
  Monitor,
  Beaker,
  Globe,
  Users,
  Search,
  FileText,
  User,
  MapPin,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCourseTypeStyle(type: string): { label: string; className: string } {
  const clean = type.trim().toUpperCase();
  if (clean.includes("EMBEDDED THEORY")) return { label: type, className: "text-primary" };
  if (clean.includes("EMBEDDED LAB")) return { label: type, className: "text-chart-2" };
  if (clean.includes("THEORY")) return { label: type, className: "text-primary" };
  if (clean.includes("LAB")) return { label: type, className: "text-chart-2" };
  if (clean.includes("ONLINE")) return { label: type, className: "text-chart-1" };
  if (clean.includes("SOFT SKILL") || clean.includes("SKILL")) return { label: type, className: "text-chart-4" };
  return { label: type, className: "text-muted-foreground" };
}

function getCategoryStyle(category: string): { label: string; className: string } {
  const clean = category.trim();
  const lower = clean.toLowerCase();
  if (lower.includes("discipline core")) return { label: clean, className: "text-foreground" };
  if (lower.includes("discipline elective")) return { label: clean, className: "text-foreground/80" };
  if (lower.includes("foundation core")) return { label: clean, className: "text-primary" };
  if (lower.includes("open elective")) return { label: clean, className: "text-muted-foreground" };
  return { label: clean, className: "text-muted-foreground" };
}

// ─── Course Card Component ─────────────────────────────────────────────────────

function CourseCard({ item, index }: { item: TimetableCourse; index: number }) {
  const typeStyle = getCourseTypeStyle(item.courseType);
  const catStyle = getCategoryStyle(item.category);

  return (
    <div className="bg-card/30 border border-border/25 rounded-2xl p-4 hover:border-border/50 transition-colors duration-200 flex flex-col gap-3">

      {/* ── Row 1: Course code + Credits pill ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums shrink-0">
            {item.slNo ?? index + 1}
          </span>
          <span className="text-sm font-extrabold tracking-widest text-primary uppercase leading-none shrink-0">
            {item.code}
          </span>
          {/* Slot chip */}
          <span className="font-mono text-[10px] font-black text-muted-foreground/60 bg-muted/60 px-1.5 py-0.5 rounded-md leading-none shrink-0">
            {item.slot}
          </span>
        </div>

        {/* Credits pill — always top-right */}
        <div className="shrink-0 text-right">
          <span className="text-xl font-black text-foreground leading-none tabular-nums">
            {item.credits?.total ?? 0}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-semibold ml-1">Cr</span>
          <p className="text-[9px] text-muted-foreground/45 font-medium mt-0.5 tabular-nums">
            {item.credits?.lecture ?? 0}·{item.credits?.tutorial ?? 0}·{item.credits?.practical ?? 0}·{item.credits?.project ?? 0}
          </p>
        </div>
      </div>

      {/* ── Row 2: Title ── */}
      <p className="text-sm font-bold text-foreground leading-snug -mt-1">
        {item.title}
      </p>

      {/* ── Row 3: Type + Category ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold shrink-0 ${typeStyle.className}`}>
          {typeStyle.label}
        </span>
        <span className="text-muted-foreground/25 text-xs shrink-0">·</span>
        <span
          className={`text-xs font-medium truncate max-w-[200px] ${catStyle.className}`}
          title={catStyle.label}
        >
          {catStyle.label}
        </span>
        {item.venue && (
          <>
            <span className="text-muted-foreground/25 text-xs shrink-0">·</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 font-medium shrink-0">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {item.venue}
            </span>
          </>
        )}
      </div>

      {/* ── Row 4: Faculty ── */}
      {item.faculty?.name && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-border/15">
          <User className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <span className="text-xs text-muted-foreground/80 font-semibold truncate" title={item.faculty.name}>
            {item.faculty.name}
          </span>
          {item.faculty.school && (
            <span className="text-[10px] text-muted-foreground/45 font-bold uppercase ml-1 shrink-0">
              · {item.faculty.school}
            </span>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function CoursesSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between pb-6 border-b border-border/40">
        <div className="space-y-2">
          <Sk className="h-7 w-36" />
          <Sk className="h-3 w-52" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px] space-y-3">
            <div className="flex justify-between">
              <Sk className="h-3 w-14" />
              <Sk className="h-4 w-4 rounded" />
            </div>
            <Sk className="h-6 w-10" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 pb-4 border-b border-border/20 pt-4">
        <Sk className="h-5 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Sk className="h-8 rounded-xl" />
          <Sk className="h-8 rounded-xl" />
          <Sk className="h-8 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card/40 border border-border/30 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between">
              <Sk className="h-4 w-20" />
              <Sk className="h-6 w-10" />
            </div>
            <Sk className="h-4 w-full" />
            <Sk className="h-3 w-3/4" />
            <div className="flex gap-2">
              <Sk className="h-3 w-16" />
              <Sk className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function CoursesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [courses, setCourses] = useState<TimetableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
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
    if (isLoggedIn) {
      load();
    }
  }, [isLoggedIn, authLoading]);

  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const categories = new Set<string>();
    courses.forEach((c) => {
      if (c.courseType) types.add(c.courseType.trim());
      if (c.category) categories.add(c.category.trim());
    });
    return {
      types: Array.from(types).sort(),
      categories: Array.from(categories).sort(),
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedTypeFilter === "ALL" || c.courseType.trim() === selectedTypeFilter;
      const matchesCategory =
        selectedCategoryFilter === "ALL" || c.category.trim() === selectedCategoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [courses, searchQuery, selectedTypeFilter, selectedCategoryFilter]);

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

    return {
      total,
      theory: { count: theoryCount, credits: theoryCredits },
      lab: { count: labCount, credits: labCredits },
      online: { count: onlineCount, credits: onlineCredits },
      softSkill: { count: softSkillCount, credits: softSkillCredits },
      totalCredits,
    };
  }, [courses]);

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  if (authLoading || (loading && courses.length === 0)) {
    return shell(<CoursesSkeleton />);
  }

  if (error && courses.length === 0) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary shrink-0" />
          My Registered Courses
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Courses you are registered for this semester</p>
      </header>

      {/* ── Top Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

        {[
          { label: "Total Courses", value: courseStats.total, sub: "", icon: <Layers className="w-4 h-4 text-primary" /> },
          { label: "Total Credits", value: courseStats.totalCredits, sub: "", icon: <GraduationCap className="w-4 h-4 text-primary" /> },
          { label: "Theory", value: courseStats.theory.count, sub: `${courseStats.theory.credits} Cr`, icon: <Monitor className="w-4 h-4 text-primary" /> },
          { label: "Lab", value: courseStats.lab.count, sub: `${courseStats.lab.credits} Cr`, icon: <Beaker className="w-4 h-4 text-primary" /> },
          { label: "Online", value: courseStats.online.count, sub: `${courseStats.online.credits} Cr`, icon: <Globe className="w-4 h-4 text-primary" /> },
          { label: "Soft Skill", value: courseStats.softSkill.count, sub: `${courseStats.softSkill.credits} Cr`, icon: <Users className="w-4 h-4 text-primary" /> },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col justify-between bg-card/40 border border-border/30 rounded-2xl p-4 min-h-[80px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">{stat.label}</span>
              <span className="shrink-0">{stat.icon}</span>
            </div>
            <div className="mt-3">
              <span className="text-xl font-black text-foreground leading-none">{stat.value}</span>
              {stat.sub && <span className="text-[10px] text-muted-foreground/70 font-semibold ml-1.5">{stat.sub}</span>}
            </div>
          </div>
        ))}

      </div>

      {/* ── Search & Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pb-4 border-b border-border/20 pt-1">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight">Registered Course List</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredCourses.length} of {courses.length} courses
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-muted/40 border border-border/30 rounded-xl text-xs outline-none focus:border-primary/50 text-foreground w-full transition-all"
            />
          </div>

          <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
            <SelectTrigger className="w-full rounded-xl bg-muted/40 border-border/30 text-xs">
              <SelectValue placeholder="All Course Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/30 bg-card">
              <SelectItem value="ALL">All Course Types</SelectItem>
              {filterOptions.types.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
            <SelectTrigger className="w-full rounded-xl bg-muted/40 border-border/30 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/30 bg-card">
              <SelectItem value="ALL">All Categories</SelectItem>
              {filterOptions.categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Course Cards Grid ───────────────────────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-bold text-foreground">No registered courses found</p>
            <p className="text-xs text-muted-foreground mt-1">Try modifying your filters or search terms.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCourses.map((item, idx) => (
            <CourseCard key={`${item.code}-${idx}`} item={item} index={idx} />
          ))}
        </div>
      )}

      {/* ── Footer Summary ──────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <footer className="p-4 rounded-2xl bg-muted/20 border border-border/10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Summary</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">Credit breakdown</p>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">Total</span>
              <span className="text-base font-black leading-none">{courseStats.totalCredits}</span>
              <span className="text-[10px] font-semibold leading-none opacity-70">Cr</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Monitor className="w-3.5 h-3.5 text-primary/70" />, label: "Theory", count: courseStats.theory.count, credits: courseStats.theory.credits },
              { icon: <Beaker className="w-3.5 h-3.5 text-primary/70" />, label: "Lab", count: courseStats.lab.count, credits: courseStats.lab.credits },
              { icon: <Globe className="w-3.5 h-3.5 text-primary/70" />, label: "Online", count: courseStats.online.count, credits: courseStats.online.credits },
              { icon: <Users className="w-3.5 h-3.5 text-primary/70" />, label: "Soft Skill", count: courseStats.softSkill.count, credits: courseStats.softSkill.credits },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{row.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55 truncate">{row.label}</p>
                  <p className="text-sm font-black text-foreground leading-none">
                    {row.count}
                    <span className="text-[10px] font-semibold text-muted-foreground ml-1">({row.credits} Cr)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </footer>
      )}

    </div>
  );
}
