import { useNavigate } from "@/router";
import { ArrowLeft, Scale, ShieldAlert, Lock, Database, FileText } from "lucide-react";

export default function LegalPage() {
  const navigate = useNavigate();

  const SECTIONS = [
    { id: "disclaimer", label: "App Disclaimer", icon: ShieldAlert },
    { id: "warranty", label: "Terms of Use", icon: Scale },
    { id: "privacy", label: "Privacy Policy", icon: Lock },
    { id: "attribution", label: "Data Source", icon: Database },
    { id: "license", label: "MIT License", icon: FileText },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground overflow-y-auto no-scrollbar pt-8 pb-16 px-4 sm:px-6 md:px-10">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <header className="pb-6 border-b border-border/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-muted/20 border border-border/10 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-primary shrink-0" />
                Legal & Privacy Policy
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Review Deskly's legal terms, VTOP disclaimers, local privacy policy, and open-source licenses
              </p>
            </div>
          </div>
        </header>

        {/* Mobile Navigation chips (Visible on mobile/tablet, hidden on desktop) */}
        <div className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-border/10 -mx-4 px-4">
          {SECTIONS.map((sec) => {
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="px-3 py-1 bg-muted/30 border border-border/10 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0 cursor-pointer rounded-lg"
              >
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Desktop Table of Contents Sidebar (lg:col-span-3) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-6 space-y-4">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 px-3">
                On This Page
              </p>
              <nav className="flex flex-col gap-1">
                {SECTIONS.map((sec) => {
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-accent/40 transition-all cursor-pointer"
                    >
                      <span>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Document Content (lg:col-span-9) */}
          <div className="lg:col-span-9 divide-y divide-border/10 space-y-2">
            
            {/* Section 1: Unofficial App Disclaimer */}
            <section id="disclaimer" className="scroll-mt-6 space-y-3 pb-6">
              <h2 className="text-sm font-bold text-foreground">Unofficial App Disclaimer</h2>
              <div className="border-l-2 border-destructive bg-destructive/5 pl-4 py-2.5 text-xs text-foreground/90 leading-relaxed rounded-r-md">
                <strong>Notice:</strong> This is an unofficial application and is not affiliated with, endorsed by, or maintained by Vellore Institute of Technology (VIT). Deskly operates as a completely unofficial, community-driven client interface and does not claim any official partner status or authorization from the college.
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                All data shown in the application originates from the official college portal and may not always be accurate, complete, or up to date. Users should verify academic details (such as attendance, marks, grades, and exam schedules) through official college channels.
              </p>
            </section>

            {/* Section 2: No Warranty Disclaimer */}
            <section id="warranty" className="scroll-mt-6 space-y-3 py-6">
              <h2 className="text-sm font-bold text-foreground">Terms of Use &amp; No Warranty</h2>
              <div className="border-l-2 border-primary bg-primary/5 pl-4 py-2.5 text-xs text-muted-foreground leading-relaxed rounded-r-md">
                <strong>Disclaimer of Warranty:</strong> This software is provided &quot;as is&quot; without warranties of any kind, express or implied. Information displayed may be inaccurate, delayed, or unavailable due to network errors, server updates, or portal website structure changes.
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                In no event shall the developers of Deskly be held liable for any administrative issues, missed academic schedules, attendance calculation mismatches, or any other complications resulting from the use of this client application.
              </p>
            </section>

            {/* Section 3: Privacy Policy */}
            <section id="privacy" className="scroll-mt-6 space-y-3 py-6">
              <h2 className="text-sm font-bold text-foreground">Privacy Policy</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Deskly is designed with strict student privacy guidelines in mind:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-foreground">What Data is Stored?</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Your VTOP credentials (registration number, password) and academic metrics (attendance, marks, grades, timetables, receipts) are stored on your local device.
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-foreground">Where is it Stored?</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Credentials are saved in secure OS-level keychain services (via the keyring API) and cached page data is held in browser local storage. No cloud servers are used.
                  </p>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                <strong>Third-Party Sharing:</strong> No credentials, cookies, keys, session tokens, or student information are ever shared with, transmitted to, or stored on external servers or third-party analytical networks.
              </p>
            </section>

            {/* Section 4: Data Source Attribution */}
            <section id="attribution" className="scroll-mt-6 space-y-3 py-6">
              <h2 className="text-sm font-bold text-foreground">Data Source Attribution</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                All academic information displayed within this client app is sourced from the official college student portal (VTOP) as fetched on behalf of the user using their local credentials. This application does not maintain an independent database of student records.
              </p>
            </section>

            {/* Section 5: Open Source License */}
            <section id="license" className="scroll-mt-6 space-y-3 pt-6">
              <h2 className="text-sm font-bold text-foreground">Open Source License</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Deskly is released as open-source software under the terms of the MIT License:
              </p>
              <pre className="font-mono text-[10px] bg-muted/20 border border-border/10 rounded-xl p-4 leading-normal whitespace-pre-wrap text-muted-foreground/80 overflow-x-auto">
{`MIT License

Copyright (c) 2026 Deskly Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
              </pre>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
