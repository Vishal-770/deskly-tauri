import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"

export default function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <ErrorBoundary>
                <Outlet />
            </ErrorBoundary>
        </ThemeProvider>
    );
}