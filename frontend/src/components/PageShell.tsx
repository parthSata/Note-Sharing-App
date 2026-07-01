import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`mx-auto w-full flex-1 px-6 py-10 ${narrow ? "max-w-2xl" : "max-w-6xl"}`}>
        <div className="animate-fade-in-up">{children}</div>
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        NoteVault - secure note sharing with expiring links.
      </footer>
    </div>
  );
}
