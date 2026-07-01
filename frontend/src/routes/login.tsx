import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileLock2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { setUser } from "@/lib/mock-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — NoteVault" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    setTimeout(() => {
      setUser({ email });
      toast.success("Welcome back!");
      navigate({ to: "/notes/new" });
    }, 600);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-8 shadow-elegant animate-scale-in">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl gradient-primary shadow-elegant">
              <FileLock2 className="h-6 w-6 text-primary-foreground" />
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your shared notes.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground shadow-elegant hover:opacity-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
