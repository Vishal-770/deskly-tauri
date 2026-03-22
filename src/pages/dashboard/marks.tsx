import { useEffect, useState, useMemo } from "react";
import { useSemester } from "@/hooks/useSemester";
import { getMarks, type StudentMarkEntry, type AssessmentMark } from "@/lib/features";
import { BookOpen, User, Calendar, TrendingUp, Award, BarChart4 } from "lucide-react";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { StatItem } from "@/components/stat-item";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* -------------------- Helper Components -------------------- */


function AssessmentItem({ assessment, index }: { assessment: AssessmentMark; index: number }) {
  const percentage = (assessment.scoredMark / assessment.maxMark) * 100;
  
  // Use semantic colors instead of hardcoded ones
  const isExcellent = percentage >= 85;
  const isAverage = percentage >= 60;
  
  const statusColor = isExcellent 
    ? "text-primary" 
    : isAverage 
      ? "text-foreground/60" 
      : "text-destructive";

  const progressColor = isExcellent 
    ? "bg-primary" 
    : isAverage 
      ? "bg-foreground/40" 
      : "bg-destructive/60";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group py-8 border-b border-border/50 hover:bg-muted/5 transition-colors px-2 rounded-2xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 mb-1">
             Assessment Detail
          </p>
          <h4 className="text-xl font-black tracking-tightest text-foreground group-hover:text-primary transition-colors">
            {assessment.markTitle}
          </h4>
        </div>

        <div className="flex items-center gap-12 shrink-0">
          <div className="text-right">
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Raw Score</p>
             <p className="text-lg font-black tracking-tightest text-foreground font-mono">
               {assessment.scoredMark} <span className="opacity-20">/ {assessment.maxMark}</span>
             </p>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Weighted</p>
             <p className={cn("text-lg font-black tracking-tightest font-mono", statusColor)}>
               {assessment.weightageMark.toFixed(1)} <span className="opacity-20">/ {assessment.weightagePercent}</span>
             </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${percentage}%` }}
             transition={{ duration: 1, delay: 0.2 + index * 0.05, ease: "easeOut" }}
             className={cn("h-full rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]", progressColor)}
           />
        </div>
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             {assessment.classAverage && (
               <div className="flex items-center gap-1.5 opacity-30">
                 <TrendingUp className="w-3 h-3" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Avg: {assessment.classAverage}</span>
               </div>
             )}
             <div className="flex items-center gap-1.5 opacity-30">
                <BarChart4 className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Weight: {assessment.weightagePercent}%</span>
             </div>
           </div>
           
           {assessment.remark && assessment.remark !== "-" && (
              <p className="text-[9px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest italic">
                "{assessment.remark}"
              </p>
           )}
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------- Page -------------------- */

export default function MarksPage() {
  const { currentSemester, loading: semesterLoading } = useSemester();
  const [marksData, setMarksData] = useState<StudentMarkEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarks = async () => {
      if (!currentSemester?.id) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getMarks(currentSemester.id);
        if (result.success && result.data) {
          setMarksData(result.data);
          setActiveCourse(result.data[0]?.courseCode ?? null);
        } else {
          setError(result.error || "Failed to fetch marks");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (currentSemester) void fetchMarks();
  }, [currentSemester, semesterLoading]);

  const activeCourseData = useMemo(() => 
    marksData?.find((c) => c.courseCode === activeCourse),
  [marksData, activeCourse]);

  const totalWeighted = useMemo(() => {
    if (!activeCourseData) return { scored: 0, total: 0 };
    return {
      scored: activeCourseData.assessments.reduce((s, a) => s + a.weightageMark, 0),
      total: activeCourseData.assessments.reduce((s, a) => s + a.weightagePercent, 0)
    };
  }, [activeCourseData]);

  if (semesterLoading || (loading && !marksData)) return <Loader />;
  if (error) return <ErrorDisplay title="Marks Feed Error" message={error} onRetry={() => window.location.reload()} />;

  if (!marksData || marksData.length === 0) {
    return (
      <div className="h-[80vh] w-full flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-muted/20 rounded-[32px] flex items-center justify-center mb-8 border border-border/50">
          <BookOpen className="w-8 h-8 text-muted-foreground opacity-20" />
        </div>
        <p className="text-2xl font-black text-foreground tracking-tightest uppercase">No Progress Records</p>
        <p className="text-xs text-muted-foreground opacity-30 font-black uppercase tracking-widest mt-2">Check back after your first assessment</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-7xl mx-auto overflow-hidden">
      {/* Header */}
      <header className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
              <h1 className="text-4xl md:text-6xl font-black tracking-tightest text-foreground uppercase leading-none">
                Marks Overview
              </h1>
            </div>
            <p className="text-sm text-muted-foreground font-bold opacity-30 tracking-widest pl-4 uppercase">
               Internal Assessment Tracker — {currentSemester?.name}
            </p>
          </div>
        </div>

        {/* Course Selector - Premium Horizontal Scroll */}
        <div className="relative group">
           <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
             {marksData.map((course) => {
               const isActive = activeCourse === course.courseCode;
               return (
                 <button
                   key={course.courseCode}
                   onClick={() => setActiveCourse(course.courseCode)}
                   className={cn(
                     "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2",
                     isActive
                       ? "bg-primary border-primary text-primary-foreground shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)]"
                       : "bg-muted/10 border-border/50 text-muted-foreground hover:bg-muted/20 hover:border-border"
                   )}
                 >
                   {course.courseCode}
                 </button>
               );
             })}
           </div>
        </div>

        {/* Hero Stats for Selected Course */}
        <AnimatePresence mode="wait">
          {activeCourseData && (
            <motion.div
              key={activeCourseData.courseCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-y-12 gap-x-20 pt-4"
            >
              <StatItem 
                label="Weightage Scored" 
                value={totalWeighted.scored.toFixed(1)} 
                subValue={`/ ${totalWeighted.total}`}
                icon={Award}
              />
              <StatItem 
                label="Slot" 
                value={activeCourseData.slot} 
                subValue=""
              
              />
           
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeCourseData && (
          <motion.section
            key={activeCourseData.courseCode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-16"
          >
            {/* Course Identity */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-8">
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary/40 rounded-full" />
                    <h2 className="text-3xl font-black text-foreground tracking-tightest uppercase leading-none">
                      {activeCourseData.courseTitle}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 opacity-30 pl-4">
                     <div className="flex items-center gap-2">
                       <User className="w-3 h-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{activeCourseData.faculty}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Calendar className="w-3 h-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{activeCourseData.slot}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Assessment List */}
            <div className="space-y-2">
               {activeCourseData.assessments.length > 0 ? (
                 activeCourseData.assessments.map((assessment, index) => (
                   <AssessmentItem 
                     key={`${activeCourseData.courseCode}-${index}`} 
                     assessment={assessment} 
                     index={index} 
                   />
                 ))
               ) : (
                 <div className="py-20 text-center opacity-20">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No assessment data released</p>
                 </div>
               )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10" />
    </div>
  );
}
