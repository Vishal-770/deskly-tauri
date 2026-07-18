import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMarks, StudentMarkEntry } from "@/lib/features";
import marksImg from "@/assets/marks.png";
import { Target, BookOpen } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { ErrorDisplay } from "@/components/error-display";
import { isNetworkError } from "@/lib/utils";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/65 ${className}`} />;
}

function MarksSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira">
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
      <div className="p-5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md space-y-4">
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

export default function MarksPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const location = useLocation();

  const [data, setData] = useState<StudentMarkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");

  useEffect(() => {
    if (data.length > 0) {
      if (location.state?.courseCode) {
        const match = data.find(
          (c) => c.courseCode.toLowerCase() === location.state.courseCode.toLowerCase()
        );
        if (match) {
          setSelectedCourseCode(match.courseCode);
          return;
        }
      }
      if (!selectedCourseCode) {
        setSelectedCourseCode(data[0].courseCode);
      }
    }
  }, [data, location.state]);

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::marks");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setData(parsed);
          setLoading(false);
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
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira select-none overscroll-y-contain relative">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Illustration — absolute top right */}
      <div className="absolute -top-4 right-0 w-[200px] h-[160px] pointer-events-none select-none z-0">
        <img
          src={marksImg}
          className="w-full h-full object-contain opacity-95 dark:opacity-75"
          style={{
            maskImage: "radial-gradient(ellipse at 30% 40%, #fff 30%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.2) 80%, transparent 95%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 40%, #fff 30%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.2) 80%, transparent 95%)"
          }}
          alt="Marks Illustration"
        />
      </div>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-[20px]">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 flex items-center gap-2">
        <Target className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">My Marks</h1>
      </header>

      {filteredCourses.length === 0 ? (
        <div className="relative z-10 flex flex-col items-center justify-center py-16 gap-3 text-center bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md">
          <Target className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No courses found</p>
          <p className="text-xs text-muted-foreground">Marks data is unavailable for this semester.</p>
        </div>
      ) : (
        <>
          {/* ── Stats Card ──────────────────────────────────────────────────────── */}
          {activeCourse && (
            <div className="relative z-10 p-5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between gap-3">
                {/* Course Info */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide leading-none">{activeCourse.courseCode}</span>
                    <span>&bull;</span>
                    <span className="font-mono">{activeCourse.slot}</span>
                    <span>&bull;</span>
                    <span className="uppercase">{activeCourse.courseType}</span>
                  </div>
                  <h2 className="text-base font-bold text-foreground leading-snug">{activeCourse.courseTitle}</h2>
                  <p className="text-[10px] text-muted-foreground/50 font-mono leading-none pt-0.5">{activeCourse.faculty}</p>
                </div>

                {/* Total Score Box */}
                {activeCourse.assessments.length > 0 && (
                  <div className="shrink-0 bg-muted/20 border border-border/20 rounded-[18px] px-3.5 py-2 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none mb-1">Total</span>
                    <div className="flex items-baseline gap-0.5 leading-none">
                      <span className="text-xl font-black text-foreground tabular-nums">
                        {activeCourse.assessments.reduce((s, a) => s + a.weightageMark, 0).toFixed(1)}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground/45">/100</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider bg-muted/20 border border-border/20 rounded-full px-2.5 py-0.5">
                  {activeCourse.courseMode}
                </span>
              </div>
            </div>
          )}

          {/* ── Course Tabs ──────────────────────────────────────────────────────── */}
          <div className="relative z-10 flex gap-2 overflow-x-auto no-scrollbar -mx-2 px-2 pb-0.5">
            {filteredCourses.map((course) => {
              const isActive = activeCourse?.courseCode === course.courseCode;
              return (
                <button
                  key={course.courseCode}
                  onClick={() => setSelectedCourseCode(course.courseCode)}
                  className={`px-4 py-2 rounded-[16px] text-xs font-bold uppercase tracking-wider cursor-pointer border transition-all duration-200 shrink-0
                    ${isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-card/80 border-border/40 text-muted-foreground hover:bg-muted/10 backdrop-blur-md"
                    }`}
                >
                  {course.courseCode}
                </button>
              );
            })}
          </div>

          {/* ── Assessment Cards ─────────────────────────────────────────────────── */}
          {activeCourse && (
            <div className="relative z-10 flex flex-col gap-3">
              {activeCourse.assessments.length > 0 ? (
                activeCourse.assessments.map((ass, index) => (
                  <div
                    key={`${ass.slNo}-${index}`}
                    className="p-4.5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md flex items-center justify-between gap-4"
                  >
                    {/* Index badge */}
                    <span className="text-xs font-semibold text-muted-foreground/30 tabular-nums w-5 shrink-0">
                      {ass.slNo ?? index + 1}
                    </span>

                    {/* Assessment title + subtitle */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide leading-none">
                          Assessment
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug truncate">{ass.markTitle}</p>
                    </div>

                    {/* Score columns */}
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-widest leading-none block mb-1">Score</span>
                        <span className="text-sm font-bold text-foreground tabular-nums leading-none">
                          {ass.scoredMark} <span className="text-xs font-normal text-muted-foreground/40">/ {ass.maxMark}</span>
                        </span>
                      </div>
                      <div className="w-px h-6 bg-border/20 shrink-0" />
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-widest leading-none block mb-1">Weighted</span>
                        <span className="text-sm font-bold text-primary tabular-nums leading-none">
                          {ass.weightageMark} <span className="text-xs font-normal text-muted-foreground/40">/ {ass.weightagePercent}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-14 gap-3 text-center bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md">
                  <BookOpen className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-sm font-semibold text-muted-foreground">No assessments graded yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
