import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import {
  getCurriculumCategoryCourses,
  downloadCurriculumSyllabus,
  CurriculumCourse,
} from "@/lib/features";

import { ErrorDisplay } from "@/components/error-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";

// ─── Course Loader Skeleton ───────────────────────────────────────────────────

function CoursesDetailSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 pb-6 border-b border-border/40">
        <div className="animate-pulse rounded-lg bg-muted/65 h-8 w-8" />
        <div className="space-y-2">
          <div className="animate-pulse rounded-lg bg-muted/65 h-6 w-32" />
          <div className="animate-pulse rounded-lg bg-muted/65 h-3.5 w-48" />
        </div>
      </div>
      <div className="divide-y divide-border/5 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="py-4 px-3 -mx-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1 space-y-2 pr-4">
              <div className="rounded-lg bg-muted/65 h-3.5 w-20" />
              <div className="rounded-lg bg-muted/65 h-4 w-2/3" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-4 md:gap-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="rounded bg-muted/65 h-4 w-12" />
                <div className="rounded bg-muted/65 h-4 w-8" />
              </div>
              <div className="rounded-xl bg-muted/65 h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCourseTypeStyle(type: string): string {
  const clean = type.trim().toUpperCase();
  if (clean.includes("THEORY") || clean === "TH") return "text-primary border-primary/20 bg-primary/5";
  if (clean.includes("LAB") || clean === "LO" || clean === "LA") return "text-chart-2 border-chart-2/20 bg-chart-2/5";
  if (clean.includes("ONLINE")) return "text-chart-1 border-chart-1/20 bg-chart-1/5";
  if (clean.includes("SOFT SKILL") || clean === "SS") return "text-chart-4 border-chart-4/20 bg-chart-4/5";
  return "text-muted-foreground border-border/50 bg-muted/20";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CategoryCoursesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { categoryId } = useParams("/dashboard/curriculum/:categoryId");
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Downloading syllabus state
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
    if (isLoggedIn && categoryId) {
      load();
    }
  }, [isLoggedIn, authLoading, categoryId]);

  // Filtering search query
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

  // Handle downloading syllabus file
  async function handleDownloadSyllabus(courseCode: string) {
    if (downloading[courseCode]) return;

    setDownloading((prev) => ({ ...prev, [courseCode]: true }));
    setDownloadResult((prev) => ({ ...prev, [courseCode]: null }));

    try {
      const res = await downloadCurriculumSyllabus(courseCode);
      if (res.success && res.data) {
        const savePath = res.data.savePath;
        setDownloadResult((prev) => ({
          ...prev,
          [courseCode]: {
            success: true,
            message: `Syllabus saved to: ${savePath}`,
          },
        }));
      } else {
        setDownloadResult((prev) => ({
          ...prev,
          [courseCode]: {
            success: false,
            message: res.error ?? "Failed to download syllabus.",
          },
        }));
      }
    } catch (e) {
      setDownloadResult((prev) => ({
        ...prev,
        [courseCode]: {
          success: false,
          message: e instanceof Error ? e.message : String(e),
        },
      }));
    } finally {
      setDownloading((prev) => ({ ...prev, [courseCode]: false }));
    }
  }

  const shell = (children: React.ReactNode) => <>{children}</>;
  const isOnline = useOnlineStatus();
  const isLoading = authLoading || loading;

  const showOffline = courses.length === 0 && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={load} />);
  }

  if (isLoading && courses.length === 0) {
    return shell(<CoursesDetailSkeleton />);
  }

  if (error && courses.length === 0) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6">
      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}
      {/* ── Header with Back Navigation & Course Count ──────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col gap-3">
        <button
          onClick={() => navigate("/dashboard/curriculum")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Categories
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span className="text-xs font-semibold font-mono tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md leading-none">
                {categoryId}
              </span>
              Courses List
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Browse curriculum details and download course syllabus files
            </p>
          </div>
          {!isLoading && courses.length > 0 && (
            <span className="text-xs text-muted-foreground/50 font-bold pb-0.5">
              {filtered.length} of {courses.length} courses
            </span>
          )}
        </div>
      </header>

      {/* ── Search Bar (Matches Contact Page) ───────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          placeholder="Search course title or code…"
          className="w-full h-10 pl-10 pr-10 rounded-xl border border-border/20 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all disabled:opacity-50"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Courses Directory ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/20" />
          <p className="text-sm font-bold text-foreground">No courses found</p>
          <p className="text-xs text-muted-foreground">
            Try a different search term or code
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Table Header on Desktop */}
          <div className="hidden md:flex items-center justify-between px-3 pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/10">
            <div>Course Information</div>
            <div className="flex items-center gap-6">
              <span className="w-32 text-left">Credits & Type</span>
              <span className="w-28 text-right">Actions</span>
            </div>
          </div>

          {/* List Rows - Flat Design like Contact Page */}
          <div className="divide-y divide-border/5">
            {filtered.map((course) => {
              const isDownloading = downloading[course.code];
              const result = downloadResult[course.code];

              return (
                <div
                  key={course.code}
                  className="group py-4 px-3 -mx-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors duration-150"
                >
                  {/* Left section: Code + Title */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold font-mono tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md leading-none">
                        {course.code}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mt-2 leading-snug">
                      {course.title}
                    </h3>

                    {/* Download Inline Notice */}
                    {result && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] leading-tight">
                        {result.success ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-chart-2 shrink-0" />
                            <span className="text-chart-2 font-medium break-all">
                              {result.message}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            <span className="text-destructive font-medium break-all">
                              {result.message}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right section: Credits/Type and Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-4 md:gap-6 shrink-0">
                    {/* Type and Credits */}
                    <div className="flex items-center gap-2 md:w-32 truncate">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium rounded-md border inline-flex items-center justify-center ${getCourseTypeStyle(
                          course.courseType
                        )}`}
                      >
                        {course.courseType}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        {course.credits} Credits
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 md:w-28 justify-end">
                      <Button
                        variant={result?.success ? "outline" : "default"}
                        size="sm"
                        disabled={isDownloading}
                        onClick={() => handleDownloadSyllabus(course.code)}
                        className="w-full sm:w-auto rounded-lg text-xs"
                      >
                        <Download className="size-3.5" />
                        {isDownloading ? "Downloading..." : "Syllabus"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
