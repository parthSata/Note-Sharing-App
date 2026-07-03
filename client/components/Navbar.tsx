"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Plus, LogOut } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

type StoredUser = {
  email?: string;
};

export function Navbar() {
  const router = useRouter();
  const userSnapshot = useSyncExternalStore(subscribeToAuthUser, getAuthUserSnapshot, getServerAuthUserSnapshot);
  const user = useMemo(() => parseStoredUser(userSnapshot), [userSnapshot]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    window.dispatchEvent(new Event("auth_user_changed"));
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/notes" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">NoteShare</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
          <Link href="/notes/new"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            <Plus className="w-4 h-4" /> New Note
          </Link>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm px-3 py-2 rounded-xl hover:bg-slate-100 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

function subscribeToAuthUser(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("auth_user_changed", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("auth_user_changed", onStoreChange);
  };
}

function getAuthUserSnapshot() {
  return localStorage.getItem("auth_user") || "{}";
}

function getServerAuthUserSnapshot() {
  return "{}";
}

function parseStoredUser(value: string): StoredUser {
  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return {};
  }
}
