import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { invoke } from "@tauri-apps/api/core";
import { getStudentProfile, getFeedbackStatus, ProfileData } from "@/lib/features";
import {
  RefreshCw,
  Trophy,
  BookOpen,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStudentName(name: string | undefined) {
  if (!name) return "Student";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
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

function StatColumn({
  icon: Icon,
  label,
  value,
  showBorder,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  showBorder: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-between py-2.5 text-center h-24 ${showBorder ? "border-r border-border/10" : ""}`}>
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium tracking-[0.15em] text-muted-foreground/60 uppercase leading-none">
          {label}
        </p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
      </div>
      <Icon className="w-5 h-5 text-sky-500 shrink-0" />
    </div>
  );
}

function FeedbackItem({ item }: { item: FeedbackStatus }) {
  const isCurriculum = item.type.toLowerCase().includes("curriculum");
  const label = isCurriculum ? "Content Feedback" : "General Feedback";
  const mid = parseFeedbackText(item.midSemester);
  const tee = parseFeedbackText(item.teeSemester);

  return (
    <div className="space-y-3 py-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-sky-500 leading-none">
        {item.type}
      </p>
      <h3 className="text-lg font-semibold text-foreground leading-none">{label}</h3>
      <div className="flex items-center gap-2.5 text-base text-muted-foreground font-mono leading-none">
        <span>Mid:</span>
        <span className={mid.isGiven ? "text-emerald-500 font-medium" : "text-destructive font-medium"}>
          {mid.isGiven ? "Given" : "Pending"}
        </span>
        <span className="text-muted-foreground/20">|</span>
        <span>TEE:</span>
        <span className={tee.isGiven ? "text-emerald-500 font-medium" : "text-destructive font-medium"}>
          {tee.isGiven ? "Given" : "Pending"}
        </span>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

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
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileDashboardHome() {
  const { isLoggedIn, loading: authLoading } = useAuth();

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

  if (authLoading || (loading && !cgpaData && !feedbackData)) {
    return <DashboardSkeleton />;
  }

  const creditPct = cgpaData
    ? ((cgpaData.earnedCredits / cgpaData.totalCreditsRequired) * 100).toFixed(1)
    : "0";

  return (
    <div className="w-full space-y-6 px-2 pt-1 pb-4 font-saira select-none overscroll-y-contain">
      {/* Google Font Saira Injection */}
      <style>{`
        .font-saira {
          font-family: 'Saira', sans-serif !important;
        }
      `}</style>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
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
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-[30px] font-medium tracking-tight text-foreground leading-tight truncate">
            {profile?.student?.name ? `Welcome, ${studentName}.` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <button
          onClick={loadData}
          className="p-1 hover:opacity-80 text-foreground shrink-0 border-0 bg-transparent cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* ── CGPA ────────────────────────────────────────────────────────────── */}
      {cgpaData && (
        <section className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground/60 uppercase leading-none">
              Cumulative GPA
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[62px] font-medium text-foreground leading-none tracking-tight">
                {cgpaData.currentCgpa.toFixed(2)}
              </span>
              <span className="text-base font-medium text-muted-foreground">/ 10.00</span>
            </div>
          </div>

          {/* Progress bar info */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-muted-foreground">Credits Completed</span>
              <span className="text-foreground">
                {cgpaData.earnedCredits} / {cgpaData.totalCreditsRequired} ({creditPct}%)
              </span>
            </div>
            <div className="h-[3px] w-full bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-700"
                style={{
                  width: `${(cgpaData.earnedCredits / cgpaData.totalCreditsRequired) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Stat columns */}
          <div className="grid grid-cols-3 pt-2">
            <StatColumn icon={Trophy} label="Earned" value={cgpaData.earnedCredits} showBorder={true} />
            <StatColumn icon={BookOpen} label="Required" value={cgpaData.totalCreditsRequired} showBorder={true} />
            <StatColumn icon={Clock} label="Non-Graded" value={cgpaData.nonGradedCore} showBorder={false} />
          </div>
        </section>
      )}

      {/* ── Feedback Status ──────────────────────────────────────────────────── */}
      {feedbackData && feedbackData.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <MessageSquare className="w-5 h-5 text-sky-500" />
              <h2 className="text-xl font-medium tracking-tight">Feedback Checklist</h2>
            </div>
            <p className="text-sm text-muted-foreground">VTOP feedback submission status</p>
          </div>

          <Separator className="bg-border/40" />

          <div className="divide-y divide-border/20">
            {feedbackData.map((item, idx) => (
              <FeedbackItem key={idx} item={item} />
            ))}
          </div>

          <Separator className="bg-border/40" />
        </section>
      )}

    </div>
  );
}
