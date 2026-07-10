import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getGradesHistory, StudentHistoryData } from "@/lib/features";
import { Separator } from "@/components/ui/separator";

import { ErrorDisplay } from "@/components/error-display";
import { Input } from "@/components/ui/input";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import { DrawerSelect } from "@/components/ui/drawer-select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  GraduationCap,
  Search,
  FileText,
  Hash,
  Monitor,
  CalendarDays,
  Award,
  ChevronRight,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function GradeDetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: StudentHistoryData["grades"][number] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  const details = [
    { icon: Hash,          label: "Course Code",  value: item.courseCode },
    { icon: GraduationCap, label: "Course Type",  value: item.courseType },
    { icon: Monitor,       label: "Credits",      value: `${item.credits} Credits` },
    { icon: CalendarDays,  label: "Exam Session", value: item.examMonth || "—" },
    { icon: Award,         label: "Grade Earned", value: item.grade },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8 font-saira max-h-[92vh]">
        <div className="overflow-y-auto no-scrollbar px-6 space-y-7 pt-5">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-sm font-medium tracking-wide text-primary uppercase">
                  {item.courseCode}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  (Grade {item.grade})
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground leading-snug tracking-tight">
                {item.courseTitle}
              </h2>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-muted/65 flex items-center justify-center text-foreground hover:bg-muted active:opacity-75 transition-colors border-none cursor-pointer shrink-0"
            >
              <span className="text-lg leading-none font-sans">×</span>
            </button>
          </div>

          <Separator className="bg-border/25" />

          {/* Grade Details List */}
          <div className="space-y-3 pt-1">
            <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground/60 uppercase leading-none">
              Grade Details
            </p>

            <div className="divide-y divide-border/10">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3">
                  {/* Left Column: Icon Box */}
                  <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                  </div>
                  
                  {/* Right Column: Text contents */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold leading-none mb-1">{label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

function gradeTextColor(grade: string) {
  const g = grade.trim().toUpperCase();
  if (g === "S" || g === "A") return "text-emerald-500";
  if (g === "B" || g === "C" || g === "D" || g === "P") return "text-primary";
  if (g === "E" || g === "F") return "text-destructive";
  return "text-muted-foreground";
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function GradesSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4">
      <div className="space-y-1">
        <Sk className="h-7 w-40" />
        <Sk className="h-3 w-52" />
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
        <Sk className="h-9 w-full rounded-xl" />
        <Sk className="h-9 w-full rounded-xl" />
      </div>
      <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Sk className="h-4 w-16" />
            <Sk className="h-4 flex-1" />
            <Sk className="h-5 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function GradesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();

  const [data, setData] = useState<StudentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedGrade, setSelectedGrade] = useState<StudentHistoryData["grades"][number] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("ALL");

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::grades");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StudentHistoryData;
        if (parsed && parsed.grades && parsed.grades.length > 0) {
          setData(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached grades", e);
      }
    }
  }, []);

  async function load() {
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;
      setLoading(data && data.grades && data.grades.length > 0 ? false : true);
      const res = await getGradesHistory();
      if (res.success && res.data) {
        setData(res.data);
        localStorage.setItem("deskly::cache::grades", JSON.stringify(res.data));
      } else {
        setError(res.error ?? "Failed to fetch grade history.");
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

  const totalSubjects = useMemo(() => data?.grades?.length ?? 0, [data]);
  const totalCredits = useMemo(() => data?.cgpa?.creditsEarned ?? 0, [data]);
  const cgpaVal = useMemo(() => data?.cgpa?.cgpa ?? 0, [data]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, P: 0, N: 0 };
    if (data?.grades) {
      data.grades.forEach((g) => {
        const cg = g.grade.trim().toUpperCase();
        counts[cg] = (counts[cg] || 0) + 1;
      });
    }
    return counts;
  }, [data]);

  const filteredGrades = useMemo(() => {
    if (!data?.grades) return [];
    return data.grades.filter((g) => {
      const matchesSearch =
        g.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade =
        selectedGradeFilter === "ALL" || g.grade.trim().toUpperCase() === selectedGradeFilter;
      return matchesSearch && matchesGrade;
    });
  }, [data, searchQuery, selectedGradeFilter]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = !data && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={load} />);
  }

  if (authLoading || (loading && !data)) return shell(<GradesSkeleton />);

  if (error && !data) {
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
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary shrink-0" />
            <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none truncate">
              My Grades
            </h1>
          </div>
        </div>
      </header>

      <Separator className="bg-border/25" />

      {/* ── Stats block ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-1 text-center">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-2">Subjects</p>
          <p className="text-2xl font-bold text-foreground leading-none">{totalSubjects}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/25 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-2">Credits</p>
          <p className="text-2xl font-bold text-foreground leading-none">{totalCredits}</p>
        </div>
        <Separator orientation="vertical" className="h-8 bg-border/25 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-2">CGPA</p>
          <p className="text-2xl font-bold text-foreground leading-none">{cgpaVal}</p>
        </div>
      </div>

      <Separator className="bg-border/25" />

      {/* ── Search & Filter ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-muted/20 border-border/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
        <DrawerSelect
          value={selectedGradeFilter}
          onValueChange={setSelectedGradeFilter}
          title="Filter by Grade"
          triggerClassName="w-full h-10"
          options={[
            { value: "ALL", label: "All Grades" },
            ...["S", "A", "B", "C", "D", "E", "F", "P", "N"].map((g) => ({ value: g, label: `Grade ${g}` })),
          ]}
        />
      </div>

      {/* ── Section Label ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground tracking-tight leading-none uppercase">
          Grade History
        </h2>
        <p className="text-xs text-muted-foreground/75 leading-none">
          {filteredGrades.length} of {data?.grades?.length ?? 0} courses
        </p>
      </div>

      {/* ── Grades List ──────────────────────────────────────────────────────── */}
      {filteredGrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-muted/15 dark:bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No grades found</p>
          <p className="text-xs text-muted-foreground">Try modifying your search or filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {filteredGrades.map((item, idx) => (
            <div
              key={`${item.courseCode}-${idx}`}
              onClick={() => {
                setSelectedGrade(item);
                setDrawerOpen(true);
              }}
              className="flex items-center justify-between gap-4 py-4 hover:bg-muted/5 active:opacity-75 transition-all cursor-pointer"
            >
              <div className="flex-1 min-w-0 flex items-center gap-4">
                {/* Serial */}
                <span className="text-xs font-semibold text-muted-foreground/30 tabular-nums w-5 shrink-0">
                  {item.slNo ?? idx + 1}
                </span>

                {/* Code + Title */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide leading-none">
                      {item.courseCode}
                    </span>
                    <span>&bull;</span>
                    <span className="uppercase">{item.courseType.trim()}</span>
                    <span>&bull;</span>
                    <span>{item.credits} Credits</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug truncate">
                    {item.courseTitle}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 font-mono leading-none pt-0.5">
                    Exam Session: {item.examMonth}
                  </p>
                </div>

                {/* Grade text (large letter grade) */}
                <span className={`text-xl font-bold tracking-tight shrink-0 w-8 text-center leading-none ${gradeTextColor(item.grade)}`}>
                  {item.grade.trim().toUpperCase()}
                </span>
              </div>

              {/* Chevron indicator */}
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* ── Grade Distribution Footer ─────────────────────────────────────────── */}
      {data?.cgpa?.gradeDistribution && (
        <div className="space-y-4 pt-4 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
              Grade Distribution
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "S", textColor: "text-emerald-500" },
              { label: "A", textColor: "text-emerald-500" },
              { label: "B", textColor: "text-primary" },
              { label: "C", textColor: "text-primary" },
              { label: "D", textColor: "text-primary" },
              { label: "E", textColor: "text-destructive" },
              { label: "F", textColor: "text-destructive" },
              { label: "P", textColor: "text-primary" },
              { label: "N", textColor: "text-muted-foreground" },
            ].map(({ label, textColor }) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/20 border border-border/5 rounded-md text-xs font-semibold leading-none">
                <span className={textColor}>{label}</span>
                <span className="text-muted-foreground/25 font-normal">&bull;</span>
                <span className="text-foreground">{gradeCounts[label] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <GradeDetailDrawer
        item={selectedGrade}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
