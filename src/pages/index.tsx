import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import { User, LogIn, HelpCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const { authState, loading, error, login } = useAuth();
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authState?.loggedIn) {
      navigate("/dashboard");
    }
  }, [authState, navigate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    try {
      await login(regNo, password);
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  };

  const smoothTransition = { 
    duration: 0.8, 
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
  };

  return (
    <main className="h-full min-h-0 overflow-y-auto no-scrollbar relative bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Industrial Watermark - Hidden on small screens */}
      <div className="hidden sm:block absolute top-20 right-20 text-[12rem] font-black text-foreground opacity-[0.015] pointer-events-none select-none leading-none tracking-tighter uppercase">
        DESKLY
      </div>

      <div className="min-h-full w-full flex items-center justify-center p-6 sm:p-12">
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smoothTransition}
          className="w-full max-w-[360px] flex flex-col gap-12 sm:gap-16 py-8"
        >
          <div className="space-y-8 flex flex-col items-center sm:items-start text-center sm:text-left">
            <img src="/logo.png" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" alt="Logo" />
            <h1 className="text-4xl sm:text-5xl font-light tracking-tightest leading-none text-foreground">
              Sign In
            </h1>
          </div>

          <form className="space-y-10" onSubmit={onSubmit}>
            <div className="space-y-8">
              <div className="group space-y-3">
                <label
                  htmlFor="reg-no"
                  className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-0.5"
                >
                  Reg No
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="reg-no"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="block w-full h-12 pl-4 pr-12 bg-transparent border-b border-border/60 text-base font-normal text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary transition-colors rounded-none placeholder:uppercase placeholder:tracking-[0.2em]"
                    placeholder="ID Number"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/20 transition-colors pointer-events-none group-focus-within:text-primary/40">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="group space-y-3">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-0.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-12 pl-4 pr-12 bg-transparent border-b border-border/60 text-base font-normal text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary transition-colors rounded-none placeholder:tracking-[0.3em]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/20 transition-colors hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {(submitError || error) && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] text-destructive font-black uppercase tracking-widest text-center"
              >
                {submitError ?? error}
              </motion.p>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex justify-center items-center bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-black uppercase tracking-[0.3em] transition-all rounded-none disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10">{loading ? "Authenticating" : "Sign In"}</span>
                {!loading && (
                  <LogIn className="w-3 h-3 ml-3 relative z-10 opacity-60" />
                )}
              </button>
            </div>
          </form>

          <footer className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-12 text-center sm:text-left">
            <button
              className="text-[9px] text-muted-foreground/30 hover:text-primary transition-colors uppercase tracking-widest font-black flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              <HelpCircle className="w-3 h-3" />
              Support Nexus
            </button>
            <span className="text-[9px] text-muted-foreground/10 font-black uppercase tracking-[0.4em] pointer-events-none select-none">
              v2.0 // Ready
            </span>
          </footer>
        </motion.section>
      </div>
    </main>
  );
}
