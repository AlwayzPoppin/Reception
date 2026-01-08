"use client";


import React from 'react';
import { Email, Category, ThemeConfig } from '../../types/v2/types';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  onRescueEmail: (emailId: string) => void;
  activeCategory: Category | string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSimulate: () => void;
  isProcessing: boolean;
  activeTheme: ThemeConfig;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onRescueEmail,
  activeCategory,
  searchQuery,
  setSearchQuery,
  onSimulate,
  isProcessing,
  activeTheme
}) => {
  const displayTitle = activeCategory === 'all_inboxes' ? 'All Inboxes' : activeCategory;

  return (
    <div className="flex-1 bg-surface/80 backdrop-blur-md border-r border-default overflow-y-auto h-screen custom-scrollbar">
      <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-default/30 p-4 z-10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground truncate uppercase tracking-tight">{displayTitle}</h2>
          <button onClick={onSimulate} disabled={isProcessing} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <svg className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200" />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className={`p-4 cursor-pointer transition-all relative hover:bg-slate-50 border-l-4 ${selectedEmailId === email.id ? `bg-indigo-50/30 border-indigo-600 shadow-sm` : 'border-transparent'
              } ${email.isPriority ? 'ring-2 ring-indigo-400/20 m-1 rounded-xl' : ''}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`font-semibold text-sm ${email.isRead ? 'text-slate-500' : 'text-slate-900'}`}>{email.senderName}</span>
              <span className="text-[10px] text-slate-400 font-bold">{email.timestamp}</span>
            </div>
            <div className={`text-sm truncate mb-0.5 ${email.isRead ? 'text-slate-500' : 'text-slate-800 font-bold'}`}>
              {email.subject}
            </div>

            <div className="flex flex-wrap items-center gap-2 my-2">
              {email.isPriority && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-600 text-white flex items-center gap-1 animate-pulse">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Urgent
                </span>
              )}
              {email.isSpam && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-600 text-white">Spam</span>}
              {email.sentiment && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{email.sentiment}</span>}
            </div>

            <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{email.summary || email.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;
