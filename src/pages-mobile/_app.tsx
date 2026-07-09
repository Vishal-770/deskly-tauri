import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { NoInternetOverlay } from "@/components/NoInternetOverlay";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function MobileApp() {
  const isOnline = useOnlineStatus();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NoInternetOverlay isOnline={isOnline} />
      <div className="h-screen w-full flex flex-col items-stretch overflow-hidden bg-background text-foreground pt-[env(safe-area-inset-top)]">
        <ErrorBoundary>
          <div className="app-content-wrapper flex-1 min-h-0 w-full relative">
            {isOnline ? <Outlet /> : null}
          </div>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
