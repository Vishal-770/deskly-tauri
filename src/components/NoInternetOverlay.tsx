import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function NoInternetOverlay({ isOnline }: { isOnline: boolean }) {

  const [isChecking, setIsChecking] = useState(false);

  const handleCheckConnection = () => {
    setIsChecking(true);
    // Simulate a check
    setTimeout(() => {
      setIsChecking(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed top-8 inset-x-0 bottom-0 z-[40] flex flex-col bg-background text-foreground overflow-y-auto"
        >
          {/* Minimalist Background */}
          <div className="absolute inset-0 bg-background pointer-events-none" />

          {/* Centered Content - Natural Flow */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 relative z-10 mx-auto w-full max-w-md">
            
            {/* Elegant Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-secondary/30 p-8 rounded-3xl border border-border/40"
            >
              <WifiOff className="w-12 h-12 text-primary/70" strokeWidth={1} />
            </motion.div>

            {/* Typography */}
            <div className="space-y-4">
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                Connection Lost
              </h1>
              <p className="text-sm text-muted-foreground/80 leading-relaxed px-4">
                Please check your network settings. Deskly will reconnect automatically when a signal is detected.
              </p>
            </div>

            {/* Simple Action */}
            <div className="pt-4 w-full">
              <Button 
                onClick={handleCheckConnection}
                disabled={isChecking}
                variant="outline"
                className="w-full max-w-[240px] h-12 rounded-2xl text-sm font-medium border-border hover:bg-secondary/80 transition-all duration-300"
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Retrying...' : 'Retry Connection'}
              </Button>
            </div>

            {/* Minimalist Branding */}
            <div className="pt-8 opacity-20 select-none">
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase">
                Infrastructure Offline
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
