import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getHodDeanDetails, HodDeanDetail } from "@/lib/features";
import { isNetworkError } from "@/lib/utils";
import { ErrorDisplay } from "@/components/error-display";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { Mail, MapPin, Phone, Building2, Building } from "lucide-react";

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

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/65 ${className}`} />;
}

function HodDeanSkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira">
      <div className="flex items-center gap-2">
        <Sk className="w-6 h-6 rounded-md shrink-0" />
        <Sk className="h-7 w-36" />
      </div>
      {[...Array(3)].map((_, i) => (
        <Sk key={i} className="h-44 w-full rounded-3xl" />
      ))}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/15 last:border-0">
      <div className="flex items-center gap-3 shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide leading-none">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

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

  useEffect(() => { fetchDetails(); }, []);

  const shell = (children: React.ReactNode) => <>{children}</>;
  const showOffline = !details && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) return shell(<OfflineDisplay onRetry={fetchDetails} />);
  if (authLoading || (loading && !details)) return shell(<HodDeanSkeleton />);
  if (error && !details) return shell(<div className="flex h-full items-center justify-center"><ErrorDisplay message={error} onRetry={fetchDetails} /></div>);
  if (!details) return null;

  return shell(
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira select-none overscroll-y-contain relative">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={fetchDetails} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-2">
        <Building2 className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-2xl font-medium tracking-tight text-foreground leading-none">HOD & Dean</h1>
      </header>

      {details.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card/80 border border-border/40 rounded-3xl shadow-sm backdrop-blur-md">
          <Building className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">No details found</p>
          <p className="text-xs text-muted-foreground">Please try reloading later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {details.map((item, idx) => {
            const photoSrc = item.photo ? getSrcFromPhoto(item.photo) : "";
            const initials = item.name
              ? item.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?";

            return (
              <div key={idx} className="p-5 bg-card/80 border border-border/40 rounded-3xl shadow-sm backdrop-blur-md space-y-4">
                {/* Role badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wide leading-none">
                    {item.role || "Faculty"}
                  </span>
                </div>

                {/* Photo + identity */}
                <div className="flex items-center gap-4">
                  {photoSrc ? (
                    <div className="w-14 h-18 rounded-2xl shrink-0 overflow-hidden border border-border/30 bg-muted/20 p-0.5">
                      <img
                        src={photoSrc}
                        alt={item.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-16 rounded-2xl shrink-0 bg-muted/30 border border-border/20 flex items-center justify-center">
                      <span className="text-base font-bold text-muted-foreground/60">{initials}</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-base font-bold text-foreground leading-snug">{item.name}</h2>
                    <p className="text-xs text-muted-foreground/60 leading-none">{item.school}</p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="pt-1 space-y-1">
                  <InfoRow icon={MapPin} label="Cabin" value={item.cabin} />
                  <InfoRow icon={Phone} label="Intercom" value={item.intercom} />
                  <InfoRow icon={Mail} label="Email" value={item.email} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
