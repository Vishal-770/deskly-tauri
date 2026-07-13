import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { invoke } from "@tauri-apps/api/core";
import { getStudentProfile, getFeedbackStatus, ProfileData } from "@/lib/features";
import {
  BookOpen,
  Clock,
  FileText,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import dashboardImg from "@/assets/dashboard.png";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStudentName(name: string | undefined) {
  if (!name) return "Student";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning,";
  if (hour >= 12 && hour < 17) return "Good afternoon,";
  return "Good evening,";
}

// Check for the "NOT Given" status
function parseFeedbackText(text: string) {
  const n = text.toLowerCase();
  const isGiven =
    (n.includes("given") && !n.includes("not given")) || n.includes("submitted");
  return { isGiven };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CgpaData = {
  currentCgpa: number;
  earnedCredits: number;
  totalCreditsRequired: number;
  nonGradedCore: number;
};

type FeedbackStatus = {
  type: string;
  midSemester: string;
  teeSemester: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

async function getCgpaPage(): Promise<{ success: boolean; cgpaData?: CgpaData; error?: string }> {
  try {
    return await invoke("get_cgpa_page");
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 px-1 py-2 animate-pulse font-saira">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* CGPA block */}
      <div className="space-y-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-16 w-56" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="h-1.5 w-full" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>

      {/* Feedback block */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          <div className="py-4 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="py-4 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileDashboardHome() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [cgpaData, setCgpaData] = useState<CgpaData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("default", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  // Cache read (SWR pattern)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("deskly::cache::dashboard");
      if (cached) {
        const p = JSON.parse(cached);
        if (p?.cgpaData) setCgpaData(p.cgpaData);
        if (p?.feedbackData) setFeedbackData(p.feedbackData);
        if (p?.profile) setProfile(p.profile);
        if (p?.cgpaData || p?.feedbackData || p?.profile) setLoading(false);
      }
    } catch {}
  }, []);

  async function loadData() {
    if (authLoading || !isLoggedIn) return;
    setError(null);

    try {
      const [cgpaRes, feedbackRes, profileRes] = await Promise.all([
        getCgpaPage(),
        getFeedbackStatus(),
        getStudentProfile().catch(() => null),
      ]);

      let updatedCgpa = cgpaData;
      let updatedFeedback = feedbackData;
      let updatedProfile = profile;

      if (cgpaRes.success && cgpaRes.cgpaData) {
        setCgpaData(cgpaRes.cgpaData);
        updatedCgpa = cgpaRes.cgpaData;
      } else if (cgpaRes.error) {
        setError(cgpaRes.error);
      }

      if (feedbackRes.success && feedbackRes.data) {
        setFeedbackData(feedbackRes.data);
        updatedFeedback = feedbackRes.data;
      } else if (feedbackRes.error) {
        setError(feedbackRes.error);
      }

      if (profileRes?.success && profileRes.data) {
        setProfile(profileRes.data);
        updatedProfile = profileRes.data;
      }

      localStorage.setItem(
        "deskly::cache::dashboard",
        JSON.stringify({ cgpaData: updatedCgpa, feedbackData: updatedFeedback, profile: updatedProfile })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, authLoading]);

  const studentName = formatStudentName(profile?.student?.name);

  if (!isOnline && !cgpaData && !feedbackData && !loading) {
    return <OfflineDisplay onRetry={loadData} />;
  }

  if (authLoading || (loading && !cgpaData && !feedbackData)) {
    return <DashboardSkeleton />;
  }

  const creditPct = cgpaData
    ? ((cgpaData.earnedCredits / cgpaData.totalCreditsRequired) * 100).toFixed(1)
    : "0";

  return (
    <div className="w-full space-y-7 px-0 pt-2 pb-6 font-saira select-none overscroll-y-contain relative">
      {/* Google Font Saira Injection */}
      <style>{`
        .font-saira {
          font-family: 'Saira', sans-serif !important;
        }
      `}</style>

      {/* Illustration image absolute header */}
      <div className="absolute -top-4 right-0 w-[200px] h-[160px] pointer-events-none select-none z-0">
        <img
          src={dashboardImg}
          className="w-full h-full object-contain opacity-95 dark:opacity-75"
          style={{
            maskImage: "radial-gradient(ellipse at 30% 40%, #fff 30%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.2) 80%, transparent 95%)",
            WebkitMaskImage: "radial-gradient(ellipse at 30% 40%, #fff 30%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.2) 80%, transparent 95%)"
          }}
          alt="Dashboard Illustration"
        />
      </div>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button
            onClick={loadData}
            className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0 pt-2">
          <p className="text-[15px] font-medium text-muted-foreground/60 leading-none">
            {getGreeting()}
          </p>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight truncate">
            {profile?.student?.name ? studentName : "Student"}
          </h1>
          <p className="text-xs text-muted-foreground/40 leading-none pt-0.5">{formattedDate}</p>
        </div>
      </header>

      {/* ── CGPA Card ───────────────────────────────────────────────────────── */}
      {cgpaData && (
        <section className="relative z-10 space-y-6">
          <div className="bg-gradient-to-br from-card/90 to-card/45 border border-border/15 p-6 rounded-[30px] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground/50 uppercase leading-none">
                Cumulative GPA
              </span>
            </div>
            
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-extrabold text-foreground leading-none tracking-tight">
                {cgpaData.currentCgpa.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-muted-foreground/45 leading-none">/ 10.00</span>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground/60">Credits Completed</span>
                <span className="text-foreground tracking-tight">
                  {cgpaData.earnedCredits} / {cgpaData.totalCreditsRequired} ({creditPct}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{
                    width: `${(cgpaData.earnedCredits / cgpaData.totalCreditsRequired) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Three Circular Stats Badges */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            
            {/* Earned */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-[60px] h-[60px] rounded-full border-2 border-t-primary/45 border-x-primary/45 border-b-transparent flex items-center justify-center text-primary shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-lg font-extrabold text-foreground leading-tight">{cgpaData.earnedCredits}</p>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide">Earned</p>
              </div>
            </div>

            {/* Required */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-[60px] h-[60px] rounded-full border-2 border-t-border border-x-border border-b-transparent flex items-center justify-center text-muted-foreground shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-lg font-extrabold text-foreground leading-tight">{cgpaData.totalCreditsRequired}</p>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide">Required</p>
              </div>
            </div>

            {/* Non-Graded */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-[60px] h-[60px] rounded-full border-2 border-t-border border-x-border border-b-transparent flex items-center justify-center text-muted-foreground shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-lg font-extrabold text-foreground leading-tight">{cgpaData.nonGradedCore}</p>
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide">Non-Graded</p>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ── Feedback Status ──────────────────────────────────────────────────── */}
      {feedbackData && feedbackData.length > 0 && (
        <section className="relative z-10 space-y-4">
          <div className="flex items-center justify-between text-foreground">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold tracking-tight leading-none">Feedback</h2>
              <div className="w-6 h-0.5 bg-foreground rounded" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {feedbackData.map((item, idx) => {
              const isCurriculum = item.type.toLowerCase().includes("curriculum");
              const label = isCurriculum ? "Content Feedback" : "General Feedback";
              const mid = parseFeedbackText(item.midSemester);
              const tee = parseFeedbackText(item.teeSemester);
              const Icon = isCurriculum ? FileText : ClipboardList;
              const iconColor = "text-primary bg-primary/10";

              return (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-card/90 to-card/45 border border-border/15 p-4.5 rounded-[24px] flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mr-4 ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/45 leading-none truncate">
                        {item.type}
                      </p>
                      <h3 className="text-[13.5px] font-bold text-foreground leading-none">{label}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold leading-none pt-0.5">
                        <span>Mid:</span>
                        <span className={mid.isGiven ? "text-primary" : "text-destructive font-extrabold"}>
                          {mid.isGiven ? "Given" : "Pending"}
                        </span>
                        <span className="text-muted-foreground/15">|</span>
                        <span>TEE:</span>
                        <span className={tee.isGiven ? "text-primary" : "text-destructive font-extrabold"}>
                          {tee.isGiven ? "Given" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
