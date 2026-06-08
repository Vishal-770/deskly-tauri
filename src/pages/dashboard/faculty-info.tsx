import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTimetableCourses, TimetableCourse } from "@/lib/features";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import { Users, Search, X, BookOpen, MapPin, GraduationCap } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FacultyEntry = {
  name: string;
  school: string;
  courses: { code: string; title: string; slot: string; venue: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PALETTE = [
  "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
  "from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
  "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400",
  "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function FacultySkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="pb-4 border-b border-border/20 space-y-2">
        <Sk className="h-7 w-36" />
        <Sk className="h-3 w-60" />
      </div>
      <div className="flex gap-2">
        <Sk className="h-10 flex-1 rounded-xl" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[...Array(4)].map((_, i) => <Sk key={i} className="h-7 w-24 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/10 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Sk className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Sk className="h-4 w-3/4" />
                <Sk className="h-3 w-1/2" />
              </div>
            </div>
            <div className="h-px bg-border/10" />
            <div className="space-y-2">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="flex gap-2 items-start">
                  <Sk className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" />
                  <Sk className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Faculty Card ─────────────────────────────────────────────────────────────

function FacultyCard({ faculty, index }: { faculty: FacultyEntry; index: number }) {
  const palette = PALETTE[index % PALETTE.length];
  const initials = getInitials(faculty.name);

  return (
    <div className="group rounded-2xl border border-border/10 bg-card p-5 space-y-4 hover:border-border/30 transition-colors duration-200">
      {/* Avatar + Name */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${palette} border flex items-center justify-center shrink-0`}>
          <span className="text-sm font-black">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-foreground leading-snug">
            {faculty.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <GraduationCap className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-medium truncate">
              {faculty.school}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/10" />

      {/* Course list */}
      <div className="space-y-2.5">
        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
          {faculty.courses.length} {faculty.courses.length === 1 ? "Course" : "Courses"}
        </p>
        <ul className="space-y-2">
          {faculty.courses.map((course, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <BookOpen className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-extrabold text-foreground/85 leading-snug">
                  {course.code}
                  <span className="font-medium text-muted-foreground/60 ml-1">
                    · Slot {course.slot}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground/55 leading-snug truncate">
                  {course.title}
                </p>
                {course.venue && course.venue !== "NIL" && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
                    <span className="text-[9px] text-muted-foreground/40">{course.venue}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FacultyInfoPage() {
  const { loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<TimetableCourse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSchool, setActiveSchool] = useState<string>("All");

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTimetableCourses();
      if (res.success && res.data) setCourses(res.data);
      else setError(res.error ?? "Failed to load faculty information.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  // Aggregate faculty from courses — one entry per unique faculty name
  const facultyList = useMemo<FacultyEntry[]>(() => {
    if (!courses) return [];
    const map = new Map<string, FacultyEntry>();
    for (const course of courses) {
      const key = course.faculty.name.trim();
      if (!key || key === "NIL" || key === "-") continue;
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          school: course.faculty.school || "VIT",
          courses: [],
        });
      }
      map.get(key)!.courses.push({
        code: course.code,
        title: course.title,
        slot: course.slot,
        venue: course.venue,
      });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  // Unique schools for filter chips
  const schools = useMemo(() => {
    const set = new Set(facultyList.map((f) => f.school));
    return ["All", ...Array.from(set).sort()];
  }, [facultyList]);

  // Filter by search query + school chip
  const filtered = useMemo(() => {
    let list = facultyList;
    if (activeSchool !== "All") list = list.filter((f) => f.school === activeSchool);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.school.toLowerCase().includes(q) ||
          f.courses.some(
            (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
          )
      );
    }
    return list;
  }, [facultyList, activeSchool, query]);

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-4 sm:pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  if (error && !courses) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay title="Faculty Info Unavailable" message={error} onRetry={fetchCourses} />
      </div>
    );
  }

  const isLoading = authLoading || loading;

  return shell(
    <div className="w-full space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary shrink-0" />
            Faculty Info
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your registered course faculty for this semester
          </p>
        </div>
        {!isLoading && facultyList.length > 0 && (
          <span className="text-xs text-muted-foreground/50 font-bold pb-0.5">
            {filtered.length} of {facultyList.length} faculty
          </span>
        )}
      </header>

      {isLoading ? <FacultySkeleton /> : (
        <>
          {/* ── Search ──────────────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search faculty name, course code…"
              className="w-full h-10 pl-10 pr-10 rounded-xl border border-border/20 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── School Filter Chips ──────────────────────────────────────────── */}
          {schools.length > 2 && (
            <div className="flex gap-2 flex-wrap">
              {schools.map((school) => (
                <button
                  key={school}
                  onClick={() => setActiveSchool(school)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border
                    ${activeSchool === school
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40 bg-muted/10"
                    }
                  `}
                >
                  {school === "All" ? "All Schools" : school}
                </button>
              ))}
            </div>
          )}

          {/* ── Grid ────────────────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <Users className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-sm font-bold text-foreground">
                {facultyList.length === 0
                  ? "No faculty data available"
                  : "No faculty match your search"}
              </p>
              <p className="text-xs text-muted-foreground">
                {facultyList.length === 0
                  ? "Faculty info is derived from your timetable courses."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((faculty, i) => (
                <FacultyCard key={faculty.name} faculty={faculty} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
