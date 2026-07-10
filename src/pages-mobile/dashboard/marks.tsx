import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMarks, StudentMarkEntry } from "@/lib/features";
import { Separator } from "@/components/ui/separator";

import { ErrorDisplay } from "@/components/error-display";
import { Target, BookOpen } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────



function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MarksSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4">
      <div className="space-y-1">
        <Sk className="h-7 w-36" />
        <Sk className="h-3 w-52" />
      </div>
      <div className="relative">
        <Sk className="h-10 w-full rounded-xl" />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[...Array(4)].map((_, i) => (
          <Sk key={i} className="h-14 w-28 rounded-xl shrink-0" />
        ))}
      </div>
      <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Sk className="h-5 w-32" />
          <Sk className="h-4 w-48" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-t border-border/10">
            <Sk className="h-3 w-4" />
            <Sk className="h-4 flex-1" />
            <Sk className="h-4 w-16" />
            <Sk className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function MarksPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();

  const [data, setData] = useState<StudentMarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::marks");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setData(parsed);
          setLoading(false);
          setSelectedCourseCode(parsed[0].courseCode);
        }
      } catch (e) {
        console.error("Failed to parse cached marks", e);
      }
    }
  }, []);

  async function load() {
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;
      setLoading(data.length > 0 ? false : true);
      const res = await getMarks();
      if (res.success && res.data) {
        setData(res.data);
        localStorage.setItem("deskly::cache::marks", JSON.stringify(res.data));
        if (res.data.length > 0) setSelectedCourseCode(res.data[0].courseCode);
      } else {
        setError(res.error ?? "Failed to fetch marks view.");
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

  const filteredCourses = useMemo(() => data, [data]);

  const activeCourse = useMemo(() => {
    if (filteredCourses.length === 0) return null;
    const found = filteredCourses.find((c) => c.courseCode === selectedCourseCode);
    return found || filteredCourses[0];
  }, [filteredCourses, selectedCourseCode]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = data.length === 0 && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={load} />);
  }

  if (authLoading || (loading && data.length === 0)) return shell(<MarksSkeleton />);

  if (error && data.length === 0) {
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
      <header className="flex items-start gap-2">
        <Target className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
            My Marks
          </h1>
        </div>
      </header>

      {/* ── Course Tabs (horizontal scrollable) ──────────────────────────────── */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-muted/15 dark:bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
          <Target className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No courses found</p>
          <p className="text-xs text-muted-foreground">Marks data is unavailable for this semester.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Scrollable chip tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
            {filteredCourses.map((course) => {
              const isActive = activeCourse?.courseCode === course.courseCode;
              return (
                <button
                  key={course.courseCode}
                  onClick={() => setSelectedCourseCode(course.courseCode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all duration-150 shrink-0
                    ${isActive
                      ? "bg-primary border-primary text-primary-foreground shadow shadow-primary/10"
                      : "bg-muted/25 border-border/10 text-muted-foreground hover:bg-muted/35"
                    }`}
                >
                  {course.courseCode}
                </button>
              );
            })}
          </div>

          {/* Active Course Content */}
          {activeCourse && (
            <div className="space-y-4">
              {/* Active Course Details Header */}
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
                    <span className="text-sm font-semibold text-primary uppercase tracking-wide leading-none">
                      {activeCourse.courseCode}
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono">{activeCourse.slot}</span>
                    <span>&bull;</span>
                    <span className="uppercase">{activeCourse.courseType}</span>
                  </div>
                  <h2 className="text-base font-semibold text-foreground leading-snug">
                    {activeCourse.courseTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground/60 leading-none">
                    {activeCourse.faculty} · {activeCourse.courseMode}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {activeCourse.assessments.length > 0 ? (
                    <>
                      <span className="text-2xl font-bold text-foreground leading-none">
                        {activeCourse.assessments.reduce((s, a) => s + a.weightageMark, 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground/50 font-medium ml-1">/ 100</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground/50 font-medium">No marks</span>
                  )}
                </div>
              </div>

              <Separator className="bg-border/25" />

              {/* Assessments list */}
              {activeCourse.assessments.length > 0 ? (
                <div className="divide-y divide-border/10 border-t border-b border-border/10">
                  {/* Table header */}
                  <div className="flex items-center gap-3 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 w-5 shrink-0">#</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 flex-1">Assessment</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 w-20 text-center">Score</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 w-16 text-center">Wtd.</span>
                  </div>
                  {activeCourse.assessments.map((ass, index) => {
                    return (
                      <div key={`${ass.slNo}-${index}`} className="flex items-center gap-3 py-3">
                        <span className="text-xs text-muted-foreground/30 tabular-nums w-5 shrink-0">
                          {ass.slNo ?? index + 1}
                        </span>
                        <span className="flex-1 text-sm font-medium text-foreground leading-snug min-w-0 truncate">
                          {ass.markTitle}
                        </span>
                        <div className="w-20 text-center shrink-0">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {ass.scoredMark}
                          </span>
                          <span className="text-xs text-muted-foreground/30 mx-0.5">/</span>
                          <span className="text-xs text-muted-foreground/60">{ass.maxMark}</span>
                        </div>
                        <div className="w-16 text-center shrink-0">
                          <span className="text-sm font-semibold text-primary tabular-nums">
                            {ass.weightageMark}
                          </span>
                          <span className="text-xs text-muted-foreground/30 mx-0.5">/</span>
                          <span className="text-xs text-muted-foreground/60">{ass.weightagePercent}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-xs font-medium text-muted-foreground">No assessments graded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
