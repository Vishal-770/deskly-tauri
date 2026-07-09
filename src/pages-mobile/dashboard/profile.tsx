import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudentProfile, ProfileData } from "@/lib/features";

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
        <Sk className="h-3 w-56" />
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
      {/* Fields */}
      <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Sk className="w-4 h-4 rounded-md" />
              <Sk className="h-3 w-20" />
            </div>
            <Sk className="h-3 w-32" />
          </div>
        ))}
      </div>
      <Sk className="h-4 w-28" />
      <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Sk className="w-4 h-4 rounded-md" />
              <Sk className="h-3 w-20" />
            </div>
            <Sk className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 hover:bg-muted/5 transition-colors duration-150">
      <div className="flex items-center gap-3 shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wide leading-none">
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.student && parsed.student.name) {
          setProfile(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached profile", e);
      }
    }
  }, []);

  async function fetchProfile() {
    setLoading(profile ? false : true);
    try {
      const res = await getStudentProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        localStorage.setItem("deskly::cache::profile", JSON.stringify(res.data));
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
    fetchProfile();
  }, []);

  const shell = (children: React.ReactNode) => <>{children}</>;

  if (authLoading || loading) return shell(<ProfileSkeleton />);

  if (error || !profile) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error ?? "No profile data loaded."} onRetry={fetchProfile} />
      </div>
    );
  }

  const { student, proctor, hostel } = profile;

  const photoSrc = student.photoUrl ? getSrcFromPhoto(student.photoUrl) : "";
  const initials = student.name
    ? student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return shell(
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <User className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
            My Profile
          </h1>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            Academic and personal details
          </p>
        </div>
      </header>

      {/* ── Student Hero Block ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Photo / Initials */}
        {photoSrc ? (
          <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden border border-border/10 bg-muted/10">
            <img src={photoSrc} alt={student.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden border border-border/10 bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary tracking-wider">{initials}</span>
          </div>
        )}
        <div className="space-y-1 min-w-0">
          <h2 className="text-lg font-medium text-foreground leading-snug truncate">{student.name}</h2>
          <p className="text-xs text-sky-500 font-semibold uppercase tracking-wide leading-none">{student.registerNumber}</p>
          <p className="text-xs text-muted-foreground/60 leading-none truncate">{student.program}</p>
        </div>
      </div>

      {/* ── Student Details ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground tracking-tight leading-none uppercase">
          Student Information
        </h2>
        <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
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
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground tracking-tight leading-none uppercase">
            Proctor Details
          </h2>
          {/* Proctor photo */}
          {proctor.photoUrl && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden border border-border/10 bg-muted/10">
                <img src={getSrcFromPhoto(proctor.photoUrl)} alt={proctor.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{proctor.name}</p>
                <p className="text-xs text-muted-foreground/60 leading-none">{proctor.designation}</p>
              </div>
            </div>
          )}
          <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
            {!proctor.photoUrl && <InfoRow icon={User} label="Name" value={proctor.name} />}
            <InfoRow icon={User} label="Faculty ID" value={proctor.facultyId} />
            <InfoRow icon={User} label="Designation" value={proctor.designation} />
            <InfoRow icon={Layers} label="School" value={proctor.school} />
            <InfoRow icon={MapPin} label="Cabin" value={proctor.cabin} />
            <InfoRow icon={Phone} label="Mobile" value={proctor.mobile} />
            <InfoRow icon={Mail} label="Email" value={proctor.email} />
          </div>
        </section>
      )}

      {/* ── Hostel Details ───────────────────────────────────────────────────── */}
      {hostel && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground tracking-tight leading-none uppercase">
            Hostel Details
          </h2>
          <div className="bg-[#0e0e0f]/40 border border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
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
