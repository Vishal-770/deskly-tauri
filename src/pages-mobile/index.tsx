import { FormEvent, useEffect, useState } from "react";
import { useNavigate, Link } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock, LogIn, HelpCircle, Eye, EyeOff, Scale, AlertCircle } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function MobileHome() {
  const navigate = useNavigate();
  const { authState, loading, error, login } = useAuth();
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (authState?.loggedIn) {
      navigate("/dashboard");
    }
  }, [authState, navigate]);

  useEffect(() => {
    async function loadVersion() {
      try {
        const ver = await getVersion();
        setVersion(ver);
      } catch (err) {
        console.warn("Failed to get app version:", err);
      }
    }
    loadVersion();
  }, []);

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

  return (
    <main className="h-full w-full flex flex-col justify-between p-6 bg-background text-foreground antialiased overflow-y-auto no-scrollbar">
      
      {/* Centered card container for premium layout */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8 space-y-12">
        
        {/* Welcome Section */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-muted/30 rounded-3xl border border-border/10 shadow-sm">
              <img src="/logo.png" className="w-11 h-11 object-contain" alt="Deskly Logo" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[240px] mx-auto font-medium">
              Sync your student dashboard with your VTOP credentials.
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            
            {/* Registration Number Field */}
            <div className="space-y-2">
              <label
                htmlFor="reg-no"
                className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/45 ml-2"
              >
                Registration Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="reg-no"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  disabled={loading}
                  className="block w-full h-12 pl-11 pr-4 bg-muted/20 focus:bg-muted/40 border border-border/5 focus:border-primary/20 focus:ring-2 focus:ring-primary/5 focus:outline-none text-sm font-semibold rounded-2xl transition-all duration-200"
                  placeholder="e.g. 21BCE0001"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
                  <User className="w-4.5 h-4.5" />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/45 ml-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full h-12 pl-11 pr-12 bg-muted/20 focus:bg-muted/40 border border-border/5 focus:border-primary/20 focus:ring-2 focus:ring-primary/5 focus:outline-none text-sm font-semibold rounded-2xl transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Errors */}
          {(submitError || error) && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/15 p-3.5 rounded-2xl font-bold leading-relaxed flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive/80" />
              <span>{submitError ?? error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex justify-center items-center bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/10 active:opacity-90"
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            {!loading && (
              <LogIn className="w-4 h-4 ml-2 opacity-80" />
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between pt-6 border-t border-border/5 max-w-sm mx-auto w-full shrink-0">
        <div className="flex gap-2.5">
          <button
            onClick={async () => {
              try {
                await openUrl("https://github.com/Vishal-770/deskly-tauri/issues");
              } catch (err) {
                console.error("Failed to open support link:", err);
              }
            }}
            className="px-3.5 py-1.5 bg-muted/20 hover:bg-muted/40 border border-border/5 text-[11px] text-muted-foreground hover:text-foreground transition-all duration-200 font-bold rounded-full flex items-center gap-1.5 cursor-pointer focus:outline-none"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Support
          </button>
          <Link
            to="/legal"
            className="px-3.5 py-1.5 bg-muted/20 hover:bg-muted/40 border border-border/5 text-[11px] text-muted-foreground hover:text-foreground transition-all duration-200 font-bold rounded-full flex items-center gap-1.5 cursor-pointer focus:outline-none"
          >
            <Scale className="w-3.5 h-3.5" />
            Legal
          </Link>
        </div>
        <span className="text-[11px] text-muted-foreground/35 font-bold select-none pr-1">
          {version ? `v${version}` : "v3.0.2"}
        </span>
      </footer>
    </main>
  );
}
