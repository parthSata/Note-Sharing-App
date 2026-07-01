import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileLock2, ListChecks, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AuthUser, useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { getUser, logout } = useAuth();
  const authRef = useRef({ getUser });
  const [user, setLocal] = useState<AuthUser | null>(null);

  authRef.current = { getUser };

  useEffect(() => {
    const sync = () => setLocal(authRef.current.getUser());
    sync();
    window.addEventListener("noteshare:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("noteshare:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary shadow-elegant transition-transform group-hover:scale-105">
            <FileLock2 className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-semibold tracking-tight">NoteVault</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/notes">
                  <ListChecks className="h-4 w-4" />
                  My notes
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/notes/new">
                  <Plus className="h-4 w-4" />
                  New note
                </Link>
              </Button>
              <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
