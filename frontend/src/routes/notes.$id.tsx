import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Ban, Check, Clock, Copy, Eye, KeyRound, Lock, Timer, Unlock, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/notes/$id")({
  head: () => ({ meta: [{ title: "Manage note — NoteVault" }] }),
  component: NoteDetailPage,
});

type Status = "active" | "expired" | "revoked";

function NoteDetailPage() {
  const { id } = Route.useParams();
  const [status, setStatus] = useState<Status>("active");
  const [views, setViews] = useState(0);
  const [displayedViews, setDisplayedViews] = useState(0);
  const [copied, setCopied] = useState(false);

  // Mock note
  const note = {
    title: "Q3 launch credentials",
    content:
      "Staging API key: sk_test_•••••••••\nDashboard: https://example.com/admin\n\nPlease rotate within 24h after first use.",
    shareType: "one-time" as "one-time" | "time-based",
    accessType: "password" as "public" | "password",
    expiresAt: new Date(Date.now() + 22 * 3600 * 1000),
    createdAt: new Date(Date.now() - 2 * 3600 * 1000),
  };

  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${id}`;

  // Simulate live view count
  useEffect(() => {
    const t = setTimeout(() => setViews(7), 400);
    return () => clearTimeout(t);
  }, []);

  // Animate counter
  useEffect(() => {
    if (displayedViews === views) return;
    const step = displayedViews < views ? 1 : -1;
    const t = setTimeout(() => setDisplayedViews((v) => v + step), 60);
    return () => clearTimeout(t);
  }, [displayedViews, views]);

  function copy() {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <PageShell narrow>
      <Link to="/notes/new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{note.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {note.createdAt.toLocaleString()} · Expires {note.expiresAt.toLocaleString()}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <Card className="mt-6 p-6 shadow-soft animate-fade-in-up">
        <pre className="whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed text-foreground/90">
          {note.content}
        </pre>
      </Card>

      <Card className="mt-4 p-6 shadow-soft animate-fade-in-up">
        <div className="flex flex-wrap items-center gap-2">
          {note.shareType === "one-time" ? (
            <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" /> One-time</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1"><Timer className="h-3 w-3" /> Time-based</Badge>
          )}
          {note.accessType === "password" ? (
            <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Password-protected</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1"><Unlock className="h-3 w-3" /> Public</Badge>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Input readOnly value={shareLink} className="font-mono text-sm" />
          <Button variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-success animate-scale-in" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-6 shadow-soft animate-fade-in-up">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" /> Views
          </div>
          <div className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">
            <span key={displayedViews} className="inline-block animate-scale-in">{displayedViews}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Counted on every successful unlock.</p>
        </Card>

        <Card className="p-6 shadow-soft animate-fade-in-up">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" /> Time remaining
          </div>
          <div className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">~22h</div>
          <p className="mt-1 text-xs text-muted-foreground">Link expires {note.expiresAt.toLocaleString()}.</p>
        </Card>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-6 shadow-soft animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4 text-primary" /> Danger zone</div>
          <p className="mt-1 text-sm text-muted-foreground">Revoking immediately invalidates the share link.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={status !== "active"} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Ban className="h-4 w-4" /> Revoke link
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this share link?</AlertDialogTitle>
              <AlertDialogDescription>
                Anyone who tries to open the link will see a "revoked" message. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setStatus("revoked");
                  toast.success("Link revoked");
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </PageShell>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "active")
    return (
      <Badge className="bg-success/15 text-success hover:bg-success/20 border-success/20">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Active
      </Badge>
    );
  if (status === "expired")
    return <Badge variant="secondary" className="text-muted-foreground">Expired</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20">Revoked</Badge>;
}
