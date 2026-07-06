"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Shield } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useNotes } from "@/hooks/useNotes";
import { useAuth } from "@/hooks/useAuth";
import { normalizeShareUrlForClient } from "@/lib/utils";

export default function NewNotePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { createNote, createShareLink } = useNotes();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [shareType, setShareType] = useState<"ONE_TIME" | "TIME_BASED">("TIME_BASED");
  const [accessType, setAccessType] = useState<"PUBLIC" | "PASSWORD">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [noteId, setNoteId] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, []);

  const copy = async (text: string, which: "url" | "key") => {
    await navigator.clipboard.writeText(text);
    if (which === "url") { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
    else { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiresAt) { toast.error("Please select an expiry date"); return; }
    if (new Date(expiresAt) <= new Date()) { toast.error("Expiry must be in the future"); return; }
    setLoading(true);
    try {
      const note = await createNote(title, content);
      setNoteId(note.id);
      const res = await createShareLink(note.id, {
        shareType,
        accessType,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      const clientShareUrl = normalizeShareUrlForClient(res.shareUrl);
      setShareUrl(clientShareUrl);
      sessionStorage.setItem(`note:${note.id}:shareUrl`, clientShareUrl);
      localStorage.setItem(`note:${note.id}:shareUrl`, clientShareUrl);
      setAccessKey(res.rawAccessKey);
      setSuccess(true);
      toast.success("Note created and share link generated!");
    } catch (err: unknown) {
      const e = err as { message: string };
      toast.error(e?.message || "Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Note Created!</h2>
            <p className="text-slate-500 text-sm mb-8">Your share link is ready. Share it securely.</p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Share URL</label>
                <div className="flex gap-2">
                  <input readOnly value={shareUrl}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-700" />
                  <button onClick={() => copy(shareUrl, "url")}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-2 text-sm font-medium min-w-25 justify-center">
                    {copiedUrl ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                  </button>
                </div>
              </div>

              {accessKey && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Access Key <span className="text-red-500 text-xs">(shown once only)</span></label>
                  <div className="flex gap-2">
                    <input readOnly value={accessKey}
                      className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-xl text-sm bg-indigo-50 font-mono text-indigo-800 tracking-widest" />
                    <button onClick={() => copy(accessKey, "key")}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-2 text-sm font-medium min-w-25 justify-center">
                      {copiedKey ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <Link href={`/notes/${noteId}`}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-center transition text-sm">
                View Note Details
              </Link>
              <button onClick={() => { setSuccess(false); setTitle(""); setContent(""); setExpiresAt(""); }}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-2.5 rounded-xl transition text-sm">
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/notes" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> My Notes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New Note</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Write your note content here..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Expires At</label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" required />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Share Type</label>
            <div className="grid grid-cols-2 gap-3">
              {([["ONE_TIME", "One-time Access", "Link expires after first successful view"],
              ["TIME_BASED", "Time-based Access", "Link expires at the selected date/time"]] as const).map(([val, label, desc]) => (
                <button key={val} type="button" onClick={() => setShareType(val)}
                  className={`p-4 rounded-xl border-2 text-left transition ${shareType === val ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="font-medium text-slate-900 text-sm">{label}</div>
                  <div className="text-xs text-slate-500 mt-1">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Access Type</label>
            <div className="grid grid-cols-2 gap-3">
              {([["PUBLIC", "Public", "Anyone with the link can view"],
              ["PASSWORD", "Password Protected", "Requires an access key to unlock"]] as const).map(([val, label, desc]) => (
                <button key={val} type="button" onClick={() => setAccessType(val)}
                  className={`p-4 rounded-xl border-2 text-left transition ${accessType === val ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="font-medium text-slate-900 text-sm">{label}</div>
                  <div className="text-xs text-slate-500 mt-1">{desc}</div>
                </button>
              ))}
            </div>
            {accessType === "PASSWORD" && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in-up">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Access key will be generated after creation</span>
                </div>
                <p className="text-xs text-amber-700 mt-1">Save it immediately — it will only be shown once.</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : "Create & Generate Share Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
