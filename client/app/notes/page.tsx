"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, FileText, Clock, Link2, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useNotes, type Note } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-slate-100 text-slate-600",
  revoked: "bg-red-100 text-red-600",
  used: "bg-orange-100 text-orange-600",
};

function getLinkStatus(link: Note["shareLinks"][0]): string {
  if (link.revokedAt) return "revoked";
  if (link.consumedAt) return "used";
  if (new Date(link.expiresAt) < new Date()) return "expired";
  return "active";
}

export default function NotesPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { getUserNotes } = useNotes();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    getUserNotes()
      .then(setNotes)
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Notes</h1>
            <p className="text-slate-500 text-sm mt-1">{notes.length} notes total</p>
          </div>
          <Link href="/notes/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition text-sm">
            <Plus className="w-4 h-4" /> New Note
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-6" />
                <div className="h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-24">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No notes yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create your first secure note</p>
            <Link href="/notes/new" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition text-sm">
              Create Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note, i) => {
              const link = note.shareLinks?.[0];
              const status = link ? getLinkStatus(link) : "active";
              return (
                <div key={note.id} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 truncate flex-1 mr-2">{note.title}</h3>
                    {link && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${statusColors[status]}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">{note.content}</p>
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(note.createdAt).toLocaleDateString()}</span>
                    {link && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.viewCount}</span>}
                    {link && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{link.shareType === "ONE_TIME" ? "One-time" : "Time-based"}</span>}
                  </div>
                  <Link href={`/notes/${note.id}`}
                    className="block w-full text-center bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-sm font-medium py-2 rounded-xl transition border border-slate-200 hover:border-indigo-200">
                    View Note →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}