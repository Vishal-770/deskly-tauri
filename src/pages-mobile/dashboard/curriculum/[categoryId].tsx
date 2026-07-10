import { useState, useEffect, useMemo } from "react";
import { useParams } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import {
  getCurriculumCategoryCourses,
  downloadCurriculumSyllabus,
  CurriculumCourse,
} from "@/lib/features";

import { ErrorDisplay } from "@/components/error-display";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import {
  BookOpen,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function CoursesDetailSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>
      <div className="flex items-center gap-2.5">
        <Sk className="w-6 h-6 rounded-md shrink-0" />
        <Sk className="h-7 w-36" />
      </div>
      <Sk className="h-10 w-full rounded-xl" />
      <div className="divide-y divide-border/10 border-t border-b border-border/10 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="py-4 flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <Sk className="h-3 w-16" />
              <Sk className="h-4 w-2/3" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Sk className="h-3 w-16" />
              <Sk className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CategoryCoursesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { categoryId } = useParams("/dashboard/curriculum/:categoryId");

  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadResult, setDownloadResult] = useState<Record<string, { success: boolean; message: string } | null>>({});

  async function load() {
    if (!categoryId) return;
    try {
      if (!isLoggedIn && !authLoading) return;
      setError(null);
      if (authLoading) return;
      setLoading(true);
      const res = await getCurriculumCategoryCourses(categoryId);
      if (res.success && res.data) {
        setCourses(res.data);
      } else {
        setError(res.error ?? "Failed to fetch courses for this category.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn && categoryId) load();
  }, [isLoggedIn, authLoading, categoryId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.toLowerCase();
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.courseType.toLowerCase().includes(q)
    );
  }, [courses, query]);

  async function handleDownloadSyllabus(courseCode: string) {
    if (downloading[courseCode]) return;
    setDownloading((prev) => ({ ...prev, [courseCode]: true }));
    setDownloadResult((prev) => ({ ...prev, [courseCode]: null }));
    try {
      const res = await downloadCurriculumSyllabus(courseCode);
      if (res.success && res.data) {
        setDownloadResult((prev) => ({ ...prev, [courseCode]: { success: true, message: `Saved to: ${res.data!.savePath}` } }));
      } else {
        setDownloadResult((prev) => ({ ...prev, [courseCode]: { success: false, message: res.error ?? "Failed to download syllabus." } }));
      }
    } catch (e) {
      setDownloadResult((prev) => ({ ...prev, [courseCode]: { success: false, message: e instanceof Error ? e.message : String(e) } }));
    } finally {
      setDownloading((prev) => ({ ...prev, [courseCode]: false }));
    }
  }

  const shell = (children: React.ReactNode) => <>{children}</>;
  const isOnline = useOnlineStatus();
  const isLoading = authLoading || loading;
  const showOffline = courses.length === 0 && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) return shell(<OfflineDisplay onRetry={load} />);
  if (isLoading && courses.length === 0) return shell(<CoursesDetailSkeleton />);
  if (error && courses.length === 0) return shell(<div className="flex h-full items-center justify-center"><ErrorDisplay message={error} onRetry={load} /></div>);

  return shell(
    <div className="w-full space-y-5 px-2 py-4 font-saira">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>
      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">{categoryId}</p>
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground leading-none">Course List</h1>
        {!isLoading && courses.length > 0 && (
          <p className="text-xs text-muted-foreground/50 leading-none pt-0.5">
            {filtered.length === courses.length ? `${courses.length} courses` : `${filtered.length} of ${courses.length} courses`}
          </p>
        )}
      </header>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          placeholder="Search course title or code…"
          className="w-full h-10 pl-10 pr-10 rounded-xl border border-border/20 bg-muted/10 text-sm placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all disabled:opacity-50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Course List ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground">No courses found</p>
          <p className="text-xs text-muted-foreground">Try a different search term or code</p>
        </div>
      ) : (
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {filtered.map((course) => {
            const isDownloading = downloading[course.code];
            const result = downloadResult[course.code];

            return (
              <div key={course.code} className="py-4 flex items-start justify-between gap-4">
                {/* Left: Code + Title + result */}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                    {course.code}
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-snug">{course.title}</p>
                  <p className="text-xs text-muted-foreground/50 leading-none">
                    {course.courseType} &bull; {course.credits} credits
                  </p>

                  {/* Download result inline */}
                  {result && (
                    <div className="flex items-start gap-1.5 pt-1">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] text-emerald-500 font-medium break-all leading-snug">{result.message}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                          <span className="text-[10px] text-destructive font-medium break-all leading-snug">{result.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Download button */}
                <div className="shrink-0 pt-0.5">
                  <Button
                    variant={result?.success ? "outline" : "default"}
                    size="sm"
                    disabled={isDownloading}
                    onClick={() => handleDownloadSyllabus(course.code)}
                    className="rounded-lg text-xs h-8"
                  >
                    <Download className="size-3.5" />
                    {isDownloading ? "…" : "Syllabus"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
