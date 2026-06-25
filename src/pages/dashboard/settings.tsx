import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "@/router";

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
  Loader2,
  ExternalLink
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { showNotification } from "@/lib/notifications";
import { invoke } from "@tauri-apps/api/core";

export default function SettingsPage() {
  const { isLoggedIn, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [hostelBlock, setHostelBlock] = useState<LaundryBlock>("A");
  
  // Software Update States
  const [currentVersion, setCurrentVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "upToDate" | "available" | "downloading" | "finished" | "error">("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ downloaded: number; total?: number; percent?: number } | null>(null);
  const [activeUpdate, setActiveUpdate] = useState<any>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  // null = unknown, true = AppImage, false = rpm/deb/other
  const [isAppImage, setIsAppImage] = useState<boolean | null>(null);

  // Load version and detect install format on mount
  useEffect(() => {
    async function loadVersion() {
      try {
        const ver = await getVersion();
        setCurrentVersion(ver);
      } catch (err) {
        console.warn("Failed to get app version:", err);
      }
    }
    async function detectInstallFormat() {
      try {
        // get_current_exe returns the path of the running binary
        const exePath = await invoke<string>("plugin:os|exe").catch(() => null)
          ?? await invoke<string>("get_exe_path").catch(() => null);
        if (exePath) {
          setIsAppImage(exePath.toLowerCase().endsWith(".appimage"));
        } else {
          // Fallback: check the env variable AppImage sets
          setIsAppImage(!!(import.meta.env.APPIMAGE || ('APPIMAGE' in ((window as any).__TAURI_INTERNALS__ ?? {}))));
        }
      } catch {
        // If detection fails, assume it could be AppImage (don't block)
        setIsAppImage(null);
      }
    }
    loadVersion();
    detectInstallFormat();
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
      
      await showNotification(
        "Update Installed",
        "Update installed successfully. Please restart Deskly to apply changes."
      );
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
    <>{children}</>
  );

  return shell(
    <div className="w-full space-y-8 px-2 sm:px-4">
      {/* Header */}
      <header className="pb-4 border-b border-border/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary shrink-0" />
            Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure application preferences, active semester, and hostel settings.
          </p>
        </div>
      </header>

      {/* Grid Layout - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Preferences */}
        <div className="space-y-6">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-border/10 pb-2 mb-2">
              Preferences
            </h2>
            <div className="divide-y divide-border/10">
              
              {/* Theme Settings Row */}
              <div className="py-4.5 flex items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                  <SunMoon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">Theme Mode</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Toggle between light and dark visual themes.
                    </p>
                  </div>
                </div>
                <ModeToggle />
              </div>

              {/* Academic Settings Row */}
              <div className="py-4.5 flex items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">Active Semester</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Select active semester for grades, timetable, and marks.
                    </p>
                  </div>
                </div>
                <Select
                  value={selectedSemester?.id || ""}
                  onValueChange={handleSemesterChange}
                  disabled={semesters.length === 0}
                >
                  <SelectTrigger className="w-[160px] h-8 rounded-lg bg-muted/20 hover:bg-muted/30 border-border/20 text-[11px] focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-border/20 bg-popover/95 backdrop-blur-md">
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-md text-[11px]">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hostel Block Selection Row */}
              <div className="py-4.5 flex items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">Hostel Block</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Set hostel block for laundry calendar views.
                    </p>
                  </div>
                </div>
                <Select value={hostelBlock} onValueChange={handleBlockChange}>
                  <SelectTrigger className="w-[100px] h-8 rounded-lg bg-muted/20 hover:bg-muted/30 border-border/20 text-[11px] focus:ring-1 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-border/20 bg-popover/95 backdrop-blur-md">
                    {LAUNDRY_BLOCKS.map((b) => (
                      <SelectItem key={b} value={b} className="rounded-lg text-[11px]">
                        Block {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Maintenance & Account */}
        <div className="space-y-6">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-border/10 pb-2 mb-2">
              System & Operations
            </h2>
            <div className="divide-y divide-border/10">
              
              {/* Software Update Row */}
              <div className="py-4.5 space-y-3">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-start gap-3">
                    <ArrowUpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">Software Update</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {updateStatus === "idle" && `Current version: v${currentVersion}`}
                        {updateStatus === "checking" && "Checking for updates..."}
                        {updateStatus === "upToDate" && `System is up to date (v${currentVersion})`}
                        {updateStatus === "available" && `Update available! v${latestVersion} ready.`}
                        {updateStatus === "downloading" && `Downloading: ${downloadProgress?.percent ?? 0}%`}
                        {updateStatus === "finished" && "Restarting application..."}
                        {updateStatus === "error" && "Failed to check for updates."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    {/* Non-AppImage installs: show download link instead */}
                    {isAppImage === false ? (
                      <a
                        href="https://github.com/Vishal-770/deskly-tauri/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Download
                      </a>
                    ) : (
                      <>
                        {(updateStatus === "idle" || updateStatus === "upToDate" || updateStatus === "error") && (
                          <button
                            onClick={handleUpdateCheck}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-bold rounded-lg cursor-pointer transition-all"
                          >
                            Check
                          </button>
                        )}
                        {updateStatus === "checking" && (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-muted text-muted-foreground text-[11px] font-bold rounded-lg flex items-center gap-1.5"
                          >
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                            Checking
                          </button>
                        )}
                        {updateStatus === "available" && (
                          <button
                            onClick={handleInstallUpdate}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-bold rounded-lg cursor-pointer transition-all animate-pulse"
                          >
                            Install
                          </button>
                        )}
                        {updateStatus === "downloading" && (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-muted text-muted-foreground text-[11px] font-bold rounded-lg flex items-center gap-1.5"
                          >
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                            Downloading
                          </button>
                        )}
                        {updateStatus === "finished" && (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-muted text-muted-foreground text-[11px] font-bold rounded-lg"
                          >
                            Restarting
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Non-AppImage notice */}
                {isAppImage === false && (
                  <div className="pl-7 pt-1">
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                      Auto-update is only supported for AppImage installs. RPM/DEB users should download the new package manually from GitHub releases.
                    </p>
                  </div>
                )}

                {/* Inline Details */}
                {updateStatus === "available" && activeUpdate && activeUpdate.body && (
                  <div className="pl-7 pt-1">
                    <div className="p-3 bg-muted/10 border border-border/10 rounded-xl text-[10px] text-muted-foreground max-h-24 overflow-y-auto no-scrollbar font-medium">
                      <p className="font-bold text-foreground/80 mb-1">Release Notes:</p>
                      <p className="whitespace-pre-wrap leading-relaxed">{activeUpdate.body}</p>
                    </div>
                  </div>
                )}

                {updateStatus === "downloading" && downloadProgress && (
                  <div className="pl-7 pt-1 space-y-2">
                    <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress.percent ?? 0}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 font-semibold">
                      {downloadProgress.total 
                        ? `${(downloadProgress.downloaded / (1024 * 1024)).toFixed(2)} MB / ${(downloadProgress.total / (1024 * 1024)).toFixed(2)} MB`
                        : `${(downloadProgress.downloaded / (1024 * 1024)).toFixed(2)} MB downloaded`
                      }
                    </div>
                  </div>
                )}

                {updateStatus === "error" && updateError && (
                  <div className="pl-7 pt-1">
                    <p className="text-[10px] text-destructive bg-destructive/5 border border-destructive/10 p-2 rounded-xl font-semibold leading-relaxed">
                      {updateError}
                    </p>
                  </div>
                )}
              </div>

              {/* Legal & Privacy Policy Row */}
              <div className="py-4.5 flex items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">Legal &amp; Privacy Policy</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      View unofficial app disclaimers and data policies.
                    </p>
                  </div>
                </div>
                <Link
                  to="/legal"
                  className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold rounded-lg cursor-pointer border border-border/10 shrink-0"
                >
                  View
                </Link>
              </div>

              {/* Account Settings (Logout) Row */}
              <div className="py-4.5 flex items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                  <LogOut className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-semibold text-destructive">Sign Out</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Logout and clear saved credentials from device.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[11px] font-bold rounded-lg cursor-pointer shrink-0"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
  );
}
