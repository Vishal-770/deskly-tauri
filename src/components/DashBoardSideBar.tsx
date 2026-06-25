import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  CalendarClock,
  UserCheck,
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
  Search,
} from "lucide-react";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";

const DashboardSidebar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  type NavItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
    description: string;
  };

  const navItems = useMemo<NavItem[]>(
    () => [
      // Group 1: Core Identity
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Profile",
        href: "/dashboard/profile",
        icon: <User className="w-5 h-5" />,
        description: "",
      },
      // Group 2: Academics
      {
        label: "Timetable",
        href: "/dashboard/timetable",
        icon: <CalendarClock className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Attendance",
        href: "/dashboard/attendance",
        icon: <UserCheck className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Courses",
        href: "/dashboard/courses",
        icon: <BookOpen className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Curriculum",
        href: "/dashboard/curriculum",
        icon: <Library className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Exams",
        href: "/dashboard/exams",
        icon: <ClipboardList className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Marks",
        href: "/dashboard/marks",
        icon: <TrendingUp className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Grades",
        href: "/dashboard/grades",
        icon: <GraduationCap className="w-5 h-5" />,
        description: "",
      },
      // Group 3: Campus Utilities & Finance
      {
        label: "Academic Calendar",
        href: "/dashboard/academic-calendar",
        icon: <Calendar className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Mess",
        href: "/dashboard/mess",
        icon: <Utensils className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Laundry",
        href: "/dashboard/laundry",
        icon: <WashingMachine className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Payment Receipts",
        href: "/dashboard/payment-receipts",
        icon: <Receipt className="w-5 h-5" />,
        description: "",
      },
      // Group 4: Support & Administration
      {
        label: "Faculty Info",
        href: "/dashboard/faculty-info",
        icon: <BookUser className="w-5 h-5" />,
        description: "",
      },
      {
        label: "HOD & Dean",
        href: "/dashboard/hod-dean",
        icon: <Briefcase className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Contact",
        href: "/dashboard/contact",
        icon: <Phone className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="w-5 h-5" />,
        description: "",
      },
    ],
    [],
  );

  const results = useMemo(() => {
    if (!query) return null;

    const fuse = new Fuse(navItems, {
      keys: ["label"],
      threshold: 0.4,
    });

    return fuse.search(query).map((r) => r.item);
  }, [query, navItems]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleNavigate = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(href);
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-full bg-card text-card-foreground py-4 border-r flex flex-col transition-all duration-300 ease-out z-40 select-none shrink-0 ${
          isHovered
            ? "w-60 items-start px-2"
            : "w-16 items-center px-0"
        }`}
      >
        {/* Search Button */}
        <div className="w-full flex justify-center mb-4 shrink-0 px-1">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className={`flex items-center gap-3 rounded-xl hover:bg-muted transition-all duration-200 ${
              isHovered ? "w-full px-3 py-3 justify-start" : "p-3 justify-center"
            }`}
          >
            <Search className="w-5 h-5 shrink-0" />
            {isHovered && (
              <span className="text-xs font-bold tracking-tight text-muted-foreground/60 whitespace-nowrap">
                Quick Search
              </span>
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1.5 flex-1 min-h-0 flex flex-col w-full overflow-y-auto no-scrollbar pb-4 px-1">
          {navItems.map((item) => {
            const active =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl hover:bg-muted transition-all duration-200 shrink-0 ${
                  isHovered ? "w-full px-3 py-3 justify-start" : "p-3 justify-center"
                } ${
                  active
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground/80 hover:text-foreground"
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {isHovered && (
                  <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 flex justify-center items-start pt-28 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative z-[70] w-full max-w-lg mx-4 bg-card/90 backdrop-blur-2xl p-10 rounded-[3rem] border border-border shadow-2xl desktop-shadow"
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-2 outline-none bg-transparent"
                placeholder="Search..."
              />

              <div className="mt-3 max-h-60 overflow-auto no-scrollbar">
                {results?.map((r) => (
                  <button
                    key={r.href}
                    onClick={() => handleNavigate(r.href)}
                    className="w-full text-left px-3 py-2 hover:bg-muted flex gap-2 rounded-xl"
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
