"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Eye, FileText, Link2, Plus, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useNotes, type Note } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";
import { parseApiDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-slate-100 text-slate-600",
  revoked: "bg-red-100 text-red-600",
  used: "bg-orange-100 text-orange-600",
};

const notesBatchSize = 15;

type StatusFilter = "all" | "active" | "expired" | "revoked" | "used";
type ShareTypeFilter = "all" | "ONE_TIME" | "TIME_BASED";

function getLinkStatus(link: Note["shareLinks"][0]): Exclude<StatusFilter, "all"> {
  if (link.revokedAt) return "revoked";
  if (link.consumedAt) return "used";
  if (parseApiDate(link.expiresAt) < new Date()) return "expired";
  return "active";
}

export default function NotesPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { getUserNotes } = useNotes();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [shareTypeFilter, setShareTypeFilter] = useState<ShareTypeFilter>("all");
  const [visibleCount, setVisibleCount] = useState(notesBatchSize);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    getUserNotes()
      .then(setNotes)
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setLoading(false));
  }, []);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      const link = note.shareLinks?.[0];
      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        (link ? getLinkStatus(link) === statusFilter : statusFilter === "active");
      const matchesShareType =
        shareTypeFilter === "all" || link?.shareType === shareTypeFilter;

      return matchesSearch && matchesStatus && matchesShareType;
    });
  }, [notes, searchQuery, statusFilter, shareTypeFilter]);

  const visibleNotes = filteredNotes.slice(0, visibleCount);
  const visibleEnd = Math.min(visibleCount, filteredNotes.length);
  const hasMoreNotes = visibleEnd < filteredNotes.length;
  const hasActiveFilters =
    searchQuery.trim() || statusFilter !== "all" || shareTypeFilter !== "all";

  useEffect(() => {
    const loadMoreTarget = loadMoreRef.current;
    if (!loadMoreTarget || !hasMoreNotes) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + notesBatchSize, filteredNotes.length));
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(loadMoreTarget);

    return () => observer.disconnect();
  }, [filteredNotes.length, hasMoreNotes]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Notes</h1>
            <p className="text-slate-500 text-sm mt-1">{notes.length} notes total</p>
          </div>
          <Link
            href="/notes/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition text-sm"
          >
            <Plus className="w-4 h-4" /> New Note
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
            <Link
              href="/notes/new"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
            >
              Create Note
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Search notes</span>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setVisibleCount(notesBatchSize);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      placeholder="Search notes..."
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as StatusFilter);
                      setVisibleCount(notesBatchSize);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                    <option value="used">Used</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Share type</span>
                  <select
                    value={shareTypeFilter}
                    onChange={(event) => {
                      setShareTypeFilter(event.target.value as ShareTypeFilter);
                      setVisibleCount(notesBatchSize);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="all">All share types</option>
                    <option value="ONE_TIME">One-time</option>
                    <option value="TIME_BASED">Time-based</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {visibleEnd} of {filteredNotes.length} matching notes
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setShareTypeFilter("all");
                      setVisibleCount(notesBatchSize);
                    }}
                    className="self-start rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 sm:self-auto"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No matching notes</h3>
                <p className="text-slate-500 text-sm">Try a different search term or filter.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleNotes.map((note, i) => {
                    const link = note.shareLinks?.[0];
                    const status = link ? getLinkStatus(link) : "active";

                    return (
                      <div
                        key={note.id}
                        className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition animate-fade-in-up"
                        style={{ animationDelay: `${Math.min(i * 60, 240)}ms` }}
                      >
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
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(note.createdAt)}</span>
                          {link && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.viewCount}</span>}
                          {link && <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{link.shareType === "ONE_TIME" ? "One-time" : "Time-based"}</span>}
                        </div>
                        <Link
                          href={`/notes/${note.id}`}
                          className="block w-full text-center bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-sm font-medium py-2 rounded-xl transition border border-slate-200 hover:border-indigo-200"
                        >
                          View Note -&gt;
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div ref={loadMoreRef} className="mt-6 border-t border-slate-200 pt-5 text-center">
                  {hasMoreNotes ? (
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
                      Loading more notes...
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">All matching notes loaded</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
