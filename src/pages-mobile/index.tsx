import { FormEvent, useEffect, useState } from "react";
import { useNavigate, Link } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Lock,
  HelpCircle,
  Eye,
  EyeOff,
  Scale,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
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
    <main className="h-full w-full flex flex-col text-foreground antialiased overflow-y-auto no-scrollbar relative bg-background">

      {/* Subtle glow behind logo — top */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 28% at 50% 14%, rgba(255,255,255,0.06) 0%, transparent 100%)",
        }}
      />

      {/* Subtle concentric glow at bottom center — creates depth in the empty space */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% 100%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 40%, transparent 70%)",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-7 py-10 gap-12">

        {/* Logo + Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Circular logo */}
          <div className="w-[72px] h-[72px] rounded-full bg-muted/30 flex items-center justify-center">
            <img
              src="/logo.png"
              className="w-10 h-10 object-contain"
              alt="Deskly Logo"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-tight">
              Sign In
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
              Sync your student dashboard with your VTOP credentials.
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-10" onSubmit={onSubmit}>

          {/* Fields */}
          <div className="flex flex-col gap-7">

            {/* Registration Number */}
            <div className="relative flex items-center border-b border-border/50 focus-within:border-foreground transition-colors duration-200 pb-3">
              <User className="w-[18px] h-[18px] text-muted-foreground/50 shrink-0 mr-3" />
              <input
                type="text"
                id="reg-no"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/35 font-normal disabled:opacity-50"
                placeholder="e.g. 21BCE0001"
                required
                autoComplete="username"
                autoCapitalize="characters"
              />
            </div>

            {/* Password */}
            <div className="relative flex items-center border-b border-border/50 focus-within:border-foreground transition-colors duration-200 pb-3">
              <Lock className="w-[18px] h-[18px] text-muted-foreground/50 shrink-0 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/35 font-normal disabled:opacity-50"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="ml-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors focus:outline-none shrink-0 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" />
                ) : (
                  <Eye className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {(submitError || error) && (
            <div className="flex items-start gap-2 text-destructive text-[13px] font-medium leading-relaxed -mt-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError ?? error}</span>
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[54px] flex items-center justify-center gap-2 bg-foreground text-background text-[15px] font-semibold rounded-full transition-opacity duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:opacity-80"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In…</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 flex items-center justify-between px-7 py-5 border-t border-border/10">
        <div className="flex items-center gap-5">
          <button
            onClick={async () => {
              try {
                await openUrl("https://github.com/Vishal-770/deskly-tauri/issues");
              } catch (err) {
                console.error("Failed to open support link:", err);
              }
            }}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support</span>
          </button>
          <Link
            to="/legal"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Legal</span>
          </Link>
        </div>
        <span className="text-[12px] text-muted-foreground/35 select-none">
          {version ? `v${version}` : "v3.0.7"}
        </span>
      </footer>
    </main>
  );
}
