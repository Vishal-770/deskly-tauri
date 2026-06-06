import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getHodDeanDetails, HodDeanDetail } from "@/lib/features";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Building
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSrcFromPhoto(photo: string): string {
  if (!photo) return "";
  const trimmed = photo.trim();
  if (trimmed.startsWith("data:image")) return trimmed;
  // If it's a pure base64 string
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  return trimmed;
}

function renderPhoto(photoUrl: string, name: string, maxWClass = "max-w-[12rem]", maxHClass = "max-h-[16rem]") {
  const src = photoUrl ? getSrcFromPhoto(photoUrl) : "";
  if (src) {
    return (
      <div className={`relative ${maxWClass} shrink-0 overflow-hidden rounded-3xl border border-border/20 bg-muted/10 flex items-center justify-center p-1`}>
        <img
          src={src}
          alt={name}
          className={`w-full h-auto ${maxHClass} object-contain rounded-2xl`}
        />
      </div>
    );
  }
  
  // Fallback if no photo is available:
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="w-40 h-48 rounded-3xl shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center text-primary border border-border/20">
      <span className="text-xl font-bold tracking-wider">{initials}</span>
    </div>
  );
}

function renderDetailField(icon: React.ReactNode, label: string, value: string | null | undefined, className = "") {
  return (
    <div className={`flex items-center justify-between gap-4 py-3.5 border-b border-border/10 group hover:border-primary/25 transition-colors min-w-0 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-muted-foreground/70 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
          {icon}
        </div>
        <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs sm:text-sm font-extrabold text-foreground/90 break-words text-right pl-4">{value || "N/A"}</span>
    </div>
  );
}

// ─── Loader Skeleton Layout ───────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-muted/65 ${className}`} />;
}

function HodDeanSkeleton() {
  return (
    <div className="w-full space-y-12 animate-pulse">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-border/20 flex items-center gap-4">
        <Sk className="w-8 h-8 rounded-full" />
        <div className="space-y-2">
          <Sk className="h-6 w-36 rounded-full" />
          <Sk className="h-3 w-56 rounded-full" />
        </div>
      </div>

      {/* Row items skeleton */}
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="space-y-6 pt-6 first:pt-0 border-t border-border/10 first:border-t-0">
          <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 items-start w-full">
            <Sk className="w-44 h-60 rounded-3xl shrink-0" />
            <div className="flex-1 w-full space-y-6">
              <div className="border-b border-border/10 pb-4 flex gap-3 items-center">
                <Sk className="h-5 w-16 rounded-full" />
                <Sk className="h-8 w-64 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 w-full">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3.5 border-b border-border/10">
                    <div className="flex items-center gap-3">
                      <Sk className="w-8 h-8 rounded-full shrink-0" />
                      <Sk className="h-3 w-20 rounded-full" />
                    </div>
                    <Sk className="h-4 w-32 rounded-full" />
                  </div>
                ))}
                <div className="flex items-center justify-between py-3.5 border-b border-border/10 md:col-span-2">
                  <div className="flex items-center gap-3">
                    <Sk className="w-8 h-8 rounded-full shrink-0" />
                    <Sk className="h-3 w-24 rounded-full" />
                  </div>
                  <Sk className="h-4 w-48 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HodDeanDetailsPage() {
  const { loading: authLoading } = useAuth();
  const [details, setDetails] = useState<HodDeanDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await getHodDeanDetails();
        if (res.success && res.data) {
          setDetails(res.data);
        } else {
          setError(res.error ?? "Failed to fetch HOD and Dean details.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, []);

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-4 sm:pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  if (authLoading || loading) {
    return shell(<HodDeanSkeleton />);
  }

  if (error || !details) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error ?? "No HOD or Dean data loaded."} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent">
              HOD & Dean Details
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            View administrative contacts including Head of Departments and School Deans
          </p>
        </div>
      </header>

      {/* ── Details List ───────────────────────────────────────────────────── */}
      <div className="space-y-12">
        {details.map((item, idx) => (
          <section key={idx} className="space-y-6 pt-6 first:pt-0 border-t border-border/10 first:border-t-0">
            <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 items-start w-full">
              {/* Photo */}
              {renderPhoto(item.photo, item.name, "w-44 max-w-full shrink-0", "max-h-[16rem]")}
              
              {/* Details block */}
              <div className="flex-1 w-full space-y-6">
                <div className="border-b border-border/10 pb-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 w-fit">
                    {item.role || "Faculty"}
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-foreground">{item.name}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 w-full">
                  {renderDetailField(<Building className="w-4 h-4" />, "School", item.school)}
                  {renderDetailField(<MapPin className="w-4 h-4" />, "Cabin Room", item.cabin)}
                  {renderDetailField(<Phone className="w-4 h-4" />, "Intercom", item.intercom)}
                  {renderDetailField(<Mail className="w-4 h-4" />, "Email Address", item.email, "md:col-span-2")}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
