import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { TitleBar } from "@/components/TitleBar";
import { NoInternetOverlay } from "@/components/NoInternetOverlay";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function App() {
  const isOnline = useOnlineStatus();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NoInternetOverlay isOnline={isOnline} />
      <TitleBar />
      <div className="pt-8 h-screen w-full flex flex-col items-stretch overflow-x-hidden bg-background text-foreground">
        <ErrorBoundary>
          <div className="flex-1 min-h-0 w-full relative">
            {isOnline ? <Outlet /> : null}
          </div>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}


