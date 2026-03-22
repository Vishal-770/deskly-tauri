import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Search, Trophy, ScrollText, BarChart3, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { getGradesHistory, type StudentHistoryData, type CourseGrade } from "../../lib/features";
import { StatItem } from "../../components/stat-item";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../components/Loader";
import { ErrorDisplay } from "../../components/error-display";

/* -------------------- Helper Components -------------------- */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/90 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-tight max-w-[200px]">
          {label || payload[0].name}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-black tracking-tightest text-foreground">
            {payload[0].value}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest">
            {payload[0].unit || "Credits"}
          </p>
        </div>
      </div>
    );
  }
  return null;
};


const GradeBadge = ({ grade }: { grade: string }) => {
  const colors: Record<string, string> = {
    S: "text-primary",
    A: "text-primary/100", 
    B: "text-foreground/80",
    C: "text-muted-foreground",
    D: "text-muted-foreground/60",
    F: "text-destructive",
  };
  return (
    <span className={`text-xl font-black tracking-tighter ${colors[grade] || "text-muted-foreground"}`}>
      {grade}
    </span>
  );
};

function GradeItem({ grade, index }: { grade: CourseGrade; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group flex flex-col gap-4 py-6 border-b border-border/50 hover:bg-muted/5 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {grade.courseCode}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {grade.courseType}
            </span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
            {grade.courseTitle}
          </h3>
        </div>

        <div className="flex items-center gap-12 shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Credits</p>
            <p className="text-lg font-black tracking-tightest text-foreground font-mono">{grade.credits}</p>
          </div>
          <div className="text-center min-w-[40px]">
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Grade</p>
             <GradeBadge grade={grade.grade} />
          </div>
          <div className="text-right hidden sm:block w-32">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Period</p>
            <p className="text-[11px] font-bold text-muted-foreground/50 tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">{grade.examMonth}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------- Page -------------------- */

export default function GradesPage() {
  const [gradeData, setGradeData] = useState<StudentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const result = await getGradesHistory();
        if (result.success && result.data) {
          setGradeData(result.data);
        } else {
          setError(result.error || "Failed to fetch grades");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const stats = useMemo(() => {
    if (!gradeData) return null;
    const completionPct = Math.round(
      (gradeData.curriculum.summary.totalEarned /
        gradeData.curriculum.summary.totalRequired) *
        100,
    );
    return { completionPct };
  }, [gradeData]);

  const filteredGrades = useMemo(() => {
    if (!gradeData) return [];
    return gradeData.grades.filter((g) => {
      const matchSearch =
        g.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter =
        filterType === "all" ||
        g.courseType.toLowerCase() === filterType.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [gradeData, searchQuery, filterType]);

  const courseTypes = useMemo(() => {
    if (!gradeData) return ["all"];
    return ["all", ...Array.from(new Set(gradeData.grades.map((g) => g.courseType)))];
  }, [gradeData]);

  if (loading && !gradeData) return <Loader />;
  if (error || !gradeData) return <ErrorDisplay message={error || "No data available"} onRetry={() => window.location.reload()} />;

  /* Chart Data */
  const dist = gradeData.cgpa.gradeDistribution;
  const gradeDistributionData = [
    { name: "S", value: dist.s },
    { name: "A", value: dist.a },
    { name: "B", value: dist.b },
    { name: "C", value: dist.c },
    { name: "D", value: dist.d },
    { name: "E", value: dist.e },
    { name: "F", value: dist.f },
    { name: "N", value: dist.n },
  ].filter(d => d.value > 0);

  const creditsBarData = gradeData.curriculum.details.map((d) => ({
    name: d.category, // Use absolute full name
    earned: d.creditsEarned,
    required: d.creditsRequired,
  }));

  const CHART_PALETTE = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--primary)",
    "var(--foreground)",
  ];

  return (
    <div className="p-6 lg:p-10 space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-12">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
             <h1 className="text-4xl md:text-6xl font-black tracking-tightest text-foreground uppercase leading-none">
               Grading & Curriculum
             </h1>
           </div>
           <p className="text-sm text-muted-foreground font-bold opacity-30 tracking-widest pl-4 uppercase">
             Comprehensive Analysis for {gradeData.profile.regNo} — {gradeData.profile.programme}
           </p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-12 gap-x-20">
           <StatItem 
             label="Current CGPA" 
             value={gradeData.cgpa.cgpa.toFixed(2)} 
             subValue="Over 10"
             icon={Trophy}
           />
           <StatItem 
             label="Credits Cleared" 
             value={gradeData.curriculum.summary.totalEarned} 
             subValue={`/ ${gradeData.curriculum.summary.totalRequired}`}
             icon={ScrollText}
           />
           <StatItem 
             label="Degree Completion" 
             value={`${stats?.completionPct}%`} 
             subValue="to Graduate"
             icon={BarChart3}
           />
        </div>
      </header>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-20">
        {/* Left Column: Grade Distribution */}
        <div className="space-y-10">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-primary opacity-50" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
              Performance Distribution
            </h3>
          </div>
          
          <div className="h-[320px] w-full group">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  strokeWidth={0}
                  paddingAngle={6}
                  animationBegin={200}
                  animationDuration={1500}
                  isAnimationActive={true}
                >
                  {gradeDistributionData.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 leading-none">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
             {gradeDistributionData.map((d) => (
               <div key={d.name} className="flex flex-col gap-1 border-l-2 border-border pl-4">
                 <p className="text-[9px] font-black uppercase text-muted-foreground/40">{d.name} Grades</p>
                 <p className="text-2xl font-black text-foreground">{d.value}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Right Column: Credits by Category (Horizontal Layout) */}
        <div className="space-y-10">
          <div className="flex items-center gap-3 mb-6">
            <ScrollText className="w-5 h-5 text-primary opacity-50" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
              Full Curriculum Credits
            </h3>
          </div>
          
          <div className="h-full min-h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={creditsBarData} 
                layout="vertical"
                margin={{ left: 0, right: 30 }}
                barGap={8}
              >
                <CartesianGrid
                  strokeDasharray="12 12"
                  stroke="var(--border)"
                  horizontal={true}
                  vertical={false}
                  opacity={0.1}
                />
                <XAxis 
                  type="number" 
                  hide 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 8, fill: "var(--muted-foreground)", fontWeight: "black", width: 220, textAnchor: 'start' }}
                  width={230}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  mirror={false}
                />
                <Tooltip 
                   content={<CustomTooltip />}
                   cursor={{ fill: "var(--primary)", opacity: 0.03 }}
                />
                <Bar
                  dataKey="earned"
                  name="Earned Credits"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                />
                <Bar
                  dataKey="required"
                  name="Required Credits"
                  fill="var(--muted-foreground)"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  opacity={0.1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Grade History Section */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-8">
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-primary/40 rounded-full" />
               <h2 className="text-3xl font-black text-foreground tracking-tightest uppercase leading-none">Grade Archives</h2>
             </div>
             <p className="text-xs font-bold text-muted-foreground opacity-30 tracking-widest uppercase pl-4">Chronological session history</p>
           </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Course Code or Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-border/50 bg-muted/10 pl-12 pr-4 text-xs font-black placeholder:text-muted-foreground/20 focus:ring-0 focus:border-primary/50 outline-none transition-all uppercase tracking-widest"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-12 w-[160px] rounded-2xl border border-border/50 bg-muted/10 text-[10px] font-black uppercase tracking-widest focus:ring-0 focus:border-primary/50 outline-none">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                {courseTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-[10px] font-black uppercase tracking-widest">
                    {type === "all" ? "All Domains" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredGrades.map((g, index) => (
              <GradeItem key={g.slNo} grade={g} index={index} />
            ))}
          </AnimatePresence>

          {filteredGrades.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-border/50">
                <Search className="h-8 w-8 text-muted-foreground/10" />
              </div>
              <p className="text-2xl font-black text-foreground/40 tracking-tightest uppercase">No Archives Found</p>
              <p className="text-xs text-muted-foreground/30 font-black uppercase tracking-widest mt-2">Try reflowing your search query</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Curriculum Summary Bottom */}
      <section className="pt-20">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-20 p-12 bg-muted/20 border border-border/50 rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] -rotate-12 translate-x-1/4 -translate-y-1/4 group-hover:rotate-0 transition-transform duration-1000">
               <BarChart3 className="w-96 h-96" />
            </div>
            
            <div className="space-y-6 relative z-10">
               <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Curriculum Health</h4>
               <p className="text-4xl font-black text-foreground tracking-tightest leading-[1.1]">
                 You've cleared <span className="text-primary">{gradeData.curriculum.summary.totalEarned}</span> out of <span className="opacity-40">{gradeData.curriculum.summary.totalRequired}</span> required credits.
               </p>
               <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60">
                 <Info className="w-4 h-4" />
                 <span>Verified data based on official university history</span>
               </div>
            </div>

            <div className="flex items-end justify-center md:justify-end relative z-10">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">Current Semester Success</p>
                  <p className="text-8xl font-black tracking-tightest text-foreground leading-none">
                     {Math.round((gradeData.cgpa.creditsEarned / gradeData.cgpa.creditsRegistered) * 100)}%
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-primary mt-4">Passing Rate</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
