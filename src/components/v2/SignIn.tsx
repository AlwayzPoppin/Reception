"use client";


import React, { useState } from 'react';
import { ThemeConfig, User } from '../../types/v2/types';

interface SignInProps {
  theme: ThemeConfig;
  onSignIn: (user: User) => void;
}

const SignIn: React.FC<SignInProps> = ({ theme, onSignIn }) => {
  const [email, setEmail] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    // Simulate high-end AI auth process
    setTimeout(() => {
      onSignIn({
        id: 'user_123',
        name: 'Alex Rivera',
        email: email || 'alex@example.com',
        avatar: 'https://i.pravatar.cc/150?u=alex'
      });
    }, 1500);
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 seasonal-transition bg-gradient-to-br ${theme.bgGradient}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 bg-primary-soft accent-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 bg-white shadow-2xl"></div>
      </div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-700">
        <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden">
          <div className="p-12">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 btn-primary rounded-3xl flex items-center justify-center shadow-2xl mb-6 animate-bounce-slow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Reception AI</h1>
              <p className="text-slate-500 font-medium">Your intelligent gateway to focus.</p>
            </div>

            {isAuthenticating ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-6">
                <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Biometric Sync</p>
                  <p className="text-sm text-slate-400 font-medium">Establishing secure neural link...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDemoSignIn} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Work Identity</label>
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    className="w-full bg-slate-50/50 border-2 border-transparent focus:border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all placeholder:text-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full btn-primary text-white font-black py-5 rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Enter Workspace
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-300 bg-transparent px-2">
                    <span className="bg-white/80 px-4">Social Access</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={handleDemoSignIn} className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all font-bold text-xs text-slate-600">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </button>
                  <button type="button" onClick={handleDemoSignIn} className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all font-bold text-xs text-slate-600">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                    Outlook
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-slate-50 p-8 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Secured by Reception <span className="text-primary">SafeShield™</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
