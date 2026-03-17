import { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  Hash,
  Building2,
  Layers,
  FileText,
  Tag,
  Search,
  List,
  LayoutGrid,
} from "lucide-react";
import { getTimetableCourses, type TimetableCourse } from "@/lib/features";
import { useSemester } from "@/hooks/useSemester";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { cn } from "@/lib/utils";

/* -------------------- Components -------------------- */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function CourseCard({
  course,
  viewMode = "list",
}: {
  course: TimetableCourse;
  viewMode?: "list" | "grid";
}) {
  return (
    <div className={cn(
      "group rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/20",
      viewMode === "grid" ? "flex flex-col h-full" : "flex flex-col"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary border border-primary/20">
            {course.slNo}
          </span>
          <span className="rounded-lg bg-primary/90 px-2.5 py-1 text-[10px] font-black text-primary-foreground uppercase tracking-widest shadow-sm">
            {course.code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground bg-background/50 px-2 py-1 rounded-md border border-border/30">
            {course.classGroup}
          </span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 border border-emerald-500/20">
            {course.credits.total} Credits
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <h3 className={cn(
          "mb-5 font-bold text-foreground leading-tight group-hover:text-primary transition-colors",
          viewMode === "grid" ? "text-base line-clamp-2" : "text-lg"
        )}>
          {course.title}
        </h3>

        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        )}>
          {/* Course Info */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              Course Info
            </p>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center gap-2.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground">{course.courseType}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span className="text-foreground truncate" title={course.category}>
                  {course.category}
                </span>
              </div>
            </div>
          </div>

          {/* Faculty */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              Faculty
            </p>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center gap-2.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground font-bold">{course.faculty.name}</span>
              </div>
              <div className="flex items-center gap-2.5 pl-6">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {course.faculty.school}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
              Schedule
            </p>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Slot:</span>
                <span className="font-mono font-black text-foreground">{course.slot}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Venue:</span>
                <span className="text-foreground font-bold">{course.venue}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-[10px] text-foreground opacity-70">
                  {course.classId}
                </span>
              </div>
            </div>
          </div>

          {/* Credits Distribution */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
              Credits
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: course.credits.lecture, label: "L" },
                { val: course.credits.tutorial, label: "T" },
                { val: course.credits.practical, label: "P" },
                { val: course.credits.project, label: "J" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border border-border/30 bg-muted/20 p-1.5 text-center">
                  <p className="text-xs font-black text-foreground">{item.val}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<TimetableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { currentSemester } = useSemester();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await getTimetableCourses();
        if (res.success && res.data) {
          setCourses(res.data);
        } else {
          setError(res.error || "Failed to load courses");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [currentSemester?.id]);

  const stats = useMemo(() => {
    const total = courses.reduce((sum, c) => sum + c.credits.total, 0);
    const lecture = courses.reduce((sum, c) => sum + c.credits.lecture, 0);
    const tutorial = courses.reduce((sum, c) => sum + c.credits.tutorial, 0);
    const practical = courses.reduce((sum, c) => sum + c.credits.practical, 0);
    const project = courses.reduce((sum, c) => sum + c.credits.project, 0);
    
    return {
      total,
      lecture,
      lab: practical + project,
      tutorial
    };
  }, [courses]);

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.faculty.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading && courses.length === 0) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Controls */}
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card/30 p-6 rounded-3xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Time Table</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {currentSemester?.name || "Semester Overview"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Filter by code, title or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "grid" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Courses" value={courses.length} icon={BookOpen} />
        <StatCard label="Total Credits" value={stats.total} icon={GraduationCap} />
        <StatCard label="Lecture Hrs" value={stats.lecture + stats.tutorial} icon={Users} />
        <StatCard label="Lab/Proj Hrs" value={stats.lab} icon={Layers} />
      </div>

      {/* Course List Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-lg font-black text-foreground tracking-tight">Registered Courses</h2>
          <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/20">
            {filteredCourses.length}
          </span>
        </div>

        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredCourses.map((course) => (
            <CourseCard key={course.classId} course={course} viewMode={viewMode} />
          ))}
        </div>

        {filteredCourses.length === 0 && searchQuery && (
          <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-bold text-muted-foreground">No matches found</p>
            <p className="text-sm text-muted-foreground/60">Try searching for course code or title</p>
          </div>
        )}
      </div>

      {/* Credit Distribution Table */}
      <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden shadow-xl">
        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-black text-foreground tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            Credit Distribution Details
          </h2>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="px-6 py-4 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">L</th>
                <th className="px-6 py-4 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">T</th>
                <th className="px-6 py-4 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">P</th>
                <th className="px-6 py-4 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground">J</th>
                <th className="px-6 py-4 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground pr-8">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {courses.map((course) => (
                <tr key={course.classId} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-mono text-primary font-bold">{course.code}</td>
                  <td className="px-6 py-4 text-foreground font-medium truncate max-w-[200px]">{course.title}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground font-mono">{course.credits.lecture}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground font-mono">{course.credits.tutorial}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground font-mono">{course.credits.practical}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground font-mono">{course.credits.project}</td>
                  <td className="px-6 py-4 text-right font-black text-foreground/80 pr-8">{course.credits.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-primary/5">
              <tr className="font-black border-t-2 border-primary/20">
                <td colSpan={2} className="px-6 py-5 text-foreground uppercase tracking-widest text-xs">Total Program Credits</td>
                <td className="px-6 py-5 text-center text-foreground">{stats.lecture}</td>
                <td className="px-6 py-5 text-center text-foreground">{stats.tutorial}</td>
                <td className="px-6 py-5 text-center text-foreground">{courses.reduce((sum, c) => sum + c.credits.practical, 0)}</td>
                <td className="px-6 py-5 text-center text-foreground">{courses.reduce((sum, c) => sum + c.credits.project, 0)}</td>
                <td className="px-6 py-5 text-right text-primary text-lg pr-8">{stats.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
