import DashboardSidebar from "@/components/DashBoardSideBar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-full bg-background text-foreground w-full">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}