import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clock, FileLock2, Lock, Search, Unlock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type State =
  | "loading"
  | "public-unlocked"
  | "locked"
  | "expired"
  | "revoked"
  | "used"
  | "invalid"
  | "unlocked";

export const Route = createFileRoute("/share/$token")({
  head: () => ({ meta: [{ title: "Shared note — NoteVault" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    state: (s.state as State | undefined) ?? undefined,
  }),
  component: SharePage,
});

const MOCK_PASSWORD = "OPEN";

function SharePage() {
  const { state: forcedState } = Route.useSearch();
  const [state, setState] = useState<State>("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setState(forcedState ?? "locked");
    }, 900);
    return () => clearTimeout(t);
  }, [forcedState]);

  function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (password.trim().toUpperCase() === MOCK_PASSWORD) {
      setError(false);
      setState("unlocked");
    } else {
      setError(true);
      setShakeKey((k) => k + 1);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <DemoSwitcher current={state} setState={setState} />
          {state === "loading" && <LoadingView />}
          {state === "public-unlocked" && <UnlockedView />}
          {state === "unlocked" && <UnlockedView animateIn />}
          {state === "locked" && (
            <LockedView
              password={password}
              setPassword={setPassword}
              onSubmit={unlock}
              error={error}
              shakeKey={shakeKey}
            />
          )}
          {state === "expired" && (
            <MessageView
              icon={<Clock className="h-8 w-8" />}
              tone="muted"
              title="This link has expired"
              desc="The owner set a time limit on this share, and it has passed."
            />
          )}
          {state === "revoked" && (
            <MessageView
              icon={<Ban className="h-8 w-8" />}
              tone="destructive"
              title="This link has been revoked"
              desc="The owner of this note removed access. Reach out to them for a new link."
            />
          )}
          {state === "used" && (
            <MessageView
              icon={<CheckCircle2 className="h-8 w-8" />}
              tone="muted"
              title="This link has already been used"
              desc="One-time links self-destruct after the first view."
            />
          )}
          {state === "invalid" && (
            <MessageView
              icon={<Search className="h-8 w-8" />}
              tone="muted"
              title="Link not found"
              desc="We couldn't find a note matching this link."
            />
          )}
        </div>
      </main>
    </div>
  );
}

function DemoSwitcher({ current, setState }: { current: State; setState: (s: State) => void }) {
  const opts: { label: string; value: State }[] = [
    { label: "Loading", value: "loading" },
    { label: "Public", value: "public-unlocked" },
    { label: "Locked", value: "locked" },
    { label: "Expired", value: "expired" },
    { label: "Revoked", value: "revoked" },
    { label: "Used", value: "used" },
    { label: "Invalid", value: "invalid" },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-card/60 p-3 text-xs">
      <span className="font-medium text-muted-foreground">Preview state:</span>
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => setState(o.value)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            current === o.value || (current === "unlocked" && o.value === "locked")
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
      <span className="ml-auto text-muted-foreground">Try password: <code className="rounded bg-muted px-1">OPEN</code></span>
    </div>
  );
}

function LoadingView() {
  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-9/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    </Card>
  );
}

function UnlockedView({ animateIn = false }: { animateIn?: boolean }) {
  return (
    <Card className={`p-8 shadow-elegant ${animateIn ? "animate-scale-in" : "animate-fade-in-up"}`}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1"><Unlock className="h-3 w-3" /> Public</Badge>
        <Badge className="bg-success/15 text-success border-success/20 hover:bg-success/20">Active</Badge>
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Q3 launch credentials</h1>
      <p className="mt-1 text-xs text-muted-foreground">Shared via NoteVault</p>
      <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-5">
        <pre className="whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed text-foreground/90">
{`Staging API key: sk_test_•••••••••
Dashboard: https://example.com/admin

Please rotate within 24h after first use.`}
        </pre>
      </div>
    </Card>
  );
}

function LockedView({
  password,
  setPassword,
  onSubmit,
  error,
  shakeKey,
}: {
  password: string;
  setPassword: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: boolean;
  shakeKey: number;
}) {
  return (
    <Card key={shakeKey} className={`p-8 shadow-elegant animate-scale-in ${error ? "animate-shake" : ""}`}>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">This note is locked</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the access key shared with you to view it.</p>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <Input
          autoFocus
          placeholder="Access key"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          className={`text-center font-mono tracking-widest ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {error && (
          <p className="text-center text-sm text-destructive animate-fade-in">Incorrect access key. Try again.</p>
        )}
        <Button type="submit" className="w-full gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          <Unlock className="h-4 w-4" /> Unlock
        </Button>
      </form>
    </Card>
  );
}

function MessageView({
  icon,
  title,
  desc,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: "muted" | "destructive";
}) {
  return (
    <Card className="p-10 text-center shadow-soft animate-fade-in-up">
      <div className="mx-auto flex flex-col items-center">
        <span
          className={`grid h-14 w-14 place-items-center rounded-full ${
            tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{desc}</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <FileLock2 className="h-3.5 w-3.5" /> NoteVault
        </div>
      </div>
      <span className="sr-only">{tone === "destructive" ? "Error" : "Notice"}</span>
      <AlertTriangle className="hidden" />
    </Card>
  );
}
