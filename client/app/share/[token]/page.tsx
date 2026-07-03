"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, Lock, Clock, Ban, CheckCircle, AlertTriangle, Eye } from "lucide-react";
import { useShare, type ShareState, type ShareNoteData } from "@/hooks/useShare";

export default function ShareTokenPage() {
  const params = useParams();
  const { resolveToken, unlockWithPassword } = useShare();
  const [state, setState] = useState<ShareState>("loading");
  const [data, setData] = useState<ShareNoteData | undefined>();
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    resolveToken(params.token as string).then(({ state: s, data: d }) => {
      setState(s);
      setData(d);
    });
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    const { state: s, data: d } = await unlockWithPassword(params.token as string, password);
    if (s === "wrong-password") { setShake(true); setTimeout(() => setShake(false), 500); }
    setState(s);
    setData(d);
    setUnlocking(false);
  };

  if (state === "loading") return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (state === "unlocked" && data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">NoteShare</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{data.title}</h1>
          <div className="h-px bg-slate-100 mb-4" />
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.content}</p>
          <div className="h-px bg-slate-100 mt-6 mb-4" />
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Eye className="w-4 h-4" />
            <span>Viewed {data.viewCount} time{data.viewCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const stateConfig: Record<string, { icon: React.ReactNode; title: string; subtitle: string; color: string }> = {
    invalid: { icon: <AlertTriangle className="w-8 h-8 text-slate-400" />, title: "Link Not Found", subtitle: "This link may be invalid or has been deleted.", color: "bg-slate-100" },
    expired: { icon: <Clock className="w-8 h-8 text-orange-400" />, title: "Link Expired", subtitle: "This share link has passed its expiry time.", color: "bg-orange-50" },
    revoked: { icon: <Ban className="w-8 h-8 text-red-400" />, title: "Link Revoked", subtitle: "This link has been revoked by the owner.", color: "bg-red-50" },
    used: { icon: <CheckCircle className="w-8 h-8 text-slate-400" />, title: "Link Already Used", subtitle: "This one-time link has already been accessed.", color: "bg-slate-50" },
    "too-many-attempts": { icon: <Shield className="w-8 h-8 text-red-400" />, title: "Too Many Attempts", subtitle: "Please try again in 15 minutes.", color: "bg-red-50" },
  };

  if (state in stateConfig) {
    const cfg = stateConfig[state];
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">NoteShare</span>
          </div>
          <div className={`${cfg.color} rounded-2xl border border-slate-100 p-8 text-center shadow-xl`}>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              {cfg.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{cfg.title}</h2>
            <p className="text-slate-500 text-sm">{cfg.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">NoteShare</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Protected Note</h2>
          <p className="text-slate-500 text-sm text-center mb-6">Enter the access key to view this note</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access key"
              className={`w-full px-4 py-3 border-2 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${shake ? "animate-shake border-red-400" : state === "wrong-password" ? "border-red-300 bg-red-50" : "border-slate-200"}`}
              required
            />
            {state === "wrong-password" && (
              <p className="text-red-500 text-sm text-center">Incorrect access key. Please try again.</p>
            )}
            <button type="submit" disabled={unlocking}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2">
              {unlocking ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Unlocking...</> : "Unlock Note"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}