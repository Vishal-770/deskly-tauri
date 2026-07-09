import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSemester } from "@/hooks/useSemester";
import { useCredentialStatus } from "@/hooks/useCredentialStatus";
import { authGetTokens } from "@/lib/tauri-auth";
import { getStudentProfile, ProfileData } from "@/lib/features";
import { useTheme } from "@/components/theme-provider";
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
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { DrawerSelect } from "@/components/ui/drawer-select";
import { useOnlineStatus } from "@/hooks/use-online-status";

// ─── Skeleton Helper ──────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function SettingsSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      {/* Header */}
      <div className="space-y-1">
        <Sk className="h-7 w-32" />
        <Sk className="h-3.5 w-56" />
      </div>

      {/* Profile card */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
        <Sk className="w-14 h-14 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Sk className="h-4.5 w-36" />
          <Sk className="h-3 w-24" />
          <Sk className="h-3 w-48" />
        </div>
      </div>

      {/* Student details card */}
      <div className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Sk className="w-4 h-4 rounded shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Sk className="h-2 w-14" />
              <Sk className="h-3.5 w-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Appearance section */}
      <div className="space-y-3">
        <Sk className="h-3.5 w-24" />
        <div className="flex justify-between items-center p-4 bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
          <div className="space-y-1.5 flex-1">
            <Sk className="h-4 w-24" />
            <Sk className="h-3 w-48" />
          </div>
          <Sk className="h-9 w-28 rounded-xl shrink-0 ml-4" />
        </div>
      </div>

      {/* Academic Settings section */}
      <div className="space-y-3">
        <Sk className="h-3.5 w-32" />
        <div className="flex justify-between items-center p-4 bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
          <div className="space-y-1.5 flex-1">
            <Sk className="h-4 w-32" />
            <Sk className="h-3 w-56" />
          </div>
          <Sk className="h-9 w-28 rounded-xl shrink-0 ml-4" />
        </div>
      </div>

      {/* Keyring status rows */}
      <div className="space-y-3">
        <Sk className="h-3.5 w-28" />
        <div className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <Sk className="w-4 h-4 rounded" />
                <Sk className="h-3.5 w-20" />
              </div>
              <Sk className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Sign out button */}
      <Sk className="h-11 w-full rounded-2xl" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileSettings() {
  const { logout, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const { currentSemester, semesters, loading: semesterLoading, error: semesterError, setSemester } = useSemester();
  const { theme, setTheme } = useTheme();

  // Keyring / credential status
  const { status: credStatus, loading: credLoading, error: credError, refresh: refreshCred } = useCredentialStatus();

  const isOnline = useOnlineStatus();

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
    if (!isOnline) return;
    refreshCred();
    loadTokenStatus();
  }

  async function handleSemesterChange(semesterId: string) {
    if (!isOnline) return;
    const semester = semesters.find((item) => item.id === semesterId);
    if (!semester) return;
    await setSemester(semester);
  }

  // Keyring rows list
  const credItems = [
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

  if (authLoading || !profile) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <Settings className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">
            Settings
          </h1>
          <p className="text-xs text-muted-foreground leading-none pt-0.5">
            Manage your student profile and application preferences
          </p>
        </div>
      </header>

      {/* ── Profile Section ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 border border-sky-500/20">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground truncate">
              {profile?.student?.name ?? "Student"}
            </h2>
            <p className="text-xs text-sky-500 uppercase tracking-wide font-semibold mt-0.5">
              {profile?.student?.registerNumber ?? "—"}
            </p>
          </div>
        </div>

        {/* Student Details Info Box */}
        {profile?.student && (
          <div className="p-4 bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Program</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.student.program}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Email</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.student.vitEmail ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Phone</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.student.mobile ?? "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Date of Birth</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.student.dob ?? "—"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Theme Preference ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-sky-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/75">
            Appearance
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground">Visual Theme</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">
              Switch between light, dark, and system themes.
            </p>
          </div>

          <DrawerSelect
            value={theme}
            onValueChange={(val) => setTheme(val as any)}
            title="Visual Theme"
            triggerClassName="w-[120px] h-9"
            options={[
              { value: "light", label: <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> Light</span> },
              { value: "dark", label: <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Dark</span> },
              { value: "system", label: <span className="flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5" /> System</span> },
            ]}
          />
        </div>
      </div>

      {/* ── Active Semester ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-sky-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/75">
            Academic Settings
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground">Active Semester</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">
              Select the default semester used across dashboard listings.
            </p>
            {semesterError && (
              <p className="text-[10px] text-destructive mt-1 font-semibold">{semesterError}</p>
            )}
          </div>

          <DrawerSelect
            value={currentSemester?.id || ""}
            onValueChange={handleSemesterChange}
            disabled={!isOnline || semesterLoading || semesters.length === 0}
            title="Active Semester"
            triggerClassName="w-[130px] h-9"
            placeholder={!isOnline ? "Offline" : semesterLoading ? "Loading..." : "Select"}
            options={semesters.map((semester) => ({ value: semester.id, label: semester.name }))}
          />
        </div>
      </div>

      {/* ── Keyring / Credential Status ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground/75">
              Keyring Status
            </h2>
          </div>
          <button
            onClick={handleRefreshKeyring}
            disabled={credLoading || cookiesLoading}
            className="p-1.5 rounded-xl bg-muted/20 hover:bg-muted/30 border border-border/10 cursor-pointer disabled:opacity-40 transition-colors"
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

        <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl divide-y divide-border/10 overflow-hidden">
          {credItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-wider leading-none">
                    {item.label}
                  </p>
                  {item.loading ? (
                    <Sk className="h-3.5 w-36 mt-1.5" />
                  ) : (
                    <p className="text-xs font-semibold text-foreground truncate mt-1 leading-none">
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

        <p className="text-[10px] text-muted-foreground/50 leading-relaxed px-1 font-medium">
          Credentials are stored in your device's secure system keyring. Session cookies are held in memory and refreshed automatically on re-login.
        </p>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={() => logout()}
          className="w-full h-11 flex justify-center items-center gap-2 bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/20 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
