import { useEffect, useState } from "react";
import { useNavigate } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import { useSemester } from "@/hooks/useSemester";
import { type AuthTokens } from "@/lib/tauri-auth";
import { Divider } from "@/components/Divider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { authState, loading, logout, fetchTokens } = useAuth();
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

  useEffect(() => {
    const loadTokens = async () => {
      const currentTokens = await fetchTokens();
      setTokenState(currentTokens);
    };

    void loadTokens();
  }, [fetchTokens]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading || !authState?.loggedIn) {
    return (
      <main className="p-6 h-full flex items-center justify-center">
        Loading settings...
      </main>
    );
  }

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

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-12">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Deskly preferences.
          </p>
        </div>

        <button
          className="rounded-md bg-destructive/10 text-destructive px-4 py-2 hover:bg-destructive text-sm font-medium transition-colors hover:text-white"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <section className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-6 space-y-4 mt-6">
        <h2 className="font-medium text-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-background/40 p-3 rounded-lg border border-border/40">
            <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">
              Last Login
            </span>
            <span className="font-mono text-sm font-medium">
              {new Date(authState.lastLogin).toLocaleString()}
            </span>
          </div>
          <div className="bg-background/40 p-3 rounded-lg border border-border/40">
            <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">
              Session Status
            </span>
            <span className="font-mono text-sm font-medium text-green-500">
              {tokens ? "Active & Authenticated" : "Disconnected"}
            </span>
          </div>
        </div>
      </section>

      <Divider />

      <section className="space-y-4 text-foreground">
        <h2 className="text-2xl font-semibold">Preferences</h2>

        <div className="rounded-2xl border border-border bg-card/30 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">Interface Theme</p>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark mode.
              </p>
            </div>
            <ModeToggle />
          </div>

          <Divider />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">Selected Semester</p>
              <p className="text-sm text-muted-foreground">
                Marks and semester-scoped pages will use this by default.
              </p>
            </div>
            <button
              onClick={() => void refreshSemesters()}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
              disabled={semesterLoading}
            >
              Refresh
            </button>
          </div>

          <Select
            value={currentSemester?.id ?? "none"}
            onValueChange={(val) => handleSemesterChange(val === "none" ? "" : val)}
            disabled={semesterLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select semester</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            Current: {currentSemester?.name ?? "Not selected"}
          </p>

          {semesterError ? (
            <p className="text-xs text-destructive">{semesterError}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
