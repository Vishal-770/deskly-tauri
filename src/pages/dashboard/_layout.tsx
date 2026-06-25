import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/DashBoardSideBar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-6 sm:pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
