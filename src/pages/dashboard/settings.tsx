import { useEffect, useState } from "react";
import { useNavigate } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import { useCredentialStatus } from "@/hooks/useCredentialStatus";
import { useSemester } from "@/hooks/useSemester";
import { type AuthTokens } from "@/lib/tauri-auth";
import { getVersion } from "@tauri-apps/api/app";
import {
  check,
  type DownloadEvent,
  type Update as TauriUpdate,
} from "@tauri-apps/plugin-updater";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  LogOut,
  ShieldCheck,
  Monitor,
  RefreshCw,
  CalendarDays,
  User as UserIcon,
  CircleCheck,
  CircleAlert,
  Clock,
  Layers,
  ArrowDownToLine,
  RotateCcw,
  Download,
} from "lucide-react";
import Loader from "@/components/Loader";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { authState, loading, logout, fetchTokens } = useAuth();
  const {
    status: credentialStatus,
    loading: credentialLoading,
    error: credentialError,
    refresh: refreshCredentialStatus,
  } = useCredentialStatus();
  const {
    currentSemester,
    semesters,
    loading: semesterLoading,
    error: semesterError,
    setSemester,
    clearSemester,
    refresh: refreshSemesters,
  } = useSemester();
  const [tokens, setTokenState] = useState<AuthTokens | null>(null);
  const [appVersion, setAppVersion] = useState<string>("...");
  const [osLabel, setOsLabel] = useState<string>("Desktop");
  const [updateStatus, setUpdateStatus] = useState<
    | "idle"
    | "checking"
    | "available"
    | "downloading"
    | "downloaded"
    | "installing"
    | "not-available"
    | "error"
  >("idle");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    notes?: string;
    date?: string;
  } | null>(null);
  const [updateArtifact, setUpdateArtifact] = useState<TauriUpdate | null>(
    null,
  );
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [contentLength, setContentLength] = useState(0);

  useEffect(() => {
    const loadTokens = async () => {
      const currentTokens = await fetchTokens();
      setTokenState(currentTokens);
    };

    void loadTokens();
  }, [fetchTokens]);

  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const version = await getVersion();
        setAppVersion(version);
      } catch {
        setAppVersion("unknown");
      }

      const platform = navigator.platform.toLowerCase();
      if (platform.includes("win")) {
        setOsLabel("Windows");
      } else if (platform.includes("mac")) {
        setOsLabel("macOS");
      } else if (platform.includes("linux")) {
        setOsLabel("Linux");
      }
    };

    void loadAppInfo();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleCheckForUpdates = async () => {
    setUpdateStatus("checking");
    setUpdateError(null);
    setDownloadedBytes(0);
    setContentLength(0);

    try {
      const update = await check();
      if (!update) {
        setUpdateArtifact(null);
        setUpdateInfo(null);
        setUpdateStatus("not-available");
        return;
      }

      setUpdateArtifact(update);
      setUpdateInfo({
        version: update.version,
        notes: update.body,
        date: update.date,
      });
      setUpdateStatus("available");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setUpdateError(message);
      setUpdateStatus("error");
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateArtifact) {
      return;
    }

    setUpdateStatus("downloading");
    setUpdateError(null);
    setDownloadedBytes(0);
    setContentLength(0);

    try {
      await updateArtifact.download((event: DownloadEvent) => {
        switch (event.event) {
          case "Started":
            setContentLength(event.data.contentLength ?? 0);
            setDownloadedBytes(0);
            break;
          case "Progress":
            setDownloadedBytes((prev) => prev + event.data.chunkLength);
            break;
          case "Finished":
            break;
        }
      });
      setUpdateStatus("downloaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setUpdateError(message);
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateArtifact) {
      return;
    }

    setUpdateStatus("installing");
    setUpdateError(null);

    try {
      await updateArtifact.install();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setUpdateError(message);
      setUpdateStatus("error");
    }
  };

  const handleSemesterChange = async (semesterId: string) => {
    if (!semesterId) {
      await clearSemester();
      return;
    }

    const selected = semesters.find((semester) => semester.id === semesterId);
    if (!selected) {
      return;
    }

    await setSemester(selected);
  };

  if (loading || !authState?.loggedIn) {
    return <Loader />;
  }

  const hasStorageError = Boolean(credentialStatus?.keyringError);
  const isPasswordStored = Boolean(credentialStatus?.hasPasswordStored);
  const downloadProgress =
    contentLength > 0
      ? Math.min(100, Math.round((downloadedBytes / contentLength) * 100))
      : 0;
  const isBusy =
    updateStatus === "checking" ||
    updateStatus === "downloading" ||
    updateStatus === "installing";

  return (
    <div className="p-6 space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account, preferences, and system configuration.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="rounded-xl px-4 flex items-center gap-2 h-10 desktop-shadow"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column - Preferences & System */}
        <div className="xl:col-span-8 space-y-8">
          {/* Preferences Section */}
          <Card className="border-border bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden desktop-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Settings className="w-5 h-5" />
                <CardTitle className="text-xl">Preferences</CardTitle>
              </div>
              <CardDescription>
                Customize your interface and academic settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/20 border border-border/40">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <p className="font-semibold text-sm">Interface Theme</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Switch between light and dark mode appearance.
                  </p>
                </div>
                <ModeToggle />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-sm">Academic Semester</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select the default semester for marks and attendance.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void refreshSemesters()}
                    disabled={semesterLoading}
                    className="h-8 gap-2 text-xs text-muted-foreground hover:text-primary rounded-lg"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${semesterLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>

                <div className="space-y-3">
                  <Select
                    value={currentSemester?.id ?? "none"}
                    onValueChange={(val) =>
                      handleSemesterChange(val === "none" ? "" : val)
                    }
                    disabled={semesterLoading}
                  >
                    <SelectTrigger className="w-full h-11 bg-background/40 rounded-xl border-border/60">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                      <SelectItem value="none">Select semester</SelectItem>
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {currentSemester && (
                    <div className="flex items-center gap-2 px-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-2 bg-primary/5 text-primary border-primary/20"
                      >
                        Selected: {currentSemester.name}
                      </Badge>
                    </div>
                  )}

                  {semesterError && (
                    <p className="text-xs text-destructive px-1 flex items-center gap-1">
                      <CircleAlert className="w-3 h-3" />
                      {semesterError}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info Section */}
          <Card className="border-border bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden desktop-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Layers className="w-5 h-5" />
                <CardTitle className="text-xl">Application Info</CardTitle>
              </div>
              <CardDescription>
                Current version and software details.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 bg-background/20 rounded-xl border border-border/40 space-y-1">
                  <span className="text-muted-foreground uppercase tracking-tight">
                    Version
                  </span>
                  <p className="font-semibold text-foreground">v{appVersion}</p>
                </div>
                <div className="p-3 bg-background/20 rounded-xl border border-border/40 space-y-1">
                  <span className="text-muted-foreground uppercase tracking-tight">
                    OS
                  </span>
                  <p className="font-semibold text-foreground capitalize">
                    {osLabel}
                  </p>
                </div>
                <div className="p-3 bg-background/20 rounded-xl border border-border/40 space-y-1">
                  <span className="text-muted-foreground uppercase tracking-tight">
                    Platform
                  </span>
                  <p className="font-semibold text-foreground">Tauri / Vite</p>
                </div>
              </div>

              <div className="mt-5 p-4 rounded-xl border border-border/50 bg-background/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">App Updates</p>
                    <p className="text-xs text-muted-foreground">
                      Check and install new releases without downloading
                      manually.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {updateStatus === "idle" && "Idle"}
                    {updateStatus === "checking" && "Checking"}
                    {updateStatus === "available" && "Update Found"}
                    {updateStatus === "downloading" &&
                      `Downloading ${downloadProgress}%`}
                    {updateStatus === "downloaded" && "Ready to Install"}
                    {updateStatus === "installing" && "Installing"}
                    {updateStatus === "not-available" && "Up to Date"}
                    {updateStatus === "error" && "Error"}
                  </Badge>
                </div>

                {updateInfo && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Latest version:{" "}
                      <span className="text-foreground font-medium">
                        v{updateInfo.version}
                      </span>
                    </p>
                    {updateInfo.date && (
                      <p>
                        Published: {new Date(updateInfo.date).toLocaleString()}
                      </p>
                    )}
                    {updateInfo.notes && (
                      <p className="line-clamp-3">Notes: {updateInfo.notes}</p>
                    )}
                  </div>
                )}

                {updateError && (
                  <p className="text-xs text-destructive">{updateError}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => void handleCheckForUpdates()}
                    disabled={isBusy}
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 ${updateStatus === "checking" ? "animate-spin" : ""}`}
                    />
                    Check for Updates
                  </Button>

                  {updateStatus === "available" && (
                    <Button
                      size="sm"
                      className="h-8"
                      variant="secondary"
                      onClick={() => void handleDownloadUpdate()}
                      disabled={isBusy}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  )}

                  {updateStatus === "downloaded" && (
                    <Button
                      size="sm"
                      className="h-8"
                      variant="default"
                      onClick={() => void handleInstallUpdate()}
                      disabled={isBusy}
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Install Update
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Account & Status */}
        <div className="xl:col-span-4 space-y-8">
          {/* Account Card */}
          <Card className="border-border bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden desktop-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary">
                <UserIcon className="w-5 h-5" />
                <CardTitle className="text-lg">Account Session</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-background/20 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Last Login
                    </div>
                  </div>
                  <p className="text-sm font-medium font-mono leading-none">
                    {new Date(authState.lastLogin).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-background/20 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserIcon className="w-3.5 h-3.5" />
                      Username
                    </div>
                  </div>
                  <p className="text-sm font-medium font-mono leading-none break-all">
                    {credentialStatus?.userId ?? authState.userId}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border transition-colors ${tokens ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"} space-y-3 mt-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Security Status
                    </div>
                    <Badge
                      className={
                        tokens
                          ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                          : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                      }
                    >
                      {tokens ? "Encrypted" : "Expired"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {tokens ? (
                      <CircleCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <CircleAlert className="w-4 h-4 text-destructive" />
                    )}
                    {tokens ? "Active & Authenticated" : "Session Expired"}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    isPasswordStored
                      ? "bg-green-500/5 border-green-500/20"
                      : hasStorageError
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-destructive/5 border-destructive/20"
                  } space-y-3 mt-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Stored Password
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void refreshCredentialStatus()}
                        disabled={credentialLoading}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${credentialLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                      {!credentialLoading && (
                        <Badge
                          className={
                            isPasswordStored
                              ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                              : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                          }
                        >
                          {isPasswordStored
                            ? "Stored"
                            : hasStorageError
                              ? "Storage Error"
                              : "Not Stored"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    {credentialLoading ? (
                      "Checking secure credential store..."
                    ) : isPasswordStored ? (
                      <>
                        <CircleCheck className="w-4 h-4 text-green-500" />
                        Password is securely stored in keyring
                      </>
                    ) : hasStorageError ? (
                      <>
                        <CircleAlert className="w-4 h-4 text-destructive" />
                        Storage Error: unable to access keyring
                      </>
                    ) : (
                      <>
                        <CircleAlert className="w-4 h-4 text-destructive" />
                        Password is not available in keyring
                      </>
                    )}
                  </div>

                  {credentialStatus?.keyringError && (
                    <p className="text-xs text-destructive wrap-break-word">
                      {credentialStatus.keyringError}
                    </p>
                  )}

                  {credentialError && (
                    <p className="text-xs text-destructive">
                      {credentialError}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-primary/10 bg-primary/5 rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-2">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2 italic">
                Tip!
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                Select your current semester to see relevant grades and
                attendance instantly across the dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
