import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineDisplayProps {
  onRetry?: () => void;
}

export function OfflineDisplay({ onRetry }: OfflineDisplayProps) {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12 font-saira select-none my-auto">
      <div className="flex flex-col items-center justify-center max-w-sm w-full space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-card border border-border/40 flex items-center justify-center shadow-md shrink-0">
          <WifiOff className="w-10 h-10 text-muted-foreground" strokeWidth={1.75} />
        </div>

        <div className="space-y-2 min-w-0">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight leading-tight">You're Offline</h2>
          <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed px-2">
            No internet connection detected and no cached data is available. Reconnect and try again.
          </p>
        </div>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full max-w-[220px] h-11 rounded-2xl text-sm font-bold border-border/40 bg-card hover:bg-muted/30 text-foreground transition-colors gap-2.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Connection</span>
          </Button>
        )}
      </div>
    </div>
  );
}
