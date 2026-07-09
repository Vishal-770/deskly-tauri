import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineDisplayProps {
  onRetry?: () => void;
}

export function OfflineDisplay({ onRetry }: OfflineDisplayProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 font-saira select-none">
      <div className="text-center max-w-sm mx-auto space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8 text-sky-400" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">You're Offline</h2>
          <p className="text-sm text-muted-foreground/80 leading-relaxed px-2">
            No internet connection detected and no cached data is available for this page. Reconnect and try again.
          </p>
        </div>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full max-w-[200px] h-10 rounded-xl text-xs font-semibold border-border/10 bg-muted/20 hover:bg-muted/30 transition-all gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Connection
          </Button>
        )}
      </div>
    </div>
  );
}
