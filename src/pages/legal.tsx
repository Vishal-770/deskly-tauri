import { useNavigate } from "@/router";
import { ArrowLeft, Scale, ShieldAlert, Lock, Database } from "lucide-react";

export default function LegalPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground overflow-y-auto no-scrollbar pt-8 pb-16 px-6 sm:px-12 md:px-24">
      <div className="max-w-2xl mx-auto w-full space-y-10">
        
        {/* Header */}
        <header className="pb-6 border-b border-border/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-primary shrink-0" />
              Legal & Privacy Policy
            </h1>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          
          {/* Section 1: Unofficial App Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
              Unofficial App Disclaimer
            </h2>
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-xs font-semibold text-foreground/90">
              This is an unofficial application and is not affiliated with, endorsed by, or maintained by Vellore Institute of Technology (VIT). 
              Deskly operates as a completely unofficial, community-driven client interface and does not claim any official partner status or authorization from the college.
            </div>
            <p>
              Data shown in the application originates from the official college portal and may not always be accurate, complete, or up to date. Users should verify critical academic information (such as attendance, marks, grades, and exam schedules) through official college channels.
            </p>
          </section>

          {/* Section 2: No Warranty Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary shrink-0" />
              Terms of Use & No Warranty
            </h2>
            <p className="bg-card/40 border border-border/20 rounded-2xl p-4 text-xs">
              <strong>Disclaimer of Warranty:</strong> This software is provided &quot;as is&quot; without warranties of any kind, express or implied. Information displayed may be inaccurate, delayed, or unavailable due to network errors, server updates, or portal website structure changes.
            </p>
            <p>
              In no event shall the developers of Deskly be held liable for any administrative issues, missed academic schedules, attendance calculation mismatches, or any other complications resulting from the use of this client application.
            </p>
          </section>

          {/* Section 3: Privacy Policy */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              Privacy Policy
            </h2>
            <p>
              Deskly is designed with strict student privacy guidelines:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl border border-border/15 bg-card/10 space-y-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  What Data is Stored?
                </h3>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  Your VTOP credentials (registration number, password) and academic metrics (attendance, marks, grades, timetables, receipts) are stored on your local device.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border/15 bg-card/10 space-y-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  Where is it Stored?
                </h3>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  Credentials are saved in secure OS-level keychain services (via the keyring API) and cached page data is held in browser local storage. No cloud servers are used.
                </p>
              </div>
            </div>
            <p className="pt-2">
              <strong>Third-Party Sharing:</strong> No credentials, cookies, keys, session tokens, or student information are ever shared with, transmitted to, or stored on external servers or third-party analytical networks.
            </p>
          </section>

          {/* Section 4: Data Source Attribution */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary shrink-0" />
              Data Source Attribution
            </h2>
            <p>
              All academic information displayed within this client app is sourced from the official college student portal (VTOP) as fetched on behalf of the user using their local credentials. This application does not maintain an independent database of student records.
            </p>
          </section>

          {/* Section 5: Open Source License */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">
              Open Source License
            </h2>
            <p className="font-mono text-[11px] bg-muted/30 border border-border/10 rounded-2xl p-4 leading-normal whitespace-pre-wrap">
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
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
