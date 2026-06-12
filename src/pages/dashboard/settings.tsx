import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "@/router";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ModeToggle } from "@/components/theme-toggle";
import {
  Semester,
  authGetSemester,
  authSetSemester,
  authGetSemesters,
} from "@/lib/tauri-auth";
import { LAUNDRY_BLOCKS, LaundryBlock } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  Calendar, 
  Building, 
  LogOut, 
  SunMoon, 
  ArrowUpCircle, 
  Scale,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";

export default function SettingsPage() {
  const { isLoggedIn, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [hostelBlock, setHostelBlock] = useState<LaundryBlock>("A");
  
  // Software Update States
  const [currentVersion, setCurrentVersion] = useState("1.0.6");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "upToDate" | "available" | "downloading" | "finished" | "error">("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ downloaded: number; total?: number; percent?: number } | null>(null);
  const [activeUpdate, setActiveUpdate] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Load version on mount
  useEffect(() => {
    async function loadVersion() {
      try {
        const ver = await getVersion();
        setCurrentVersion(ver);
      } catch (err) {
        console.warn("Failed to get app version:", err);
      }
    }
    loadVersion();
  }, []);

  const handleUpdateCheck = async () => {
    setUpdateStatus("checking");
    setUpdateError(null);
    try {
      const update = await check();
      if (!update) {
        setUpdateStatus("upToDate");
        return;
      }
      setLatestVersion(update.version);
      setActiveUpdate(update);
      setUpdateStatus("available");
    } catch (err) {
      console.error("Failed to check for updates:", err);
      setUpdateError(err instanceof Error ? err.message : String(err));
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    if (!activeUpdate) return;
    setUpdateStatus("downloading");
    setDownloadProgress({ downloaded: 0 });
    
    let downloadedBytes = 0;
    let totalBytes: number | undefined = undefined;

    try {
      await activeUpdate.downloadAndInstall((event: any) => {
        if (event.event === "Started") {
          totalBytes = event.data.contentLength;
          setDownloadProgress({ downloaded: 0, total: totalBytes, percent: 0 });
        } else if (event.event === "Progress") {
          downloadedBytes += event.data.chunkLength;
          const percent = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : undefined;
          setDownloadProgress({ downloaded: downloadedBytes, total: totalBytes, percent });
        } else if (event.event === "Finished") {
          setUpdateStatus("finished");
        }
      });
      
      try {
        // @ts-ignore
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      } catch {
        alert("Update installed successfully. Please restart Deskly manually to apply changes.");
      }
    } catch (err) {
      console.error("Failed to download and install update:", err);
      setUpdateError(err instanceof Error ? err.message : String(err));
      setUpdateStatus("error");
    }
  };

  // Redirect to login if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, authLoading, navigate]);

  // Load configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        const list = await authGetSemesters();
        setSemesters(list || []);

        const active = await authGetSemester();
        setSelectedSemester(active);

        const savedBlock = localStorage.getItem("deskly::settings::hostelBlock");
        if (savedBlock) {
          setHostelBlock(savedBlock as LaundryBlock);
        }
      } catch (err) {
        console.error("Failed to load settings configuration:", err);
      }
    }
    if (isLoggedIn) {
      loadConfig();
    }
  }, [isLoggedIn]);

  const handleSemesterChange = async (semId: string) => {
    const sem = semesters.find((s) => s.id === semId);
    if (sem) {
      try {
        await authSetSemester(sem);
        setSelectedSemester(sem);
      } catch (err) {
        console.error("Failed to set semester:", err);
      }
    }
  };

  const handleBlockChange = (val: string) => {
    setHostelBlock(val as LaundryBlock);
    localStorage.setItem("deskly::settings::hostelBlock", val);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  return shell(
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <header className="pb-4 border-b border-border/20">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary shrink-0" />
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure your app preferences, academic active semester, and hostel settings
        </p>
      </header>

      <div className="space-y-4">
        {/* Theme Settings Card */}
        <div className="bg-card/30 border border-border/25 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SunMoon className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Theme Mode</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Toggle between light and dark mode
              </p>
            </div>
          </div>
          <ModeToggle />
        </div>

        {/* Software Update Card */}
        <div className="bg-card/30 border border-border/25 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-foreground">Software Update</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Current Version: v{currentVersion}
                </p>
              </div>
            </div>
            {(updateStatus === "idle" || updateStatus === "upToDate" || updateStatus === "error") && (
              <button
                onClick={handleUpdateCheck}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Check for Updates
              </button>
            )}
            {updateStatus === "checking" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Checking...</span>
              </div>
            )}
            {updateStatus === "upToDate" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-chart-2 bg-chart-2/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Latest
                </span>
              </div>
            )}
            {updateStatus === "error" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Error
                </span>
              </div>
            )}
          </div>

          {/* New Update Available State */}
          {updateStatus === "available" && activeUpdate && (
            <div className="pt-2 border-t border-border/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-foreground">
                    New Update Available: v{latestVersion}
                  </h3>
                  {activeUpdate.date && (
                    <p className="text-[10px] text-muted-foreground/60 font-semibold mt-0.5">
                      Released on {new Date(activeUpdate.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleInstallUpdate}
                  className="px-4 py-2 bg-chart-2 text-white hover:bg-chart-2/90 transition-all text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-chart-2/10 animate-pulse"
                >
                  Install Update
                </button>
              </div>
              {activeUpdate.body && (
                <div className="p-3 bg-muted/20 border border-border/10 rounded-xl text-[11px] text-muted-foreground max-h-24 overflow-y-auto no-scrollbar font-medium">
                  <p className="font-bold text-foreground/80 mb-1">Release Notes:</p>
                  <p className="whitespace-pre-wrap">{activeUpdate.body}</p>
                </div>
              )}
            </div>
          )}

          {/* Downloading State */}
          {updateStatus === "downloading" && downloadProgress && (
            <div className="pt-2 border-t border-border/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Downloading update package...
                </span>
                <span className="text-foreground tabular-nums">
                  {downloadProgress.percent !== undefined ? `${downloadProgress.percent}%` : ""}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress.percent ?? 0}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 font-semibold">
                <span>
                  {downloadProgress.total 
                    ? `${(downloadProgress.downloaded / (1024 * 1024)).toFixed(2)} MB / ${(downloadProgress.total / (1024 * 1024)).toFixed(2)} MB`
                    : `${(downloadProgress.downloaded / (1024 * 1024)).toFixed(2)} MB downloaded`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Finished State */}
          {updateStatus === "finished" && (
            <div className="pt-2 border-t border-border/10 flex items-center gap-3 text-xs font-bold text-chart-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Update downloaded and installed successfully! Restarting application...</span>
            </div>
          )}

          {/* Error Details */}
          {updateStatus === "error" && updateError && (
            <p className="text-[10px] text-destructive bg-destructive/5 border border-destructive/10 p-2.5 rounded-xl font-bold uppercase tracking-wider">
              {updateError}
            </p>
          )}
        </div>

        {/* Academic Settings (Semester Selection) Card */}
        <div className="bg-card/30 border border-border/25 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Active Semester</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Select the default semester for grades, timetable, and marks
              </p>
            </div>
          </div>
          <Select
            value={selectedSemester?.id || ""}
            onValueChange={handleSemesterChange}
            disabled={semesters.length === 0}
          >
            <SelectTrigger className="w-[180px] h-9 rounded-xl bg-muted/20 hover:bg-muted/30 border-border/20 text-xs focus:ring-1 focus:ring-primary/30">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/20 bg-popover/95 backdrop-blur-md">
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id} className="rounded-lg text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hostel Block Selection Card */}
        <div className="bg-card/30 border border-border/25 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Hostel Block</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Set your hostel block for the laundry calendar default view
              </p>
            </div>
          </div>
          <Select value={hostelBlock} onValueChange={handleBlockChange}>
            <SelectTrigger className="w-[120px] h-9 rounded-xl bg-muted/20 hover:bg-muted/30 border-border/20 text-xs focus:ring-1 focus:ring-primary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/20 bg-popover/95 backdrop-blur-md">
              {LAUNDRY_BLOCKS.map((b) => (
                <SelectItem key={b} value={b} className="rounded-lg text-xs">
                  Block {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legal & Privacy Policy Card */}
        <div className="bg-card/30 border border-border/25 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Legal & Privacy Policy</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                View unofficial app disclaimers, data source attribution, and privacy policies
              </p>
            </div>
          </div>
          <Link
            to="/legal"
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground transition-all text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center justify-center"
          >
            View Policy
          </Link>
        </div>

        {/* Account Settings (Logout) Card */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-destructive">Sign Out</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Logout of your VTOP session and clear saved session tokens
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/95 transition-all text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-destructive/10"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>,
  );
}
