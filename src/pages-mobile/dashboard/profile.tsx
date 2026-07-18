import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudentProfile, ProfileData } from "@/lib/features";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import { ErrorDisplay } from "@/components/error-display";
import { User, Mail, Phone, Home, Shield, MapPin, Calendar, Layers } from "lucide-react";

function getSrcFromPhoto(photo: string): string {
  if (!photo) return "";
  const trimmed = photo.trim();
  if (trimmed.startsWith("data:")) {
    if (trimmed.startsWith("data:jpg;base64,"))
      return trimmed.replace("data:jpg;base64,", "data:image/jpeg;base64,");
    return trimmed;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) return `data:image/jpeg;base64,${trimmed}`;
  return trimmed;
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 px-2 py-4">
      <Sk className="h-7 w-32" />
      <Sk className="h-32 w-full rounded-2xl" />
      <Sk className="h-52 w-full rounded-2xl" />
      <Sk className="h-36 w-full rounded-2xl" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0">
      <div className="flex items-center gap-2.5 shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/35 shrink-0" />
        <span className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-widest leading-none">{label}</span>
      </div>
      <span className="text-[13px] font-semibold text-foreground text-right truncate max-w-[55%]">{value || "—"}</span>
    </div>
  );
}

export default function StudentProfilePage() {
  const { loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    const cached = localStorage.getItem("deskly::cache::profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.student && parsed.student.name) return parsed;
      } catch (e) { console.error("Failed to parse cached profile", e); }
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
    } finally { setLoading(false); }
  }

  useEffect(() => { if (isOnline) fetchProfile(); }, [isOnline]);

  const shell = (children: React.ReactNode) => <>{children}</>;
  const showOffline = !profile && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) return shell(<OfflineDisplay onRetry={fetchProfile} />);
  if (authLoading || (loading && !profile)) return shell(<ProfileSkeleton />);
  if (error && !profile) return shell(<div className="flex h-full items-center justify-center"><ErrorDisplay message={error} onRetry={fetchProfile} /></div>);
  if (!profile) return null;

  const { student, proctor, hostel } = profile;
  const photoSrc = student.photoUrl ? getSrcFromPhoto(student.photoUrl) : "";
  const initials = student.name
    ? student.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return shell(
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={fetchProfile} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">Retry</button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-2.5">
        <User className="w-5 h-5 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">My Profile</h1>
      </header>

      {/* Hero Card */}
      <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex items-center gap-5 shadow-sm">
        {photoSrc ? (
          <div className="w-16 h-20 shrink-0 overflow-hidden rounded-xl border border-border/20 bg-muted/20 flex items-center justify-center">
            <img src={photoSrc} alt={student.name} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-16 h-20 rounded-xl shrink-0 bg-muted/40 border border-border/25 flex items-center justify-center">
            <span className="text-xl font-black text-muted-foreground/50 tracking-wider">{initials}</span>
          </div>
        )}
        <div className="min-w-0 space-y-1.5 flex-1">
          <p className="text-[11px] font-black text-primary uppercase tracking-widest leading-none">{student.registerNumber}</p>
          <h2 className="text-[17px] font-extrabold text-foreground leading-tight">{student.name}</h2>
          <p className="text-[12px] text-muted-foreground/55 leading-none">{student.program}</p>
          {student.gender && (
            <span className="inline-block text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest border border-border/25 rounded-md px-2 py-0.5 mt-0.5">{student.gender}</span>
          )}
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl p-5 shadow-sm">
        <p className="text-[9px] font-black text-muted-foreground/35 uppercase tracking-widest leading-none mb-4">Student Information</p>
        <InfoRow icon={User} label="Register No." value={student.registerNumber} />
        <InfoRow icon={User} label="Application No." value={student.applicationNumber} />
        <InfoRow icon={Layers} label="Program" value={student.program} />
        <InfoRow icon={Calendar} label="Date of Birth" value={student.dob} />
        <InfoRow icon={Phone} label="Mobile" value={student.mobile} />
        <InfoRow icon={Mail} label="VIT Email" value={student.vitEmail} />
        <InfoRow icon={Mail} label="Personal Email" value={student.personalEmail} />
      </div>

      {/* Proctor Card */}
      {proctor && (
        <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-[9px] font-black text-muted-foreground/35 uppercase tracking-widest leading-none">Proctor</p>
          <div className="flex items-center gap-4">
            {proctor.photoUrl ? (
              <div className="w-12 h-14 shrink-0 overflow-hidden rounded-xl border border-border/20 bg-muted/20">
                <img src={getSrcFromPhoto(proctor.photoUrl)} alt={proctor.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-14 rounded-xl shrink-0 bg-muted/40 border border-border/25 flex items-center justify-center">
                <span className="text-sm font-black text-muted-foreground/50">
                  {proctor.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-[15px] font-extrabold text-foreground leading-snug">{proctor.name}</p>
              <p className="text-[11px] text-muted-foreground/55 leading-none">{proctor.designation}</p>
              <p className="text-[11px] text-muted-foreground/40 leading-none">{proctor.school}</p>
            </div>
          </div>
          <div>
            <InfoRow icon={User} label="Faculty ID" value={proctor.facultyId} />
            <InfoRow icon={MapPin} label="Cabin" value={proctor.cabin} />
            <InfoRow icon={Phone} label="Mobile" value={proctor.mobile} />
            <InfoRow icon={Mail} label="Email" value={proctor.email} />
          </div>
        </div>
      )}

      {/* Hostel Card */}
      {hostel && (
        <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl p-5 shadow-sm">
          <p className="text-[9px] font-black text-muted-foreground/35 uppercase tracking-widest leading-none mb-4">Hostel</p>
          <InfoRow icon={Home} label="Block" value={hostel.blockName} />
          <InfoRow icon={MapPin} label="Room" value={hostel.roomNumber} />
          <InfoRow icon={Layers} label="Bed Type" value={hostel.bedType} />
          <InfoRow icon={Shield} label="Mess Type" value={hostel.messType} />
        </div>
      )}
    </div>
  );
}
