import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudentProfile, ProfileData } from "@/lib/features";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

import { ErrorDisplay } from "@/components/error-display";
import {
  User,
  Mail,
  Phone,
  Home,
  Shield,
  MapPin,
  Calendar,
  Layers
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

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4">
      <div className="space-y-1">
        <Sk className="h-7 w-36" />
      </div>
      {/* Photo + name */}
      <div className="flex items-center gap-4">
        <Sk className="w-20 h-20 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Sk className="h-5 w-40" />
          <Sk className="h-3 w-28" />
          <Sk className="h-3 w-32" />
        </div>
      </div>
      <Separator className="bg-border/20" />
      {/* Fields */}
      <div className="divide-y divide-border/10 border-t border-b border-border/10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <Sk className="w-4 h-4 rounded-md" />
              <Sk className="h-3 w-20" />
            </div>
            <Sk className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3 shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground/35 shrink-0" />
        <span className="text-xs font-medium text-muted-foreground/55 uppercase tracking-wide leading-none">
          {label}
        </span>
      </div>
      <span className="text-sm font-medium text-foreground text-right truncate max-w-[55%]">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    const cached = localStorage.getItem("deskly::cache::profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.student && parsed.student.name) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse cached profile", e);
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!profile);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    setLoading(profile ? false : true);
    try {
      const res = await getStudentProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        localStorage.setItem("deskly::cache::profile", JSON.stringify(res.data));
        setError(null);
      } else {
        setError(res.error ?? "Failed to fetch student profile details.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOnline) {
      fetchProfile();
    }
  }, [isOnline]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = !profile && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={fetchProfile} />);
  }

  if (authLoading || (loading && !profile)) return shell(<ProfileSkeleton />);

  if (error && !profile) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={fetchProfile} />
      </div>
    );
  }

  if (!profile) return null;

  const { student, proctor, hostel } = profile;

  const photoSrc = student.photoUrl ? getSrcFromPhoto(student.photoUrl) : "";
  const initials = student.name
    ? student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return shell(
    <div className="w-full space-y-6 px-2 py-4 select-none overscroll-y-contain">

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={fetchProfile} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <User className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
          My Profile
        </h1>
      </header>

      {/* ── Student Hero Block ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {photoSrc ? (
          <div className="w-20 h-20 rounded-2xl shrink-0 border border-border/15 bg-muted/20 flex items-center justify-center overflow-hidden">
            <img src={photoSrc} alt={student.name} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl shrink-0 border border-border/15 bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary tracking-wider">{initials}</span>
          </div>
        )}
        <div className="space-y-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground leading-snug truncate">{student.name}</h2>
          <p className="text-xs text-primary font-semibold uppercase tracking-wide leading-none">{student.registerNumber}</p>
          <p className="text-xs text-muted-foreground/60 leading-none truncate">{student.program}</p>
        </div>
      </div>

      <Separator className="bg-border/20" />

      {/* ── Student Details ──────────────────────────────────────────────────── */}
      <section className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest pb-1">Student Information</p>
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          <InfoRow icon={User} label="Register No." value={student.registerNumber} />
          <InfoRow icon={User} label="Application No." value={student.applicationNumber} />
          <InfoRow icon={Layers} label="Program" value={student.program} />
          <InfoRow icon={Calendar} label="Date of Birth" value={student.dob} />
          <InfoRow icon={User} label="Gender" value={student.gender} />
          <InfoRow icon={Phone} label="Mobile" value={student.mobile} />
          <InfoRow icon={Mail} label="VIT Email" value={student.vitEmail} />
          <InfoRow icon={Mail} label="Personal Email" value={student.personalEmail} />
        </div>
      </section>

      {/* ── Proctor Details ──────────────────────────────────────────────────── */}
      {proctor && (
        <section className="space-y-4">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Proctor Details</p>

          {/* Proctor photo + name */}
          <div className="flex items-center gap-4">
            {proctor.photoUrl ? (
              <div className="w-16 h-16 rounded-xl shrink-0 border border-border/15 bg-muted/20 flex items-center justify-center overflow-hidden">
                <img src={getSrcFromPhoto(proctor.photoUrl)} alt={proctor.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl shrink-0 border border-border/15 bg-primary/10 flex items-center justify-center">
                <span className="text-base font-bold text-primary tracking-wider">
                  {proctor.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{proctor.name}</p>
              <p className="text-xs text-muted-foreground/60 leading-none">{proctor.designation}</p>
            </div>
          </div>

          <div className="divide-y divide-border/10 border-t border-b border-border/10">
            <InfoRow icon={User} label="Faculty ID" value={proctor.facultyId} />
            <InfoRow icon={Layers} label="School" value={proctor.school} />
            <InfoRow icon={MapPin} label="Cabin" value={proctor.cabin} />
            <InfoRow icon={Phone} label="Mobile" value={proctor.mobile} />
            <InfoRow icon={Mail} label="Email" value={proctor.email} />
          </div>
        </section>
      )}

      {/* ── Hostel Details ───────────────────────────────────────────────────── */}
      {hostel && (
        <section className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest pb-1">Hostel Details</p>
          <div className="divide-y divide-border/10 border-t border-b border-border/10">
            <InfoRow icon={Home} label="Block Name" value={hostel.blockName} />
            <InfoRow icon={MapPin} label="Room Number" value={hostel.roomNumber} />
            <InfoRow icon={Layers} label="Bed Type" value={hostel.bedType} />
            <InfoRow icon={Shield} label="Mess Type" value={hostel.messType} />
          </div>
        </section>
      )}
    </div>
  );
}
