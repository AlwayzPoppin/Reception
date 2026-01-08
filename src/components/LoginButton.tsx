"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export default function LoginButton() {
    const { data: session } = useSession();
    const [showProviders, setShowProviders] = useState(false);

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {session.user?.image && (
                        <Image
                            src={session.user.image}
                            alt="User Avatar"
                            width={32}
                            height={32}
                            className="rounded-full border border-slate-700"
                        />
                    )}
                    <div className="hidden sm:flex flex-col">
                        <span className="text-sm text-slate-300">{session.user?.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {session.provider === 'yahoo' ? '📧 Yahoo' : '📧 Gmail'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="text-xs px-3 py-1.5 rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowProviders(!showProviders)}
                className="text-sm px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium shadow-sm shadow-emerald-900/20"
            >
                Sign In
            </button>

            {showProviders && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button
                        onClick={() => { signIn("google"); setShowProviders(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                    >
                        <span className="text-lg">🔴</span>
                        <span>Google / Gmail</span>
                    </button>
                    <button
                        onClick={() => { signIn("yahoo"); setShowProviders(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-3 border-t border-slate-700 transition-colors"
                    >
                        <span className="text-lg">🟣</span>
                        <span>Yahoo Mail</span>
                    </button>
                </div>
            )}
        </div>
    );
}
