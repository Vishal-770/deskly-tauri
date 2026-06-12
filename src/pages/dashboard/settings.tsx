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
import { Settings, Calendar, Building, LogOut, SunMoon, ArrowUpCircle, Scale } from "lucide-react";
import { checkForUpdates } from "@/lib/updater";

export default function SettingsPage() {
  const { isLoggedIn, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [hostelBlock, setHostelBlock] = useState<LaundryBlock>("A");
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleUpdateCheck = async () => {
    setCheckingUpdate(true);
    await checkForUpdates(false);
    setCheckingUpdate(false);
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
        <div className="bg-card/30 border border-border/25 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Software Update</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Check for new versions of Deskly and install updates
              </p>
            </div>
          </div>
          <button
            onClick={handleUpdateCheck}
            disabled={checkingUpdate}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {checkingUpdate ? "Checking..." : "Check for Update"}
          </button>
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
