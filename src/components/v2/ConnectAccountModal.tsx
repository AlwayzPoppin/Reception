"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Account, Provider, ThemeConfig } from '../../types/v2/types';

interface ConnectAccountModalProps {
  onClose: () => void;
  onConnect: (account: Account) => void;
  theme: ThemeConfig;
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({ onClose, theme }) => {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const handleConnect = async (provider: Provider) => {
    setLoadingProvider(provider);
    if (provider === 'gmail') {
      await signIn('google'); // Triggers exact same flow as initial login
    } else if (provider === 'yahoo' as Provider) { // Cast as Provider to match type if needed, though 'yahoo' should be added to type
      await signIn('yahoo');
    } else {
      alert("This provider is coming soon.");
      setLoadingProvider(null);
    }
  };

  const providers = [
    { id: 'gmail', label: 'Gmail', color: 'bg-red-500', icon: 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z' },
    { id: 'yahoo', label: 'Yahoo', color: 'bg-purple-600', icon: 'M16.5 2h-2.5l-4 9.5L6 2H3.5l6 14v6h3v-6l6-14z' }, // Simplified Y icon path
    { id: 'outlook', label: 'Outlook', color: 'bg-blue-500', icon: 'M21 16.03V8.81l-7.78-5.63L3.8 8.01v9.18l7.6 4.38 9.6-5.54zM11.5 17l-4-2.3v-4l4 2.3V17zm0-5.8l-4-2.3 4-2.3 4 2.3-4 2.3z' }, // Generic envelopeish placeholder or specific
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
        <div className="p-12 relative overflow-hidden">
          {/* Background Decoration */}
          <div className={`absolute top-0 right-0 w-64 h-64 bg-${theme.primary}/10 rounded-full blur-3xl -mr-32 -mt-32`}></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Add Account</h2>
                <p className="text-slate-500 font-medium">Connect another provider to your Neural Link.</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleConnect(p.id as Provider)}
                  disabled={!!loadingProvider}
                  className={`group relative p-6 rounded-3xl border-2 border-slate-100 hover:border-${theme.primary} hover:bg-${theme.primary}/5 transition-all text-left flex items-center gap-5 overflow-hidden ${loadingProvider === p.id ? 'opacity-75 cursor-wait' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d={p.icon} /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{p.label}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{loadingProvider === p.id ? 'Connecting...' : 'Connect via OAuth'}</p>
                  </div>
                </button>
              ))}

              <button className="group relative p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left flex items-center gap-5 opacity-60">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-500 text-lg">IMAP / POP3</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Coming Soon</p>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">
                Secure Connection • OAuth 2.0 Encrypted Tunnel • Read/Write Access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectAccountModal;
