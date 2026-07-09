import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getGradesHistory, StudentHistoryData } from "@/lib/features";

import { ErrorDisplay } from "@/components/error-display";
import { Input } from "@/components/ui/input";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { DrawerSelect } from "@/components/ui/drawer-select";
import {
  GraduationCap,
  BookOpen,
  Bookmark,
  Award,
  Search,
  HelpCircle,
  FileText
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gradeColor(grade: string) {
  const g = grade.trim().toUpperCase();
  if (g === "S" || g === "A") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
  if (g === "B") return "text-amber-400 bg-amber-500/10 border-amber-500/15";
  if (g === "C" || g === "P") return "text-sky-400 bg-sky-500/10 border-sky-500/15";
  if (g === "D") return "text-orange-400 bg-orange-500/10 border-orange-500/15";
  if (g === "E" || g === "F") return "text-destructive bg-destructive/10 border-destructive/15";
  return "text-muted-foreground bg-muted/30 border-border/20";
}

function typeColor(type: string) {
  const t = type.trim().toUpperCase();
  if (t === "TH") return "text-sky-400 bg-sky-500/10 border-sky-500/15";
  if (t === "LO" || t === "LA") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
  if (t === "ETL") return "text-purple-400 bg-purple-500/10 border-purple-500/15";
  if (t === "PJT") return "text-amber-400 bg-amber-500/10 border-amber-500/15";
  return "text-muted-foreground bg-muted/30 border-border/20";
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

  if (!isOnline && !data) {
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
      {error && (
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
            <GraduationCap className="w-6 h-6 text-sky-500 shrink-0" />
            <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none truncate">
              My Grades
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">Your complete academic records</p>
        </div>
      </header>

      {/* ── Stats Card ──────────────────────────────────────────────────────── */}
      <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-border/10" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-border/10" />
        <div className="grid grid-cols-3">
          {[
            { icon: BookOpen, label: "Subjects", value: totalSubjects, color: "text-sky-400" },
            { icon: Bookmark, label: "Credits", value: totalCredits, color: "text-emerald-400" },
            { icon: Award, label: "CGPA", value: cgpaVal, color: "text-amber-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</span>
              </div>
              <span className="text-2xl font-medium text-foreground leading-none">{value}</span>
            </div>
          ))}
        </div>
      </div>

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
        <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
          {filteredGrades.map((item, idx) => (
            <div
              key={`${item.courseCode}-${idx}`}
              className="flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors duration-150"
            >
              {/* Serial */}
              <span className="text-xs font-semibold text-muted-foreground/30 tabular-nums w-5 shrink-0">
                {item.slNo ?? idx + 1}
              </span>

              {/* Code + Title */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-sky-500 uppercase tracking-wide leading-none">
                    {item.courseCode}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none ${typeColor(item.courseType)}`}>
                    {item.courseType.trim().toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground leading-snug truncate">
                  {item.courseTitle}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-mono leading-none">
                  {item.examMonth} · {item.credits} Cr
                </p>
              </div>

              {/* Grade badge */}
              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border leading-none shrink-0 ${gradeColor(item.grade)}`}>
                {item.grade.trim().toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Grade Distribution Footer ─────────────────────────────────────────── */}
      {data?.cgpa?.gradeDistribution && (
        <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
              Grade Distribution
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "S", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" },
              { label: "A", color: "text-emerald-400 bg-emerald-500/8 border-emerald-500/10" },
              { label: "B", color: "text-amber-400 bg-amber-500/10 border-amber-500/15" },
              { label: "C", color: "text-sky-400 bg-sky-500/10 border-sky-500/15" },
              { label: "D", color: "text-orange-400 bg-orange-500/10 border-orange-500/15" },
              { label: "E", color: "text-destructive bg-destructive/10 border-destructive/15" },
              { label: "F", color: "text-destructive bg-destructive/15 border-destructive/20" },
              { label: "P", color: "text-sky-400 bg-sky-500/8 border-sky-500/10" },
              { label: "N", color: "text-muted-foreground bg-muted/30 border-border/20" },
            ].map(({ label, color }) => (
              <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold leading-none ${color}`}>
                <span>{label}</span>
                <span className="opacity-30">|</span>
                <span>{gradeCounts[label] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
