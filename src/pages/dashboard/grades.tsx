import { useEffect, useState } from "react";
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
} from "recharts";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGradesHistory, type StudentHistoryData } from "@/lib/features";

/* -------------------- Helper Components -------------------- */

const GradeBadge = ({ grade }: { grade: string }) => {
  const colors: Record<string, string> = {
    S: "text-[oklch(0.75_0.15_200)]",
    A: "text-[oklch(0.8_0.15_145)]",
    B: "text-[oklch(0.85_0.12_85)]",
    C: "text-[oklch(0.8_0.15_60)]",
    D: "text-[oklch(0.75_0.2_30)]",
    F: "text-[oklch(0.65_0.2_25)]",
  };
  return (
    <span
      className={`font-bold text-base ${colors[grade] || "text-muted-foreground"}`}
    >
      {grade}
    </span>
  );
};

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Fetching academic performance...</p>
      </div>
    );
  }

  if (error || !gradeData) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-destructive/10 rounded-full text-destructive mb-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Failed to Load Grades</h2>
        <p className="text-muted-foreground max-w-md">{error || "No data available"}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  /* Chart Data */
  const dist = gradeData.cgpa.gradeDistribution;
  const gradeDistributionData = [
    { grade: "S", count: dist.s },
    { grade: "A", count: dist.a },
    { grade: "B", count: dist.b },
    { grade: "C", count: dist.c },
    { grade: "D", count: dist.d },
    { grade: "E", count: dist.e },
    { grade: "F", count: dist.f },
  ].filter(d => d.count > 0);

  const creditsBarData = gradeData.curriculum.details.map((d) => ({
    category: d.category.replace(" Credits", ""),
    earned: d.creditsEarned,
    required: d.creditsRequired,
  }));

  const completionPct = Math.round(
    (gradeData.curriculum.summary.totalEarned /
      gradeData.curriculum.summary.totalRequired) *
      100,
  );

  const filteredGrades = gradeData.grades.filter((g) => {
    const matchSearch =
      g.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterType === "all" ||
      g.courseType.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchFilter;
  });

  const courseTypes = [
    "all",
    ...Array.from(new Set(gradeData.grades.map((g) => g.courseType))),
  ];

  const CHART_COLORS = [
    "oklch(0.7 0.15 200)",
    "oklch(0.75 0.15 145)",
    "oklch(0.8 0.12 85)",
    "oklch(0.75 0.15 60)",
    "oklch(0.7 0.2 30)",
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Academic Performance</h1>
        <p className="text-muted-foreground">
          Detailed grade & curriculum analysis for {gradeData.profile.regNo}
        </p>
      </header>

      {/* Hero Stats */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-8">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl sm:text-7xl font-bold text-primary tracking-tighter">
            {gradeData.cgpa.cgpa.toFixed(2)}
          </span>
          <span className="text-xl text-muted-foreground font-medium uppercase tracking-wider">
            CGPA
          </span>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-8 sm:gap-12 text-sm">
          <div>
            <p className="text-muted-foreground mb-1 uppercase text-xs font-semibold tracking-widest">Credits</p>
            <span className="text-2xl font-bold text-foreground">
              {gradeData.cgpa.creditsEarned}
            </span>
            <span className="text-muted-foreground ml-1.5 font-medium">
              / {gradeData.cgpa.creditsRegistered}
            </span>
          </div>
          <div>
             <p className="text-muted-foreground mb-1 uppercase text-xs font-semibold tracking-widest">Progress</p>
            <span className="text-2xl font-bold text-foreground">
              {completionPct}%
            </span>
            <span className="text-muted-foreground ml-1.5 font-medium">complete</span>
          </div>
          <div className="hidden lg:block">
             <p className="text-muted-foreground mb-1 uppercase text-xs font-semibold tracking-widest">Courses</p>
            <span className="text-2xl font-bold text-foreground">
              {gradeData.grades.length}
            </span>
            <span className="text-muted-foreground ml-1.5 font-medium">completed</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Charts */}
        <div className="space-y-10">
          {/* Grade Distribution */}
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
              Grade Distribution
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    strokeWidth={0}
                    paddingAngle={4}
                  >
                    {gradeDistributionData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
              {gradeDistributionData.map((d, i) => (
                <div key={d.grade} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {d.grade}: {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Credits by Category */}
          <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
              Credits by Category
            </h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditsBarData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="var(--border)"
                    vertical={false}
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="earned"
                    name="Earned"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="required"
                    name="Required"
                    fill="var(--muted)"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Curriculum Progress */}
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
            Curriculum Progress
          </h3>
          <div className="space-y-6 flex-1">
            {gradeData.curriculum.details.map((d) => {
              const pct = Math.round(
                (d.creditsEarned / d.creditsRequired) * 100,
              );
              return (
                <div key={d.category} className="space-y-2">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-muted-foreground font-medium">{d.category}</span>
                    <span className="text-foreground font-bold">
                      {d.creditsEarned} <span className="text-muted-foreground font-normal">/ {d.creditsRequired}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 pt-6 border-t border-border/50 flex justify-between items-baseline">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">Total Credits</span>
            <div className="text-right">
                <span className="text-3xl font-black text-foreground">
                {gradeData.curriculum.summary.totalEarned}
                </span>
                <span className="text-muted-foreground ml-2 font-bold text-lg">
                / {gradeData.curriculum.summary.totalRequired}
                </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & List Section */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <h2 className="text-xl font-bold tracking-tight">Grade History</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 h-10 pl-10 pr-4 text-sm bg-secondary/50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="relative">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl border-none bg-secondary/50 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {courseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grade List */}
        <div className="grid grid-cols-1 gap-3">
          {filteredGrades.map((g, idx) => (
            <div
              key={g.slNo}
              className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 px-5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:bg-secondary/20 transition-all group"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <span className="w-6 text-xs font-bold text-muted-foreground/40 tabular-nums">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <div className="flex flex-col min-w-0">
                    <span className="font-mono text-xs font-bold text-primary tracking-tight mb-0.5">
                        {g.courseCode}
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate">
                        {g.courseTitle}
                    </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10">
                <div className="flex flex-col items-end sm:items-start sm:w-24">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:hidden">Type</span>
                   <span className="text-xs font-medium text-muted-foreground">
                        {g.courseType}
                    </span>
                </div>
                
                <div className="flex flex-col items-center sm:w-16">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:hidden">Credits</span>
                    <span className="text-xs font-bold text-foreground bg-secondary px-2.5 py-1 rounded-lg">
                        {g.credits}
                    </span>
                </div>

                <div className="flex flex-col items-center sm:w-12">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:hidden">Grade</span>
                   <GradeBadge grade={g.grade} />
                </div>

                <div className="flex flex-col items-end sm:w-32">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:hidden">Period</span>
                    <span className="text-xs font-medium text-muted-foreground text-right tabular-nums">
                        {g.examMonth}
                    </span>
                </div>
              </div>
            </div>
          ))}

          {filteredGrades.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 opacity-60">
              <div className="p-4 bg-secondary rounded-full">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">No courses matching your filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
