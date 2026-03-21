import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { TitleBar } from "@/components/TitleBar";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TitleBar />
      <div className="pt-8 h-screen w-full flex flex-col items-stretch overflow-x-hidden bg-background text-foreground">
        <ErrorBoundary>
          <div className="flex-1 min-h-0 w-full relative">
            <Outlet />
          </div>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
