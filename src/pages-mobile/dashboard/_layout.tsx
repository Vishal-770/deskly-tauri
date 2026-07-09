import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Link } from "@/router";
import type { Path } from "@/router";
import type { ElementType } from "react";
import { 
  LayoutDashboard,
  User,
  Home, 
  CalendarCheck, 
  Clock, 
  Menu, 
  BookOpen,
  Library,
  ClipboardList,
  TrendingUp,
  GraduationCap,
  Calendar,
  Utensils, 
  WashingMachine,
  Receipt,
  BookUser,
  Briefcase,
  Phone,
  Settings, 
  X 
} from "lucide-react";

export default function MobileDashboardLayout() {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  type NavItem = {
    label: string;
    path: Path;
    icon: ElementType;
  };

  const allNavItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Profile", path: "/dashboard/profile", icon: User },
    { label: "Attendance", path: "/dashboard/attendance", icon: CalendarCheck },
    { label: "Timetable", path: "/dashboard/timetable", icon: Clock },
    { label: "Courses", path: "/dashboard/courses", icon: BookOpen },
    { label: "Curriculum", path: "/dashboard/curriculum", icon: Library },
    { label: "Exams", path: "/dashboard/exams", icon: ClipboardList },
    { label: "Marks", path: "/dashboard/marks", icon: TrendingUp },
    { label: "Grades", path: "/dashboard/grades", icon: GraduationCap },
    { label: "Academic Calendar", path: "/dashboard/academic-calendar", icon: Calendar },
    { label: "Mess", path: "/dashboard/mess", icon: Utensils },
    { label: "Laundry", path: "/dashboard/laundry", icon: WashingMachine },
    { label: "Payment Receipts", path: "/dashboard/payment-receipts", icon: Receipt },
    { label: "Faculty Info", path: "/dashboard/faculty-info", icon: BookUser },
    { label: "HOD & Dean", path: "/dashboard/hod-dean", icon: Briefcase },
    { label: "Contact", path: "/dashboard/contact", icon: Phone },
    { label: "Settings", path: "/dashboard/settings", icon: Settings },
  ] as const;
  // Core dock navigation items (Home, Timetable + More)
  const coreNavItems: NavItem[] = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Timetable", path: "/dashboard/timetable", icon: Clock },
  ] as const;

  const corePaths: Set<string> = new Set(coreNavItems.map((item) => item.path));

  // Grid items inside the "More" bottom sheet
  const moreGridItems: NavItem[] = allNavItems.filter((item) => !corePaths.has(item.path));
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground select-none relative">
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-4 pb-16 px-4 bg-background">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] border-t border-border/10 bg-background/95 backdrop-blur-md flex items-center justify-around px-2 shrink-0 z-30">
        {coreNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path && !isMoreOpen;
          return (
            <Link
              key={item.path}
              to={item.path as any}
              onClick={() => setIsMoreOpen(false)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isActive 
                  ? "text-primary font-bold" 
                  : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all border-0 bg-transparent cursor-pointer ${
            isMoreOpen 
              ? "text-primary font-bold" 
              : "text-muted-foreground/60 hover:text-foreground"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">More</span>
        </button>
      </nav>

      {/* "More" Bottom Sheet Overlay */}
      {isMoreOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 flex flex-col justify-end transition-opacity duration-300">
          
          {/* Backdrop click close */}
          <div className="flex-1" onClick={() => setIsMoreOpen(false)} />

          {/* Drawer container */}
          <div className="bg-background border-t border-border/15 rounded-t-3xl p-6 space-y-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            
            {/* Header Handle Bar */}
            <div className="flex justify-between items-center pb-2">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">Explore Features</h3>
                <p className="text-[10px] text-muted-foreground">Select an academic view</p>
              </div>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 bg-muted/30 hover:bg-muted/50 rounded-full border-0 text-foreground cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of features */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-6 pt-2">
              {moreGridItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path as any}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      isActive 
                        ? "bg-primary/10 border-primary/20 text-primary" 
                        : "bg-muted/15 border-transparent hover:bg-muted/30 text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5 shrink-0" />
                    <span className="text-[10px] text-center font-bold tracking-tight leading-tight w-full truncate">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
