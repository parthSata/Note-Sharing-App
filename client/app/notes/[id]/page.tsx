"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useNotes, type Note } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { normalizeShareUrlForClient } from "@/lib/utils";

function getLinkStatus(link: Note["shareLinks"][0]) {
  if (link.revokedAt) return { label: "Revoked", color: "bg-red-100 text-red-600" };
  if (link.consumedAt) return { label: "Used", color: "bg-orange-100 text-orange-600" };
  if (new Date(link.expiresAt) < new Date()) return { label: "Expired", color: "bg-slate-100 text-slate-600" };
  return { label: "Active", color: "bg-emerald-100 text-emerald-700" };
}

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoggedIn } = useAuth();
  const { getNote, revokeShareLink } = useNotes();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storedShareUrl, setStoredShareUrl] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    getNote(params.id as string)
      .then((nextNote) => {
        setNote(nextNote);
        setStoredShareUrl(sessionStorage.getItem(`note:${nextNote.id}:shareUrl`) || "");
      })
      .catch(() => toast.error("Note not found"))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async () => {
    if (!note?.shareLinks?.[0]) return;
    setRevoking(true);
    try {
      await revokeShareLink(note.id, note.shareLinks[0].id);
      const updated = await getNote(note.id);
      setNote(updated);
      toast.success("Share link revoked");
      setShowConfirm(false);
    } catch {
      toast.error("Failed to revoke link");
    } finally {
      setRevoking(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse h-40" />)}
      </div>
    </div>
  );

  if (!note) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="text-center py-24">
        <h3 className="text-lg font-semibold text-slate-700">Note not found</h3>
        <Link href="/notes" className="text-indigo-600 text-sm mt-2 block">← Back to notes</Link>
      </div>
    </div>
  );

  const link = note.shareLinks?.[0];
  const status = link ? getLinkStatus(link) : null;
  const rawShareUrl =
    link?.shareUrl ||
    storedShareUrl ||
    (link?.token && typeof window !== "undefined"
      ? `${window.location.origin}/share/${link.token}`
      : "");
  const shareUrl = normalizeShareUrlForClient(rawShareUrl);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/notes" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> My Notes
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{note.title}</h1>
          <p className="text-slate-500 text-sm mb-4">{new Date(note.createdAt).toLocaleString()}</p>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          </div>
        </div>

        {link && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Share Link</h2>
              {status && (
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Share Type</div>
                <div className="font-medium text-slate-800">{link.shareType === "ONE_TIME" ? "One-time" : "Time-based"}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Access Type</div>
                <div className="font-medium text-slate-800">{link.accessType === "PUBLIC" ? "Public" : "Password Protected"}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Expires At</div>
                <div className="font-medium text-slate-800">{new Date(link.expiresAt).toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">View Count</div>
                <div className="font-medium text-slate-800 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-indigo-500" />{link.viewCount} views</div>
              </div>
            </div>

            {shareUrl && (
              <div className="mb-4">
                <label className="block text-xs text-slate-500 mb-1.5">Share URL</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={shareUrl}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-700" />
                  <button onClick={() => copy(shareUrl)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 text-sm">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>
                  <Link href={shareUrl}
                    className="px-3 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition text-center text-sm font-medium">
                    Open
                  </Link>
                </div>
              </div>
            )}

            {!link.revokedAt && (
              <button onClick={() => setShowConfirm(true)}
                className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl transition text-sm">
                Revoke Share Link
              </button>
            )}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Revoke Share Link?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">This will permanently disable the share link. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm font-medium">Cancel</button>
              <button onClick={handleRevoke} disabled={revoking}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition text-sm font-medium flex items-center justify-center gap-2">
                {revoking ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Revoke Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
