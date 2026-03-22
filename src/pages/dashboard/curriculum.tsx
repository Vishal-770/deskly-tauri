import { useEffect, useState, useMemo } from "react";
import {
  getCurriculumCategories,
  getCurriculumCategoryCourses,
  downloadCurriculumSyllabus,
  type CurriculumCategory,
  type CurriculumCourse,
} from "@/lib/features";
import { Download, Loader2, Check, BookOpen, Layers, ScrollText, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { StatItem } from "@/components/stat-item";
import { cn } from "@/lib/utils";

/* -------------------- Helper Components -------------------- */


function CurriculumCourseItem({ 
  course, 
  index, 
  onDownload, 
  downloading, 
  downloaded 
}: { 
  course: CurriculumCourse; 
  index: number; 
  onDownload: (code: string) => void; 
  downloading: string | null; 
  downloaded: string | null; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group flex flex-col gap-4 py-8 border-b border-border/50 hover:bg-muted/5 transition-colors px-2 rounded-2xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 leading-none">
              {course.code}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">
              {course.courseType}
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tightest text-foreground group-hover:text-primary transition-colors truncate">
            {course.title}
          </h3>
        </div>

        <div className="flex items-center gap-12 shrink-0">
          <div className="text-right">
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30 mb-1">Credits</p>
             <p className="text-lg font-black tracking-tightest text-foreground font-mono">{course.credits}</p>
          </div>
          <div className="flex items-center pr-2">
             <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-2xl transition-all duration-300",
                  downloaded === course.code 
                    ? "bg-primary/10 text-primary" 
                    : typing(downloading === course.code)
                      ? "bg-primary/5"
                      : "bg-muted/10 hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => onDownload(course.code)}
                disabled={downloading === course.code}
             >
                {downloading === course.code ? (
                   <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : downloaded === course.code ? (
                   <Check className="w-5 h-5 text-primary" />
                ) : (
                   <Download className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                )}
             </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function typing(val: any) {
    return val;
}

/* -------------------- Page -------------------- */

export default function CurriculumPage() {
  const [categories, setCategories] = useState<CurriculumCategory[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setLoading(true);
        const res = await getCurriculumCategories();
        if (res.success && res.data) {
          setCategories(res.data);
          const first = res.data[0]?.code ?? "";
          setSelected(first);
          if (first) {
            const courseRes = await getCurriculumCategoryCourses(first);
            if (courseRes.success && courseRes.data) {
              setCourses(courseRes.data);
            }
          }
        } else {
          setError(res.error || "Failed to fetch curriculum");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchCurriculum();
  }, []);

  const onCategoryChange = async (code: string) => {
    setSelected(code);
    const res = await getCurriculumCategoryCourses(code);
    if (res.success && res.data) {
      setCourses(res.data);
      setError(null);
    } else {
      setError(res.error || "Failed to fetch curriculum courses");
    }
  };

  const activeCategory = useMemo(() => 
    categories.find(c => c.code === selected),
  [categories, selected]);

  const handleDownload = async (courseCode: string) => {
    setDownloading(courseCode);
    try {
      const res = await downloadCurriculumSyllabus(courseCode);
      if (res.success && res.data) {
        const { filename, data: b64, contentType } = res.data;
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloaded(courseCode);
        setTimeout(() => setDownloaded(null), 3000);
      }
    } catch (err) {
      console.error("Syllabus download failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading && categories.length === 0) return <Loader />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-6 lg:p-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-12">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
             <h1 className="text-4xl md:text-6xl font-black tracking-tightest text-foreground uppercase leading-none">
               Integrated Curriculum
             </h1>
           </div>
           <p className="text-sm text-muted-foreground font-bold opacity-30 tracking-widest pl-4 uppercase">
             Program Structure & Detailed Syllabus
           </p>
        </div>

        {/* Category Stats */}
        {activeCategory && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-12 gap-x-20 pt-4">
             <StatItem 
               label="Current Track" 
               value={activeCategory.code} 
               subValue="Category Code"
               icon={Layers}
             />
             <StatItem 
               label="Track Credits" 
               value={activeCategory.credits} 
               subValue={`/ ${activeCategory.maxCredits}`}
               icon={ScrollText}
             />
             <StatItem 
               label="Course Count" 
               value={courses.length} 
               subValue="Units Available"
               icon={BookOpen}
             />
          </div>
        )}
      </header>

      {/* Category Selector Area */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-8">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary/40 rounded-full" />
                <h2 className="text-3xl font-black text-foreground tracking-tightest uppercase leading-none">
                  {activeCategory?.name || "Select Category"}
                </h2>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-30 tracking-widest pl-4">
                Refine by Program Domain
              </p>
           </div>
          
           <div className="w-full md:w-80">
             <Select value={selected} onValueChange={onCategoryChange}>
               <SelectTrigger className="h-14 rounded-2xl border-2 border-border/50 bg-muted/10 text-[10px] font-black uppercase tracking-[0.2em] focus:ring-0 focus:border-primary/50 outline-none transition-all">
                 <SelectValue placeholder="Domain" />
               </SelectTrigger>
               <SelectContent className="rounded-2xl border-border bg-card/95 backdrop-blur-xl">
                 {categories.map((cat) => (
                   <SelectItem 
                     key={cat.code} 
                     value={cat.code} 
                     className="text-[10px] font-black uppercase tracking-widest py-3 focus:bg-primary focus:text-primary-foreground rounded-lg"
                   >
                     {cat.code} — {cat.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
        </div>

        {/* Course List */}
        <div className="flex flex-col min-h-[400px]">
           <AnimatePresence mode="popLayout">
             {courses.map((course, index) => (
               <CurriculumCourseItem
                 key={`${course.code}-${index}`}
                 course={course}
                 index={index}
                 onDownload={handleDownload}
                 downloading={downloading}
                 downloaded={downloaded}
               />
             ))}
           </AnimatePresence>

           {courses.length === 0 && !loading && (
             <div className="py-32 text-center opacity-20">
                <FileText className="w-16 h-16 mx-auto mb-6" />
                <p className="text-[10px] font-black uppercase tracking-tightest">No documentation available for this domain</p>
             </div>
           )}
        </div>
      </section>

      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/[0.03] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-primary/[0.02] blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10" />
    </div>
  );
}
