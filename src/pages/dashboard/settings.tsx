import { useEffect, useState } from "react";
import { useNavigate, Link } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import { useSemester } from "@/hooks/useSemester";
import { useCredentialStatus } from "@/hooks/useCredentialStatus";
import { authGetTokens } from "@/lib/tauri-auth";
import { useTheme } from "@/components/theme-provider";
import {
  User,
  LogOut,
  KeyRound,
  Cookie,
  RefreshCw,
  AlertTriangle,
  Settings,
  Sun,
  Moon,
  Laptop,
  Scale,
  ChevronRight,
} from "lucide-react";
import { DrawerSelect } from "@/components/ui/drawer-select";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { useOnlineStatus } from "@/hooks/use-online-status";

// ─── Skeleton Helper ──────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/65 ${className}`} />;
}

function SettingsSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      {/* Header */}
      <div className="space-y-1">
        <Sk className="h-7 w-32" />
      </div>

      {/* Preferences list skeleton */}
      <div className="space-y-3">
        <Sk className="h-3 w-24" />
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          <div className="py-4 flex justify-between items-center">
            <div className="space-y-1.5">
              <Sk className="h-4 w-28" />
              <Sk className="h-3 w-48" />
            </div>
            <Sk className="h-9 w-28 rounded-md shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileSettings() {
  const { authState, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentSemester, semesters, loading: semesterLoading, error: semesterError, setSemester } = useSemester();
  const { theme, setTheme } = useTheme();

  // Keyring / credential status
  const { status: credStatus, loading: credLoading, error: credError, refresh: refreshCred } = useCredentialStatus();

  const isOnline = useOnlineStatus();

  // Session token (cookie) status
  const [hasCookies, setHasCookies] = useState<boolean | null>(null);
  const [cookiesLoading, setCookiesLoading] = useState(true);

  // Logout confirmation drawer state
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

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
      icon: <User className="w-4 h-4 text-muted-foreground/30" />,
      label: "Username / Reg No",
      value: credStatus?.userId ?? null,
      stored: credStatus ? !!credStatus.userId : null,
      loading: credLoading,
    },
    {
      icon: <KeyRound className="w-4 h-4 text-muted-foreground/30" />,
      label: "Password (Keyring)",
      value: credStatus?.hasPasswordStored ? "Stored securely in system keyring" : "Not stored",
      stored: credStatus ? credStatus.hasPasswordStored : null,
      loading: credLoading,
    },
    {
      icon: <Cookie className="w-4 h-4 text-muted-foreground/30" />,
      label: "Session Cookies",
      value: hasCookies ? "Active session tokens present" : "No session cookies stored",
      stored: hasCookies,
      loading: cookiesLoading,
    },
  ];

  if (authLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <Settings className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-none">
          Settings
        </h1>
      </header>

      {/* ── Profile Section ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 py-4 border-t border-b border-border/10">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground truncate">
              Student
            </h2>
            <p className="text-xs text-primary uppercase tracking-wide font-semibold mt-0.5">
              {authState?.userId ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Preferences ─────────────────────────────────────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest leading-none">
            Preferences
          </h2>
        </div>

        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {/* Theme Row */}
          <div className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">Visual Theme</h3>
              <p className="text-xs text-muted-foreground/50 mt-1 leading-relaxed">
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

          {/* Semester Row */}
          <div className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">Active Semester</h3>
              <p className="text-xs text-muted-foreground/50 mt-1 leading-relaxed">
                Select the default semester used across dashboard listings.
              </p>
              {semesterError && (
                <p className="text-xs text-destructive mt-1 font-semibold">{semesterError}</p>
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
      </section>

      {/* ── Keyring Status ─────────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest leading-none">
              Keyring Status
            </h2>
          </div>
          <button
            onClick={handleRefreshKeyring}
            disabled={credLoading || cookiesLoading}
            className="p-1.5 rounded-md bg-muted/20 hover:bg-muted/30 border border-border/10 cursor-pointer disabled:opacity-40 transition-colors"
            title="Refresh keyring status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${(credLoading || cookiesLoading) ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Keyring error banner */}
        {(credError || credStatus?.keyringError) && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/15 rounded-md text-xs text-destructive font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{credError ?? credStatus?.keyringError}</span>
          </div>
        )}

        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {credItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider leading-none">
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
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black shrink-0 ${
                    item.stored
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-destructive/10 text-destructive border border-destructive/15"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.stored ? "bg-primary" : "bg-destructive"}`} />
                  {item.stored ? "Stored" : "Missing"}
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/50 leading-relaxed px-1 font-medium">
          Credentials are stored securely in your device's native keyring. Session cookies are held in memory and refreshed automatically.
        </p>
      </div>

      {/* Legal Link */}
      <Link
        to="/legal"
        className="flex items-center justify-between py-3 px-1 text-muted-foreground hover:text-foreground transition-colors border-t border-border/10"
      >
        <div className="flex items-center gap-3">
          <Scale className="w-4 h-4 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Legal &amp; Privacy</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">View disclaimers and data policies</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/40" />
      </Link>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full h-11 flex justify-center items-center gap-2 bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/20 text-sm font-semibold rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Sign Out Confirmation Drawer */}
      <Drawer open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen} showSwipeHandle>
        <DrawerContent className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-background border-t border-border/10 rounded-t-[32px] flex flex-col font-saira max-h-[85vh]">
          {/* Header */}
          <div className="flex items-start gap-4 pt-2 pb-6 shrink-0 border-b border-border/5">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-base font-bold text-foreground tracking-tight leading-none">Sign Out</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to sign out? Your cached student data will be cleared from this device.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-5 shrink-0">
            <button
              onClick={async () => {
                setIsLogoutConfirmOpen(false);
                try {
                  await logout();
                } catch (e) {
                  console.error("Logout error:", e);
                } finally {
                  navigate("/");
                }
              }}
              className="w-full h-11 flex justify-center items-center bg-destructive text-destructive-foreground text-sm font-semibold rounded-md active:opacity-90 transition-opacity cursor-pointer border-0"
            >
              Sign Out
            </button>
            <DrawerClose className="w-full h-11 flex justify-center items-center bg-muted text-muted-foreground text-sm font-semibold rounded-md cursor-pointer border-0 hover:bg-muted/80 focus:outline-none transition-colors">
              Cancel
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
