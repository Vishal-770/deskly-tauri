import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTimetableCourses, TimetableCourse } from "@/lib/features";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Monitor,
  Beaker,
  Globe,
  Users,
  Search,
  FileText,
  User,
  MapPin,
  X,
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

// ─── Course Row Component ──────────────────────────────────────────────────────

function CourseRow({ item, index }: { item: TimetableCourse; index: number }) {
  const typeStyle = getCourseTypeStyle(item.courseType);
  const catStyle = getCategoryStyle(item.category);

  return (
    <div className="group py-4 px-3 -mx-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors duration-150">
      
      {/* Left: Code, Badges & Title */}
      <div className="flex-1 min-w-0 pr-4 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground/45 tabular-nums">
            {(index + 1).toString().padStart(2, "0")}
          </span>
          <span className="text-xs font-semibold font-mono tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md leading-none">
            {item.code}
          </span>
          {item.slot && (
            <span className="font-mono text-[10px] font-medium text-muted-foreground/75 bg-muted px-1.5 py-0.5 rounded leading-none">
              Slot: {item.slot}
            </span>
          )}
          <Badge
            variant="outline"
            className={`text-[10px] font-medium rounded-md border inline-flex items-center justify-center ${typeStyle.className} bg-current/5 border-current/25`}
          >
            {typeStyle.label}
          </Badge>
          {item.category && (
            <Badge
              variant="outline"
              className="text-[10px] font-medium border border-border/40 text-muted-foreground bg-muted/5 rounded-md inline-flex items-center justify-center truncate max-w-[180px]"
              title={catStyle.label}
            >
              {catStyle.label}
            </Badge>
          )}
        </div>
        
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {item.title}
        </h3>
      </div>

      {/* Middle: Instructor & Venue */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8 shrink-0 min-w-[240px] md:w-80">
        {/* Faculty */}
        {item.faculty?.name ? (
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="text-sm text-foreground/80 font-medium truncate" title={item.faculty.name}>
                {item.faculty.name}
              </span>
            </div>
            {item.faculty.school && (
              <p className="text-[11px] text-muted-foreground/50 font-medium uppercase tracking-wider pl-5.5">
                {item.faculty.school}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Venue */}
        {item.venue ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/80 shrink-0">
            <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <span className="font-normal">{item.venue}</span>
          </div>
        ) : (
          <div className="w-16 shrink-0" />
        )}
      </div>

      {/* Right: Credits */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 shrink-0 md:w-28 border-t border-border/5 md:border-t-0 pt-2.5 md:pt-0">
        <div className="text-left md:text-right">
          <span className="text-lg font-bold text-foreground leading-none tabular-nums">
            {item.credits?.total ?? 0}
          </span>
          <span className="text-xs text-muted-foreground/60 font-medium ml-1">Credits</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/45 leading-none tabular-nums">
          L·T·P·J: {item.credits?.lecture ?? 0}·{item.credits?.tutorial ?? 0}·{item.credits?.practical ?? 0}·{item.credits?.project ?? 0}
        </span>
      </div>

    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CoursesSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between pb-6 border-b border-border/40">
        <div className="space-y-2">
          <div className="animate-pulse rounded bg-muted/60 h-7 w-36" />
          <div className="animate-pulse rounded bg-muted/60 h-3 w-52" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 py-4 border-b border-border/10 justify-between animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-1 min-w-[100px] border-r border-border/10 last:border-r-0 px-2 first:pl-0 space-y-2">
            <div className="rounded bg-muted/60 h-3 w-16" />
            <div className="rounded bg-muted/60 h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 pb-4 border-b border-border/20 pt-4">
        <div className="animate-pulse rounded bg-muted/60 h-5 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="animate-pulse rounded-xl bg-muted/60 h-8" />
          <div className="animate-pulse rounded-xl bg-muted/60 h-8" />
          <div className="animate-pulse rounded-xl bg-muted/60 h-8" />
        </div>
      </div>
      <div className="divide-y divide-border/5 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="py-4 px-3 -mx-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 space-y-2 pr-4">
              <div className="rounded bg-muted/60 h-4 w-20" />
              <div className="rounded bg-muted/60 h-5 w-2/3" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-4 md:gap-8 shrink-0">
              <div className="rounded bg-muted/60 h-4 w-40" />
              <div className="rounded bg-muted/60 h-4 w-20" />
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

  const isLoading = authLoading || loading;

  return shell(
    <div className="w-full space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary shrink-0" />
            My Registered Courses
          </h1>
          <p className="text-xs text-muted-foreground">Courses you are registered for this semester</p>
        </div>
        {!isLoading && courses.length > 0 && (
          <span className="text-xs text-muted-foreground/50 font-bold pb-0.5">
            {filteredCourses.length} of {courses.length} courses
          </span>
        )}
      </header>

      {/* ── Top Stats Cards ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 py-4 border-b border-border/10 justify-between">
        {[
          { label: "Total Courses", value: courseStats.total, sub: "" },
          { label: "Total Credits", value: courseStats.totalCredits, sub: "" },
          { label: "Theory", value: courseStats.theory.count, sub: `${courseStats.theory.credits} Cr` },
          { label: "Lab", value: courseStats.lab.count, sub: `${courseStats.lab.credits} Cr` },
          { label: "Online", value: courseStats.online.count, sub: `${courseStats.online.credits} Cr` },
          { label: "Soft Skill", value: courseStats.softSkill.count, sub: `${courseStats.softSkill.credits} Cr` },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 min-w-[100px] border-r border-border/10 last:border-r-0 px-2 first:pl-0">
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none block">{stat.label}</span>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-xl font-semibold text-foreground leading-none">{stat.value}</span>
              {stat.sub && <span className="text-[10px] text-muted-foreground/60 font-medium leading-none">{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-border/20 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all disabled:opacity-50 text-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
          <SelectTrigger className="w-full h-10 rounded-xl bg-muted/10 border-border/20 text-xs">
            <SelectValue placeholder="All Course Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/30 bg-card">
            <SelectItem value="ALL">All Course Types</SelectItem>
            {filterOptions.types.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
          <SelectTrigger className="w-full h-10 rounded-xl bg-muted/10 border-border/20 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/30 bg-card">
            <SelectItem value="ALL">All Categories</SelectItem>
            {filterOptions.categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Registered Courses List ─────────────────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/20" />
          <p className="text-sm font-bold text-foreground">No registered courses found</p>
          <p className="text-xs text-muted-foreground">Try modifying your filters or search terms.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Table Header on Desktop */}
          <div className="hidden md:flex items-center justify-between px-3 pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/10">
            <div>Course Information</div>
            <div className="flex items-center gap-6">
              <span className="w-80 text-left">Instructor & Venue</span>
              <span className="w-28 text-right">Credits</span>
            </div>
          </div>

          {/* List Rows - Flat Design */}
          <div className="divide-y divide-border/5">
            {filteredCourses.map((item, idx) => (
              <CourseRow key={`${item.code}-${idx}`} item={item} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* ── Footer Summary ──────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <footer className="p-5 rounded-2xl bg-muted/10 border border-border/10 mt-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
