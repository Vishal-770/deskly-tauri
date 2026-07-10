import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getHodDeanDetails, HodDeanDetail } from "@/lib/features";
import { isNetworkError } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3 shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        <span className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wide leading-none">
          {label}
        </span>
      </div>
      <span className="text-sm font-medium text-foreground text-right truncate max-w-[60%]">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Loader Skeleton Layout ───────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function HodDeanSkeleton() {
  return (
    <div className="w-full space-y-8 px-2 py-4 animate-pulse">
      <div className="flex items-center gap-2.5">
        <Sk className="w-6 h-6 rounded-md shrink-0" />
        <Sk className="h-7 w-36" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          {i > 0 && <div className="h-px bg-border/20" />}
          <div className="flex items-center gap-4">
            <Sk className="w-16 h-20 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Sk className="h-3 w-12" />
              <Sk className="h-5 w-36" />
              <Sk className="h-3 w-48" />
            </div>
          </div>
          <div className="divide-y divide-border/10 border-t border-b border-border/10">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <Sk className="w-4 h-4 rounded" />
                  <Sk className="h-2.5 w-16" />
                </div>
                <Sk className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
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
  const showOffline = !details && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) return shell(<OfflineDisplay onRetry={fetchDetails} />);
  if (authLoading || (loading && !details)) return shell(<HodDeanSkeleton />);
  if (error && !details) return shell(<div className="flex h-full items-center justify-center"><ErrorDisplay message={error} onRetry={fetchDetails} /></div>);
  if (!details) return null;

  return shell(
    <div className="w-full space-y-8 px-2 py-4 select-none overscroll-y-contain">

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={fetchDetails} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-2.5">
        <Building2 className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground leading-none">HOD &amp; Dean</h1>
      </header>

      {/* ── Details List ───────────────────────────────────────────────────── */}
      {details.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Building className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground">No details found</p>
          <p className="text-xs text-muted-foreground">Please try reloading the page later.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {details.map((item, idx) => {
            const photoSrc = item.photo ? getSrcFromPhoto(item.photo) : "";
            const initials = item.name
              ? item.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?";

            return (
              <section key={idx} className="space-y-4">
                {idx > 0 && <Separator className="bg-border/20" />}

                {/* Role label */}
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">
                  {item.role || "Faculty"}
                </p>

                {/* Photo + identity */}
                <div className="flex items-center gap-4">
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={item.name}
                      className="w-16 h-20 rounded-xl shrink-0 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-20 rounded-xl shrink-0 bg-muted/30 flex items-center justify-center">
                      <span className="text-base font-bold text-muted-foreground tracking-wider">{initials}</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h2 className="text-lg font-bold text-foreground leading-snug">{item.name}</h2>
                    <p className="text-xs text-muted-foreground/60 leading-none">{item.school}</p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="divide-y divide-border/10 border-t border-b border-border/10">
                  <InfoRow icon={MapPin} label="Cabin Room" value={item.cabin} />
                  {item.intercom && <InfoRow icon={Phone} label="Intercom" value={item.intercom} />}
                  <InfoRow icon={Mail} label="Email" value={item.email} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
