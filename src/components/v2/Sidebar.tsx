"use client";


import React from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Category, Account, ThemeConfig, CustomCategory } from '../../types/v2/types';

interface SidebarProps {
  activeCategory: Category | string;
  setActiveCategory: (category: Category | string) => void;
  onCompose: () => void;
  counts: Record<string, number>;
  aiFilteringEnabled: boolean;
  setAiFilteringEnabled: (enabled: boolean) => void;
  accounts: Account[];
  activeAccountId: string | 'all';
  setActiveAccountId: (id: string | 'all') => void;
  onConnectAccount: () => void;
  activeTheme: ThemeConfig;
  customCategories: CustomCategory[];
  onAddCategory: () => void;
  onOpenSettings: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeCategory,
  setActiveCategory,
  onCompose,
  counts,
  aiFilteringEnabled,
  setAiFilteringEnabled,
  accounts,
  activeAccountId,
  setActiveAccountId,
  onConnectAccount,
  activeTheme,
  customCategories,
  onAddCategory,
  onOpenSettings,
  themeMode,
  onToggleTheme
}) => {
  const systemItems = [
    { id: Category.INBOX, label: 'Inbox', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: Category.STARRED, label: 'Starred', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { id: Category.SENT, label: 'Sent', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
    { id: Category.PROMOTIONS, label: 'Promotions', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { id: Category.SPAM, label: 'Spam', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z' },
    { id: Category.TRASH, label: 'Trash', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  ];

  return (
    <div className="flex h-screen bg-surface seasonal-transition">
      {/* Account Switcher Rail */}
      <div className="w-20 border-r border-default flex flex-col items-center py-6 gap-6 bg-background/50 shrink-0">
        <button
          onClick={() => setActiveAccountId('all')}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeAccountId === 'all' ? `bg-slate-900 text-white shadow-lg` : 'bg-white text-slate-400 hover:bg-slate-100 shadow-sm'
            }`}
          title="All Accounts"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>

        <div className="w-8 border-t border-slate-200" />

        {accounts.map(account => (
          <button
            key={account.id}
            onClick={() => setActiveAccountId(account.id)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all relative group ${activeAccountId === account.id ? 'scale-110 shadow-xl ring-2 ring-slate-900/10' : 'opacity-60 hover:opacity-100 hover:scale-105'
              } ${account.color} text-white`}
          >
            {account.initials}
          </button>
        ))}

        <button
          onClick={onConnectAccount}
          className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-slate-400 hover:text-slate-400 transition-all"
          title="Connect new account"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>

        <button
          onClick={() => signOut()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
          title="Sign Out"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>

        <button
          onClick={onToggleTheme}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-all mt-auto mb-2"
          title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {themeMode === 'light' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95l.707.707M7.657 7.657l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-all mb-6"
          title="AI Signature Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      {/* Main Category Sidebar */}
      <div className="w-64 border-r border-default h-screen p-6 flex flex-col hidden md:flex shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2 grayscale-[0.2] hover:grayscale-0 transition-all duration-300">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-slate-800 overflow-hidden shrink-0">
            <img src="/icon.png" alt="Reception AI" className="w-full h-full object-cover scale-110" />
          </div>
          <h1 className="text-xl font-black text-foreground tracking-tightest">Reception</h1>
        </div>

        <button
          onClick={onCompose}
          className="w-full btn-primary hover:opacity-90 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] mb-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Compose
        </button>

        <nav className="space-y-1 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4">Core Channels</p>

          {systemItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveCategory(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeCategory === item.id
                ? 'bg-primary-soft text-primary'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-4">
                <svg className={`w-5 h-5 ${activeCategory === item.id ? 'text-primary' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </div>
              {counts[item.id] > 0 && <span className="text-[10px] font-black">{counts[item.id]}</span>}
            </button>
          ))}

          {customCategories.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 mt-8 mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Smart Labels</p>
                <button onClick={onAddCategory} className="text-primary hover:opacity-70 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              {customCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeCategory === category.id
                    ? 'bg-primary-soft text-primary'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                    {category.name}
                  </div>
                  {counts[category.id] > 0 && <span className="text-[10px] font-black">{counts[category.id]}</span>}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
          <div className="p-4 bg-primary-soft rounded-2xl border border-current/10 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeTheme.icon}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activeTheme.name}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-primary-soft accent-glow animate-pulse" style={{ backgroundColor: 'var(--theme-accent)' }}></div>
          </div>

          <div className="p-5 bg-slate-900 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full blur-2xl opacity-40" style={{ backgroundColor: 'var(--theme-accent)' }}></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">SafeShield</p>
                <p className="text-xs text-white font-bold">Auto-Filtering</p>
              </div>
              <button
                onClick={() => setAiFilteringEnabled(!aiFilteringEnabled)}
                className={`relative inline-flex h-5 w-10 cursor-pointer rounded-full transition-all duration-300 ${aiFilteringEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 mt-0.5 ml-0.5 ${aiFilteringEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
