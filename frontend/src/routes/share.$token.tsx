import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clock, FileLock2, Lock, Search, Unlock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useShare } from "@/hooks/useShare";

type State =
  | "loading"
  | "password-required"
  | "expired"
  | "revoked"
  | "used"
  | "invalid"
  | "unlocked";

type SharedNote = {
  title: string;
  content: string;
};

export const Route = createFileRoute("/share/$token")({
  head: () => ({ meta: [{ title: "Shared note â€” NoteVault" }] }),
  component: SharePage,
});

function SharePage() {
  const { token } = Route.useParams();
  const { resolveToken, unlockWithPassword } = useShare();
  const shareRef = useRef({ resolveToken, unlockWithPassword });
  const [state, setState] = useState<State>("loading");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState<SharedNote | null>(null);
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  shareRef.current = { resolveToken, unlockWithPassword };

  useEffect(() => {
    let cancelled = false;

    setState("loading");
    setPassword("");
    setError("");
    setNote(null);

    shareRef.current
      .resolveToken(token)
      .then((response) => {
        if (cancelled) return;

        if ("state" in response) {
          setState(response.state);
          return;
        }

        if ("passwordRequired" in response && response.passwordRequired) {
          setState("password-required");
          return;
        }

        setNote(response.note);
        setState("unlocked");
      })
      .catch(() => {
        if (cancelled) return;
        setState("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setError("");

    try {
      const response = await shareRef.current.unlockWithPassword(token, password);

      if ("state" in response) {
        if (response.state === "wrong-password") {
          setError("Incorrect password");
          setShakeKey((k) => k + 1);
          return;
        }

        if (response.state === "too-many-attempts") {
          setError("Too many attempts. Try again later.");
          return;
        }

        setState(response.state);
        return;
      }

      setNote(response.note);
      setError("");
      setState("unlocked");
    } catch {
      setError("Unable to unlock this note.");
      setShakeKey((k) => k + 1);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {state === "loading" && <LoadingView />}
          {state === "unlocked" && note && <UnlockedView note={note} animateIn />}
          {state === "password-required" && (
            <LockedView
              password={password}
              setPassword={setPassword}
              onSubmit={unlock}
              error={error}
              unlocking={unlocking}
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

function UnlockedView({ note, animateIn = false }: { note: SharedNote; animateIn?: boolean }) {
  return (
    <Card className={`p-8 shadow-elegant ${animateIn ? "animate-scale-in" : "animate-fade-in-up"}`}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1"><Unlock className="h-3 w-3" /> Public</Badge>
        <Badge className="bg-success/15 text-success border-success/20 hover:bg-success/20">Active</Badge>
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{note.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Shared via NoteVault</p>
      <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-5">
        <pre className="whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed text-foreground/90">
          {note.content}
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
  unlocking,
  shakeKey,
}: {
  password: string;
  setPassword: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  unlocking: boolean;
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
          <p className="text-center text-sm text-destructive animate-fade-in">{error}</p>
        )}
        <Button type="submit" disabled={unlocking} className="w-full gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          <Unlock className="h-4 w-4" /> {unlocking ? "Unlocking..." : "Unlock"}
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
