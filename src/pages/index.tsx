import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import { User, LogIn, HelpCircle, Eye, EyeOff } from "lucide-react";

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

  return (
    <main className="h-full min-h-0 overflow-hidden relative flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      {/* Background Typography Watermark */}
      <div className="absolute top-12 right-12 text-[6rem] lg:text-[10rem] font-extrabold text-foreground opacity-[0.03] pointer-events-none select-none leading-none z-0">
        DKLY
      </div>

      <section className="w-full max-w-[400px] relative z-10 flex flex-col gap-8 p-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary/10 transition-transform hover:scale-105">
              <img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-none">
            Welcome Back
          </h1>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
            Please sign in to continue
          </p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="group">
              <label
                htmlFor="reg-no"
                className="block text-[10px] font-bold uppercase tracking-widest text-foreground mb-1.5 ml-0.5"
              >
                Registration Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="reg-no"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="block w-full h-12 pl-4 pr-10 bg-card border border-input text-base font-medium text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-primary/50 transition-all rounded-xl placeholder:uppercase placeholder:tracking-wider peer"
                  placeholder="21BCE1001"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground peer-focus:text-primary transition-colors pointer-events-none">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="password"
                className="block text-[10px] font-bold uppercase tracking-widest text-foreground mb-1.5 ml-0.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full h-12 pl-4 pr-10 bg-card border border-input text-base font-medium text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-primary/50 transition-all rounded-xl placeholder:tracking-widest peer"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground peer-focus:text-primary transition-colors hover:text-primary focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {(submitError || error) && (
            <p className="text-sm text-destructive text-center font-medium">
              {submitError ?? error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex justify-center items-center bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold uppercase tracking-widest border border-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:translate-y-[1px] rounded-xl shadow-lg group mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            {!loading && (
              <LogIn className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </form>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-semibold border-t border-border pt-5 mt-2">
          <button
            className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Trouble logging in?
          </button>
          <span className="text-muted-foreground/60 uppercase tracking-widest pointer-events-none">
            Privacy Policy
          </span>
        </div>
      </section>
    </main>
  );
}
