import { Link } from "@/router";

export default function NoInternetPage() {
  return (
    <main className="h-full min-h-0 overflow-y-auto no-scrollbar flex items-center justify-center bg-background text-foreground p-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm text-center space-y-3">
        <h1 className="text-2xl font-semibold">No Internet</h1>
        <p className="text-sm text-muted-foreground">
          Your network appears to be offline. Reconnect and try again.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
