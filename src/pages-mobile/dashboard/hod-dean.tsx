import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getHodDeanDetails, HodDeanDetail } from "@/lib/features";

import { ErrorDisplay } from "@/components/error-display";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import {
  Mail,
  MapPin,
  Phone,
  Building2,
  Building
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSrcFromPhoto(photo: string): string {
  if (!photo) return "";
  const trimmed = photo.trim();
  if (trimmed.startsWith("data:")) {
    if (trimmed.startsWith("data:jpg;base64,")) {
      return trimmed.replace("data:jpg;base64,", "data:image/jpeg;base64,");
    }
    return trimmed;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  return trimmed;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs leading-none">
      <div className="flex items-center gap-2 shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-foreground font-medium text-right truncate max-w-[65%]">{value || "—"}</span>
    </div>
  );
}

// ─── Loader Skeleton Layout ───────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function HodDeanSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse">
      {/* Header matching real icon + h1 pattern */}
      <div className="flex items-start gap-2">
        <Sk className="w-6 h-6 rounded-md shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <Sk className="h-7 w-36" />
          <Sk className="h-3.5 w-72" />
        </div>
      </div>

      {/* HOD/Dean cards */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-4">
            {/* Photo + primary info row */}
            <div className="flex items-center gap-4">
              <Sk className="w-16 h-20 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Sk className="h-4 w-14 rounded-full" />
                <Sk className="h-5 w-36" />
                <Sk className="h-3.5 w-48" />
              </div>
            </div>
            {/* Info rows */}
            <div className="border-t border-border/10 pt-3 space-y-2.5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sk className="w-3.5 h-3.5 rounded" />
                    <Sk className="h-2.5 w-16" />
                  </div>
                  <Sk className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HodDeanDetailsPage() {
  const { loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const [details, setDetails] = useState<HodDeanDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from cache first
  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::hod_dean");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setDetails(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached HOD/Dean details", e);
      }
    }
  }, []);

  async function fetchDetails() {
    try {
      setLoading(details && details.length > 0 ? false : true);
      const res = await getHodDeanDetails();
      if (res.success && res.data) {
        setDetails(res.data);
        localStorage.setItem("deskly::cache::hod_dean", JSON.stringify(res.data));
      } else {
        setError(res.error ?? "Failed to fetch HOD and Dean details.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetails();
  }, []);

  const shell = (children: React.ReactNode) => <>{children}</>;

  if (!isOnline && !details && !loading) {
    return shell(<OfflineDisplay onRetry={fetchDetails} />);
  }

  if (authLoading || loading) return shell(<HodDeanSkeleton />);

  if (error || !details) {
    return shell(
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay message={error ?? "No HOD or Dean data loaded."} onRetry={fetchDetails} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <Building2 className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
            HOD & Dean
          </h1>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            Head of Departments and School Deans contact list
          </p>
        </div>
      </header>

      {/* ── Details List ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {details.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-muted/15 dark:bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
            <Building className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No details found</p>
            <p className="text-xs text-muted-foreground">Please try reloading the page later.</p>
          </div>
        ) : (
          details.map((item, idx) => {
            const photoSrc = item.photo ? getSrcFromPhoto(item.photo) : "";
            const initials = item.name
              ? item.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?";

            return (
              <section key={idx} className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  {photoSrc ? (
                    <div className="w-16 h-20 rounded-xl shrink-0 overflow-hidden border border-border/10 bg-muted/10">
                      <img src={photoSrc} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-20 rounded-xl shrink-0 overflow-hidden border border-border/10 bg-primary/10 flex items-center justify-center text-primary/80">
                      <span className="text-base font-bold tracking-wider">{initials}</span>
                    </div>
                  )}
                  
                  {/* Primary Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 leading-none">
                      {item.role || "Faculty"}
                    </span>
                    <h2 className="text-base font-bold text-foreground leading-snug truncate mt-1">{item.name}</h2>
                    <p className="text-xs text-muted-foreground/60 leading-none">{item.school}</p>
                  </div>
                </div>

                {/* Additional Info Row Fields */}
                <div className="border-t border-border/10 pt-3 space-y-2">
                  <InfoRow icon={MapPin} label="Cabin Room" value={item.cabin} />
                  {item.intercom && <InfoRow icon={Phone} label="Intercom" value={item.intercom} />}
                  <InfoRow icon={Mail} label="Email Address" value={item.email} />
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
