import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function Login({ status }: { status: string }) {
  const { signIn } = useData();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(
    status === "not_configured" ? "Sign-in isn't set up yet. Add DASHBOARD_PASSCODE in Vercel and redeploy." :
    status === "error" ? "Couldn't reach the server. Check your connection and reload." : null
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) { setError("Enter your passcode to continue."); return; }
    setBusy(true);
    setError(await signIn(passcode));
    setBusy(false);
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-card p-6" noValidate>
        <div className="mb-5 grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-strong">
          <Lock className="size-5" aria-hidden />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Jake's dashboard</h1>
        <p className="mt-1 text-sm text-muted-fg">Enter your passcode to see your schedule and networking.</p>
        <Field label="Passcode" className="mt-5">
          <Input
            type="password" autoComplete="current-password" autoFocus value={passcode}
            onChange={(e) => setPasscode(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined}
          />
        </Field>
        {error && <p id="login-error" role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        <Button type="submit" className="mt-5 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </main>
  );
}
