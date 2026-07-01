import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, KeyRound, Sparkles, Zap } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoteVault — Share notes, securely" },
      { name: "description", content: "Create expiring, password-protected, one-time share links for your notes." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Clock, title: "Time-based expiry", desc: "Links self-destruct on a schedule you choose." },
  { icon: Zap, title: "One-time access", desc: "View it once — the link evaporates after." },
  { icon: KeyRound, title: "Password protected", desc: "Add a generated access key for sensitive notes." },
];

function Index() {
  return (
    <PageShell>
      <section className="py-12 text-center sm:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-soft animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Secure note sharing, beautifully simple
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Share notes that <span className="text-gradient">disappear</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Create expiring, one-time, or password-protected share links in seconds. No accounts required to view.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
            <Link to="/notes/new">
              Create a note <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f, i) => (
          <Card
            key={f.title}
            className="p-6 transition hover:shadow-elegant hover:-translate-y-0.5 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
