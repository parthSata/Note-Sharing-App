import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Clock,
  Eye,
  FileText,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Timer,
  Unlock,
  Zap,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { type Note, type ShareLink, useNotes } from "@/hooks/useNotes";

export const Route = createFileRoute("/notes/")({
  head: () => ({ meta: [{ title: "My notes - NoteVault" }] }),
  component: NotesPage,
});

type NoteSummary = {
  id: string;
  title: string;
  excerpt: string;
  shareType: "one-time" | "time-based";
  accessType: "public" | "password";
  status: "active" | "expired" | "revoked" | "used";
  views: number;
  expiresAt: Date | null;
  updatedAt: Date;
};

function NotesPage() {
  const auth = useAuth();
  const notesApi = useNotes();
  const authRef = useRef(auth);
  const notesApiRef = useRef(notesApi);
  const [user, setUser] = useState(() => auth.getUser());
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  authRef.current = auth;
  notesApiRef.current = notesApi;

  useEffect(() => {
    let isActive = true;

    async function loadNotes() {
      const currentUser = authRef.current.getUser();
      setUser(currentUser);

      if (!authRef.current.isLoggedIn() || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userNotes = await notesApiRef.current.listNotes();

        if (isActive) {
          setNotes(userNotes);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load notes");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      isActive = false;
    };
  }, []);

  const noteSummaries = notes.map(toNoteSummary);
  const activeNotes = noteSummaries.filter((note) => note.status === "active").length;
  const totalViews = notes.reduce(
    (sum, note) => sum + (note.shareLinks ?? []).reduce((linkSum, link) => linkSum + link.viewCount, 0),
    0,
  );
  const protectedNotes = notes.filter((note) => (note.shareLinks ?? []).some((link) => link.accessType === "PASSWORD")).length;

  if (!user && !loading) {
    return (
      <PageShell narrow>
        <Card className="p-8 text-center shadow-soft animate-scale-in">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Sign in to view your notes</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Your saved notes and share links appear here after you log in.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" /> Notes workspace
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">My notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review every note you created and manage active share links.
          </p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          <Link to="/notes/new">
            <Plus className="h-4 w-4" />
            New note
          </Link>
        </Button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<ShieldCheck className="h-4 w-4" />} label="Active links" value={activeNotes} />
        <SummaryCard icon={<Eye className="h-4 w-4" />} label="Total views" value={totalViews} />
        <SummaryCard icon={<KeyRound className="h-4 w-4" />} label="Protected notes" value={protectedNotes} />
      </section>

      <section className="mt-6 space-y-3">
        {loading ? (
          <NotesSkeleton />
        ) : error ? (
          <Card className="p-8 text-center shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight">Unable to load notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </Card>
        ) : noteSummaries.length ? (
          noteSummaries.map((note, index) => <NoteRow key={note.id} note={note} index={index} />)
        ) : (
          <Card className="p-8 text-center shadow-soft">
            <h2 className="text-lg font-semibold tracking-tight">No notes yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create your first note to generate a share link.</p>
            <Button asChild className="mt-5 gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
              <Link to="/notes/new">
                <Plus className="h-4 w-4" />
                Create note
              </Link>
            </Button>
          </Card>
        )}
      </section>
    </PageShell>
  );
}

function toNoteSummary(note: Note): NoteSummary {
  const shareLinks = [...(note.shareLinks ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latestShareLink = shareLinks[0] ?? null;
  const excerpt = note.content.length > 120 ? `${note.content.slice(0, 117)}...` : note.content;

  return {
    id: note.id,
    title: note.title,
    excerpt,
    shareType: latestShareLink?.shareType === "ONE_TIME" ? "one-time" : "time-based",
    accessType: latestShareLink?.accessType === "PASSWORD" ? "password" : "public",
    status: latestShareLink ? getShareLinkStatus(latestShareLink) : "expired",
    views: latestShareLink?.viewCount ?? 0,
    expiresAt: latestShareLink ? new Date(latestShareLink.expiresAt) : null,
    updatedAt: new Date(note.updatedAt),
  };
}

function getShareLinkStatus(shareLink: ShareLink): NoteSummary["status"] {
  if (shareLink.revokedAt) {
    return "revoked";
  }

  if (shareLink.consumedAt) {
    return "used";
  }

  if (new Date(shareLink.expiresAt) <= new Date()) {
    return "expired";
  }

  return "active";
}

function NotesSkeleton() {
  return (
    <>
      {[0, 1, 2].map((item) => (
        <Card key={item} className="p-5 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </Card>
      ))}
    </>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-5 shadow-soft animate-fade-in-up">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
    </Card>
  );
}

function NoteRow({ note, index }: { note: NoteSummary; index: number }) {
  return (
    <Card
      className="p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight">{note.title}</h2>
            <StatusBadge status={note.status} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ShareTypeBadge shareType={note.shareType} />
            <AccessTypeBadge accessType={note.accessType} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {note.expiresAt ? `Expires ${note.expiresAt.toLocaleString()}` : "No share link"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 md:justify-end">
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums tracking-tight">{note.views}</div>
            <div className="text-xs text-muted-foreground">views</div>
          </div>
          <Button asChild variant="outline">
            <Link to="/notes/$id" params={{ id: note.id }}>
              Manage
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: NoteSummary["status"] }) {
  if (status === "active") {
    return <Badge className="bg-success/15 text-success hover:bg-success/20 border-success/20">Active</Badge>;
  }

  if (status === "revoked") {
    return <Badge className="bg-destructive/15 text-destructive border-destructive/20">Revoked</Badge>;
  }

  if (status === "used") {
    return <Badge variant="secondary">Used</Badge>;
  }

  return <Badge variant="secondary">Expired</Badge>;
}

function ShareTypeBadge({ shareType }: { shareType: NoteSummary["shareType"] }) {
  return shareType === "one-time" ? (
    <Badge variant="secondary" className="gap-1">
      <Zap className="h-3 w-3" /> One-time
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <Timer className="h-3 w-3" /> Time-based
    </Badge>
  );
}

function AccessTypeBadge({ accessType }: { accessType: NoteSummary["accessType"] }) {
  return accessType === "password" ? (
    <Badge variant="secondary" className="gap-1">
      <Lock className="h-3 w-3" /> Password
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <Unlock className="h-3 w-3" /> Public
    </Badge>
  );
}
