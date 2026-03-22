import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Building2,
  Hash,
  Search,
} from "lucide-react";
import { getTimetableCourses, type TimetableCourse } from "@/lib/features";
import { useSemester } from "@/hooks/useSemester";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { motion } from "framer-motion";


/* -------------------- Components -------------------- */

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{label}</p>
      <p className="text-4xl md:text-5xl font-black tracking-tightest text-foreground">
        {value}
      </p>
    </div>
  );
}

function CourseItem({ course, index }: { course: TimetableCourse; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col gap-4 py-8 border-b border-border/50 hover:bg-muted/5 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {course.code}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {course.courseType}
            </span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-none">
            {course.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-8 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Slot</p>
            <p className="text-lg font-black tracking-tightest text-foreground font-mono">{course.slot}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Venue</p>
            <p className="text-lg font-black tracking-tightest text-foreground">{course.venue}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Credits</p>
            <p className="text-lg font-black tracking-tightest text-primary">{course.credits.total}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Faculty</p>
            <p className="text-xs font-bold text-foreground">{course.faculty.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">School</p>
            <p className="text-xs font-bold text-foreground">{course.faculty.school}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
           <Hash className="w-3 h-3" />
           <span className="text-[10px] font-mono tracking-tighter uppercase">{course.classId}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<TimetableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    const total = courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.total, 0);
    const lecture = courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.lecture, 0);
    const tutorial = courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.tutorial, 0);
    const practical = courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.practical, 0);
    const project = courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.project, 0);
    
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
    <div className="p-6 lg:p-10 space-y-16 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-8 bg-primary rounded-full" />
               <h1 className="text-4xl md:text-5xl font-black tracking-tightest text-foreground uppercase">
                 Courses
               </h1>
             </div>
             <p className="text-sm text-muted-foreground font-medium opacity-50 tracking-wide pl-4">
               {currentSemester?.name || "Semester Academic Overview"}
             </p>
          </div>
          
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search code, title or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-muted/20 pl-11 pr-4 text-sm font-bold placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-y-8 gap-x-12 md:grid-cols-4 pt-4">
          <StatItem label="Courses" value={courses.length} />
          <StatItem label="Total Credits" value={stats.total} />
          <StatItem label="Lecture Hrs" value={stats.lecture + stats.tutorial} />
          <StatItem label="Lab/Proj Hrs" value={stats.lab} />
        </div>
      </header>

      {/* Course List Section */}
      <section className="space-y-10">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <h2 className="text-2xl font-black text-foreground tracking-tightest uppercase">Registered Courses</h2>
          <span className="bg-primary/5 text-primary text-xs font-black px-3 py-1 rounded-full border border-primary/10">
            {filteredCourses.length}
          </span>
        </div>

        <div className="flex flex-col">
          {filteredCourses.map((course, index) => (
            <CourseItem key={course.classId} course={course} index={index} />
          ))}

          {filteredCourses.length === 0 && searchQuery && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-xl font-black text-foreground tracking-tight">No matches found</p>
              <p className="text-sm text-muted-foreground font-medium opacity-50">Try searching for course code or title</p>
            </div>
          )}
        </div>
      </section>

      {/* Credit Distribution Details */}
      <section className="space-y-10 pt-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full opacity-40" />
          <h2 className="text-xl font-black text-foreground tracking-tightest uppercase">Credit Distribution</h2>
        </div>
        
        <div className="overflow-x-auto no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Code</th>
                <th className="py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Title</th>
                <th className="py-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">L</th>
                <th className="py-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">T</th>
                <th className="py-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">P</th>
                <th className="py-4 text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground">J</th>
                <th className="py-4 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {courses.map((course) => (
                <tr key={course.classId} className="hover:bg-muted/10 transition-colors group">
                  <td className="py-5 font-bold text-primary text-xs">{course.code}</td>
                  <td className="py-5 text-foreground font-bold text-sm truncate max-w-[200px] md:max-w-md">{course.title}</td>
                  <td className="py-5 text-center text-muted-foreground font-mono font-bold text-xs">{course.credits.lecture}</td>
                  <td className="py-5 text-center text-muted-foreground font-mono font-bold text-xs">{course.credits.tutorial}</td>
                  <td className="py-5 text-center text-muted-foreground font-mono font-bold text-xs">{course.credits.practical}</td>
                  <td className="py-5 text-center text-muted-foreground font-mono font-bold text-xs">{course.credits.project}</td>
                  <td className="py-5 text-right font-black text-foreground/80">{course.credits.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-black">
                <td colSpan={2} className="py-6 text-muted-foreground uppercase tracking-widest text-[10px]">Total Program Credits</td>
                <td className="py-6 text-center text-foreground font-mono">{stats.lecture}</td>
                <td className="py-6 text-center text-foreground font-mono">{stats.tutorial}</td>
                <td className="py-6 text-center text-foreground font-mono">{courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.practical, 0)}</td>
                <td className="py-6 text-center text-foreground font-mono">{courses.reduce((sum: number, c: TimetableCourse) => sum + c.credits.project, 0)}</td>
                <td className="py-6 text-right text-primary text-2xl tracking-tightest">{stats.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
