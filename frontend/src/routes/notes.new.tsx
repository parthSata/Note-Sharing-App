import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Copy, KeyRound, Link2, Lock, QrCode, RefreshCcw, Sparkles, Timer, Unlock, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/notes/new")({
  head: () => ({ meta: [{ title: "Create a note — NoteVault" }] }),
  component: NewNotePage,
});

type ShareType = "one-time" | "time-based";
type AccessType = "public" | "password";

function genKey(len = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

function NewNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expiry, setExpiry] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [shareType, setShareType] = useState<ShareType>("time-based");
  const [accessType, setAccessType] = useState<AccessType>("public");
  const [accessKey, setAccessKey] = useState(() => genKey());
  const [keyCopied, setKeyCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; token: string } | null>(null);

  const shareLink = useMemo(() => {
    if (!submitted) return "";
    return `${typeof window !== "undefined" ? window.location.origin : ""}/share/${submitted.token}`;
  }, [submitted]);

  function copy(text: string, set: (b: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      set(true);
      toast.success("Copied to clipboard");
      setTimeout(() => set(false), 1800);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitted({ id: genToken(), token: genToken() });
  }

  if (submitted) {
    return (
      <PageShell narrow>
        <Card className="p-8 shadow-elegant animate-scale-in">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success animate-pulse-ring">
                <Check className="h-7 w-7" />
              </span>
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">Your share link is ready</h1>
            <p className="mt-1 text-sm text-muted-foreground">Send this link to anyone you want to share the note with.</p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Share link</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={shareLink} className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copy(shareLink, setLinkCopied)}
                  className="shrink-0"
                >
                  {linkCopied ? <Check className="h-4 w-4 text-success animate-scale-in" /> : <Copy className="h-4 w-4" />}
                  {linkCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {accessType === "password" && (
              <div className="rounded-xl border border-border bg-accent/40 p-4 animate-fade-in-up">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Access key (share separately)
                </div>
                <div className="mt-3 flex gap-2">
                  <Input readOnly value={accessKey} className="font-mono text-sm tracking-widest" />
                  <Button type="button" variant="outline" onClick={() => copy(accessKey, setKeyCopied)} className="shrink-0">
                    {keyCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-6">
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-background shadow-soft">
                <QrCode className="h-12 w-12 text-foreground/70" />
              </div>
              <p className="text-xs text-muted-foreground">QR code preview<br />(scannable in production)</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild className="flex-1 gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
                <Link to="/notes/$id" params={{ id: submitted.id }}>Manage this note</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(null);
                  setTitle("");
                  setContent("");
                }}
              >
                Create another
              </Button>
            </div>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell narrow>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> New note
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Create a shareable note</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose how long it lives and who can access it.</p>
      </div>

      <Card className="p-6 sm:p-8 shadow-soft">
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Q3 launch credentials" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Type or paste the note contents..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              className="resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expires at</Label>
            <Input id="expiry" type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>

          <div className="space-y-3">
            <Label>Share type</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                active={shareType === "one-time"}
                onClick={() => setShareType("one-time")}
                icon={<Zap className="h-4 w-4" />}
                title="One-time access"
                desc="Link self-destructs after first view."
              />
              <OptionCard
                active={shareType === "time-based"}
                onClick={() => setShareType("time-based")}
                icon={<Timer className="h-4 w-4" />}
                title="Time-based access"
                desc="Viewable until the expiry time above."
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Access type</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                active={accessType === "public"}
                onClick={() => setAccessType("public")}
                icon={<Unlock className="h-4 w-4" />}
                title="Public"
                desc="Anyone with the link can view it."
              />
              <OptionCard
                active={accessType === "password"}
                onClick={() => setAccessType("password")}
                icon={<Lock className="h-4 w-4" />}
                title="Password-protected"
                desc="Requires the generated access key."
              />
            </div>

            <div
              className={`grid transition-all duration-300 ${
                accessType === "password" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="mt-2 rounded-xl border border-border bg-accent/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Generated access key
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input readOnly value={accessKey} className="font-mono tracking-widest" />
                    <Button type="button" variant="outline" size="icon" onClick={() => setAccessKey(genKey())} title="Regenerate">
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copy(accessKey, setKeyCopied)}
                      title="Copy"
                    >
                      {keyCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Share this key separately from the link for best security.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
            <Link2 className="h-4 w-4" />
            Create & generate share link
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}

function OptionCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left rounded-xl border p-4 transition-all ${
        active
          ? "border-primary bg-accent shadow-glow"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
            active ? "gradient-primary text-primary-foreground" : "bg-accent text-foreground/70"
          }`}
        >
          {icon}
        </span>
        <span className="font-medium">{title}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
