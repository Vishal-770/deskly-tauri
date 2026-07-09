import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSemester } from "@/hooks/useSemester";
import { useCredentialStatus } from "@/hooks/useCredentialStatus";
import { authGetTokens } from "@/lib/tauri-auth";
import { getStudentProfile, ProfileData } from "@/lib/features";
import {
  User,
  LogOut,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  KeyRound,
  Cookie,
  RefreshCw,
  AlertTriangle,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/60 ${className}`} />;
}

export default function MobileSettings() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const { currentSemester, semesters, loading: semesterLoading, error: semesterError, setSemester } = useSemester();

  // Keyring / credential status
  const { status: credStatus, loading: credLoading, error: credError, refresh: refreshCred } = useCredentialStatus();

  // Session token (cookie) status
  const [hasCookies, setHasCookies] = useState<boolean | null>(null);
  const [cookiesLoading, setCookiesLoading] = useState(true);

  async function loadTokenStatus() {
    setCookiesLoading(true);
    try {
      const tokens = await authGetTokens();
      setHasCookies(!!(tokens && tokens.cookies && tokens.cookies.length > 0));
    } catch {
      setHasCookies(false);
    } finally {
      setCookiesLoading(false);
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getStudentProfile();
        if (res.success && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
    loadTokenStatus();
  }, []);

  function handleRefreshKeyring() {
    refreshCred();
    loadTokenStatus();
  }

  async function handleSemesterChange(semesterId: string) {
    const semester = semesters.find((item) => item.id === semesterId);
    if (!semester) return;
    await setSemester(semester);
  }

  // Each keyring row item
  const credItems: {
    icon: React.ReactNode;
    label: string;
    value: string | null | undefined;
    stored: boolean | null;
    loading: boolean;
  }[] = [
    {
      icon: <User className="w-4 h-4 text-muted-foreground/60" />,
      label: "Username / Reg No",
      value: credStatus?.userId ?? null,
      stored: credStatus ? !!credStatus.userId : null,
      loading: credLoading,
    },
    {
      icon: <KeyRound className="w-4 h-4 text-muted-foreground/60" />,
      label: "Password (Keyring)",
      value: credStatus?.hasPasswordStored ? "Stored securely in system keyring" : "Not stored",
      stored: credStatus ? credStatus.hasPasswordStored : null,
      loading: credLoading,
    },
    {
      icon: <Cookie className="w-4 h-4 text-muted-foreground/60" />,
      label: "Session Cookies",
      value: hasCookies ? "Active session tokens present" : "No session cookies stored",
      stored: hasCookies,
      loading: cookiesLoading,
    },
  ];

  return (
    <div className="w-full space-y-6 p-1">
      {/* Header */}
      <header className="pb-4 border-b border-border/10">
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        <p className="text-[10px] text-muted-foreground">Manage your student profile</p>
      </header>

      {/* Profile Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/20 border border-border/10 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-foreground truncate">
              {profile?.student?.name ?? "Student"}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {profile?.student?.registerNumber ?? "Loading..."}
            </p>
          </div>
        </div>

        {/* Student Details */}
        {profile?.student && (
          <div className="p-4 bg-muted/20 border border-border/10 rounded-xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-muted-foreground/60" />
              <div>
                <p className="text-[9px] text-muted-foreground font-black uppercase">Program</p>
                <p className="font-semibold text-foreground">{profile.student.program}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground/60" />
              <div>
                <p className="text-[9px] text-muted-foreground font-black uppercase">Email</p>
                <p className="font-semibold text-foreground">{profile.student.vitEmail ?? "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground/60" />
              <div>
                <p className="text-[9px] text-muted-foreground font-black uppercase">Phone</p>
                <p className="font-semibold text-foreground">{profile.student.mobile ?? "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground/60" />
              <div>
                <p className="text-[9px] text-muted-foreground font-black uppercase">Date of Birth</p>
                <p className="font-semibold text-foreground">{profile.student.dob ?? "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Semester */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">
            Academic Settings
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 bg-muted/20 border border-border/10 rounded-xl">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">Active Semester</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Select the semester used for grades, timetable, and marks.
            </p>
            {semesterError && (
              <p className="text-[10px] text-destructive mt-1">{semesterError}</p>
            )}
          </div>

          <Select
            value={currentSemester?.id || ""}
            onValueChange={handleSemesterChange}
            disabled={semesterLoading || semesters.length === 0}
          >
            <SelectTrigger className="w-35 h-9 rounded-lg bg-background/80 hover:bg-background border-border/20 text-[11px] focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder={semesterLoading ? "Loading..." : "Select"} />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-border/20 bg-popover/95 backdrop-blur-md">
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id} className="rounded-md text-[11px]">
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Keyring / Credential Status ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">
              Keyring Status
            </h2>
          </div>
          <button
            onClick={handleRefreshKeyring}
            disabled={credLoading || cookiesLoading}
            className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors disabled:opacity-40 cursor-pointer border-0"
            title="Refresh keyring status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${(credLoading || cookiesLoading) ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Keyring error banner */}
        {(credError || credStatus?.keyringError) && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/15 rounded-xl text-[11px] text-destructive font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{credError ?? credStatus?.keyringError}</span>
          </div>
        )}

        <div className="bg-muted/20 border border-border/10 rounded-xl divide-y divide-border/10 overflow-hidden">
          {credItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">
                    {item.label}
                  </p>
                  {item.loading ? (
                    <Sk className="h-3.5 w-36 mt-1" />
                  ) : (
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {item.label === "Username / Reg No"
                        ? (item.value ?? "Not stored")
                        : item.value}
                    </p>
                  )}
                </div>
              </div>

              {/* Status pill */}
              {item.loading ? (
                <Sk className="h-5 w-14 rounded-full shrink-0" />
              ) : (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                    item.stored
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/15"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.stored ? "bg-emerald-500" : "bg-destructive"}`} />
                  {item.stored ? "Stored" : "Missing"}
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/50 leading-relaxed px-1">
          Credentials are stored in your device's secure system keyring. Session cookies are held in memory and refreshed automatically on re-login.
        </p>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={() => logout()}
          className="w-full h-11 flex justify-center items-center gap-2 bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/20 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
