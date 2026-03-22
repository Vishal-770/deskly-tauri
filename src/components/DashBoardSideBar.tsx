import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Settings,
  Calendar,
  UserCheck,
  Target,
  ScrollText,
  Phone,
  Clock,
  Search,
  LayoutDashboard,
  Shirt,
  ChefHat,
  Receipt,
  User,
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
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Courses",
        href: "/dashboard/courses",
        icon: <BookOpen className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Timetable",
        href: "/dashboard/timetable",
        icon: <Clock className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Academic Calendar",
        href: "/dashboard/academic-calendar",
        icon: <Calendar className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Grades",
        href: "/dashboard/grades",
        icon: <GraduationCap className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Attendance",
        href: "/dashboard/attendance",
        icon: <UserCheck className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Marks",
        href: "/dashboard/marks",
        icon: <Target className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Curriculum",
        href: "/dashboard/curriculum",
        icon: <ScrollText className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Contact",
        href: "/dashboard/contact",
        icon: <Phone className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Laundry",
        href: "/dashboard/laundry",
        icon: <Shirt className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Mess",
        href: "/dashboard/mess",
        icon: <ChefHat className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Payment Receipts",
        href: "/dashboard/payment-receipts",
        icon: <Receipt className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="w-5 h-5" />,
        description: "",
      },
      {
        label: "Profile",
        href: "/dashboard/profile",
        icon: <User className="w-5 h-5" />,
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

  return (
    <>
      <div className="sticky top-0 w-16 h-full min-h-0 shrink-0 bg-card text-card-foreground py-4 border-r flex flex-col items-center z-40">
        {/* Search Button (Fixed) */}
        <div className="w-full flex justify-center mb-4 shrink-0">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className="p-3 rounded-lg hover:bg-muted"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items (Scrollable) */}
        <nav className="space-y-2 flex-1 min-h-0 flex flex-col items-center w-full overflow-y-auto no-scrollbar pb-4">
          {navItems.map((item) => {
            const active =
              location.pathname === item.href ||
              (item.href !== "/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`p-3 rounded-lg hover:bg-muted shrink-0 ${
                  active ? "bg-primary/20 text-primary" : ""
                }`}
              >
                {item.icon}
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
