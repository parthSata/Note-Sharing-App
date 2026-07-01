import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { type Note, type ShareLink, useNotes } from "@/hooks/useNotes";

export const Route = createFileRoute("/notes/$id")({
  head: () => ({ meta: [{ title: "Manage note â€” NoteVault" }] }),
  component: NoteDetailPage,
});

type Status = "active" | "expired" | "revoked" | "used";

function NoteDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { getNote, revokeShareLink } = useNotes();
  const authRef = useRef({ isLoggedIn });
  const notesRef = useRef({ getNote });
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [displayedViews, setDisplayedViews] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentShareLink = note?.shareLinks?.[0] ?? null;
  const status = currentShareLink ? getShareLinkStatus(currentShareLink) : "expired";
  const views = currentShareLink?.viewCount ?? 0;
  const expiresAt = currentShareLink ? new Date(currentShareLink.expiresAt) : null;
  const createdAt = note ? new Date(note.createdAt) : null;
  const shareLink = getDisplayShareUrl(currentShareLink, id);

  authRef.current = { isLoggedIn };
  notesRef.current = { getNote };

  useEffect(() => {
    if (!authRef.current.isLoggedIn()) {
      navigate({ to: "/login" });
      return;
    }

    let cancelled = false;

    setLoading(true);
    setNotFound(false);

    notesRef.current
      .getNote(id)
      .then((fetchedNote) => {
        if (cancelled) return;
        setNote(fetchedNote);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

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

  async function confirmRevoke() {
    if (!note || !currentShareLink) return;

    setRevoking(true);

    try {
      await revokeShareLink(note.id, currentShareLink.id);
      setNote({
        ...note,
        shareLinks: note.shareLinks?.map((shareLink) =>
          shareLink.id === currentShareLink.id
            ? { ...shareLink, revokedAt: new Date().toISOString() }
            : shareLink,
        ),
      });
      toast.success("Share link revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to revoke share link");
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return (
      <PageShell narrow>
        <div className="h-5 w-16 rounded bg-muted animate-pulse" />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="h-9 w-72 rounded bg-muted animate-pulse" />
            <div className="h-4 w-96 max-w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        <Card className="mt-6 p-6 shadow-soft animate-fade-in-up">
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        </Card>
      </PageShell>
    );
  }

  if (notFound || !note) {
    return (
      <PageShell narrow>
        <Link to="/notes/new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="mt-6 p-8 text-center shadow-soft animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight">Note not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This note could not be loaded.</p>
        </Card>
      </PageShell>
    );
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
            Created {createdAt?.toLocaleString()} Â· Expires {expiresAt?.toLocaleString() ?? "No share link"}
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
          {currentShareLink?.shareType === "ONE_TIME" ? (
            <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" /> One-time</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1"><Timer className="h-3 w-3" /> Time-based</Badge>
          )}
          {currentShareLink?.accessType === "PASSWORD" ? (
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
          <div className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">{formatTimeRemaining(expiresAt)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Link expires {expiresAt?.toLocaleString() ?? "not available"}.</p>
        </Card>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-6 shadow-soft animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4 text-primary" /> Danger zone</div>
          <p className="mt-1 text-sm text-muted-foreground">Revoking immediately invalidates the share link.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={status !== "active" || revoking} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Ban className="h-4 w-4" /> {revoking ? "Revoking..." : "Revoke link"}
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
                onClick={confirmRevoke}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revoking ? "Revoking..." : "Yes, revoke"}
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
  if (status === "used")
    return <Badge variant="secondary" className="text-muted-foreground">Used</Badge>;
  return <Badge className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/20">Revoked</Badge>;
}

function getShareLinkStatus(shareLink: ShareLink): Status {
  if (shareLink.revokedAt) return "revoked";
  if (shareLink.consumedAt) return "used";
  if (new Date(shareLink.expiresAt) <= new Date()) return "expired";
  return "active";
}

function formatTimeRemaining(expiresAt: Date | null) {
  if (!expiresAt) return "N/A";

  const remainingMs = expiresAt.getTime() - Date.now();

  if (remainingMs <= 0) return "Expired";

  const hours = Math.ceil(remainingMs / (1000 * 60 * 60));

  return `~${hours}h`;
}

function getDisplayShareUrl(shareLink: ShareLink | null, fallbackId: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareLink && "shareUrl" in shareLink ? String(shareLink.shareUrl) : "";

  return shareUrl || `${origin}/share/${shareLink?.id ?? fallbackId}`;
}
