"use client";


import React, { useState, useEffect, useMemo } from 'react';
import { Email, Category, ThemeConfig } from '../../types/v2/types';
import { generateSpeech, getMapsContext, extractTasks, translateText, generateSmartReplies } from '../../lib/v2/geminiService';

interface EmailDetailProps {
  email: Email | null;
  onAction: (action: 'reply' | 'delete' | 'star' | 'rescue', body?: string) => void;
  onDraftReady: (draft: string, to: string, subject: string) => void;
  activeTheme: ThemeConfig;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, onAction, onDraftReady, activeTheme }) => {
  const [tasks, setTasks] = useState<string[]>([]);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [mapsContext, setMapsContext] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalBody, setOriginalBody] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [fullOriginalBody, setFullOriginalBody] = useState<string | null>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);

  const hasAiKey = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    return !!key && key !== "undefined" && key !== "null" && key.trim() !== "";
  }, []);

  useEffect(() => {
    setTasks([]);
    setSmartReplies([]);
    setMapsContext(null);
    setIsTranslated(false);
    setOriginalBody(email?.body || null);
    setTranslatedBody(null);
    setShowOriginal(false);
    setFullOriginalBody(null);

    if (email && hasAiKey) {
      handleExtractTasks();
      handleGenerateReplies();
      if (email.body.toLowerCase().includes('location') ||
        email.body.toLowerCase().includes('address') ||
        email.body.toLowerCase().includes('meet at')) {
        handleFetchMaps();
      }
    }
  }, [email?.id, hasAiKey]);

  const readingTime = useMemo(() => {
    if (!email) return 0;
    const words = email.body.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [email]);

  const handleExtractTasks = async () => {
    if (!email) return;
    setLoadingTasks(true);
    try {
      const result = await extractTasks(email.body);
      setTasks(result);
    } catch (e) {
      console.error("Failed to extract tasks:", e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleGenerateReplies = async () => {
    if (!email) return;
    setLoadingReplies(true);
    try {
      const replies = await generateSmartReplies(email.body);
      setSmartReplies(replies);
    } catch (e) {
      console.error("Smart replies failed:", e);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleFetchMaps = async () => {
    if (!email) return;
    try {
      const context = await getMapsContext(email.body);
      setMapsContext(context);
    } catch (e) {
      console.error("Failed to fetch maps context:", e);
    }
  };

  const handleTranslate = async () => {
    if (!email || !originalBody) return;
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedBody) {
      setIsTranslated(true);
      return;
    }

    setLoadingTranslation(true);
    try {
      const result = await translateText(originalBody, "English");
      setTranslatedBody(result);
      setIsTranslated(true);
    } catch (e) {
      console.error("Translation failed:", e);
    } finally {
      setLoadingTranslation(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!email) return;
    setLoadingAudio(true);
    try {
      const textToRead = summary || (isTranslated ? translatedBody : email.body)?.substring(0, 300) || "";
      const base64Audio = await generateSpeech(textToRead);
      if (base64Audio) {
        alert("Reception: Audio brief is ready. (Simulated playback)");
      }
    } catch (e) {
      console.error("Audio failed:", e);
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleFetchOriginal = async () => {
    if (!email || fullOriginalBody) {
      setShowOriginal(!showOriginal);
      return;
    }
    setLoadingOriginal(true);
    try {
      const res = await fetch(`/api/emails/${email.id}`);
      const data = await res.json();
      if (data.body) {
        setFullOriginalBody(data.body);
        setShowOriginal(true);
      }
    } catch (e) {
      console.error("Failed to fetch original email:", e);
    } finally {
      setLoadingOriginal(false);
    }
  };

  if (!email) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center flex-[2] bg-surface/40 h-screen text-secondary-text p-8 text-center">
        <div className="w-24 h-24 bg-surface/50 rounded-full flex items-center justify-center mb-4 opacity-50 border border-default">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-foreground font-bold">No Email Selected</h3>
        <p className="text-sm max-w-[240px] text-secondary-text">Select a message from the list to start your intelligent workflow.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-[2] bg-surface/60 backdrop-blur-md h-screen overflow-hidden animate-in fade-in duration-300">
      {/* Security Banner if Spam */}
      {email.isSpam && (
        <div className="bg-rose-600 text-white px-8 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" /></svg>
            <div className="text-sm">
              <span className="font-black uppercase tracking-widest text-[10px] mr-2">Security Warning:</span>
              <span className="font-medium">{email.suspiciousReason || "This message has been flagged as suspicious by Reception AI."}</span>
            </div>
          </div>
          <button
            onClick={() => onAction('rescue')}
            className="bg-white/10 hover:bg-white/20 px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Not Spam?
          </button>
        </div>
      )}

      {/* Top Header Actions */}
      <div className="flex items-center justify-between p-4 border-b border-default sticky top-0 bg-surface/80 backdrop-blur-sm z-10">
        <div className="flex gap-2">
          <button
            onClick={() => onAction('reply')}
            className={`px-4 py-2 bg-${activeTheme.primary} text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg active:scale-95 btn-primary`}
          >
            Reply
          </button>
          <button
            onClick={() => onAction('star')}
            className={`p-2 hover:bg-slate-100 rounded-xl transition-colors ${email.category === Category.STARRED ? 'text-amber-500 bg-amber-50' : 'text-slate-400'}`}
          >
            <svg className="w-5 h-5" fill={email.category === Category.STARRED ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            onClick={() => onAction('delete')}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Context: {activeTheme.name}</span>
          <span className="text-xl">{activeTheme.icon}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8">
        <header>
          <h1 className="text-3xl font-black text-foreground leading-tight mb-4 tracking-tight">{email.subject}</h1>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold`} style={{ backgroundColor: 'var(--theme-primary)' }}>
                {email.senderName[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{email.senderName}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-secondary-text">{email.senderEmail} • {email.timestamp}</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold">{readingTime} min read</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Replies Row */}
            <div className="flex gap-2">
              {!hasAiKey ? (
                <button disabled className="px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed">
                  AI Offline (No Key)
                </button>
              ) : loadingReplies ? (
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse"></div>
                  <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse"></div>
                </div>
              ) : smartReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => onAction('reply', reply)}
                  className="px-4 py-2 rounded-full border border-slate-200 bg-white/50 hover:bg-white hover:border-slate-400 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95 shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* AI Command Center */}
        <section className={`p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border-4 border-white/5`}>
          <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-[60px] opacity-40 transition-all group-hover:opacity-60`} style={{ backgroundColor: 'var(--theme-accent)' }}></div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md`}>
                <svg className={`w-6 h-6`} style={{ color: 'var(--theme-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">Command Center</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Gemini 3 Intelligence</p>
              </div>
            </div>
            {email.detectedLanguage && (
              <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300">
                Source: {email.detectedLanguage}
              </div>
            )}
          </div>

          {/* Extracted Tasks Checklist */}
          {loadingTasks ? (
            <div className="mb-8 space-y-3 animate-pulse">
              <div className="h-3 w-32 bg-white/10 rounded-full"></div>
              <div className="h-10 w-full bg-white/5 rounded-2xl"></div>
            </div>
          ) : tasks.length > 0 && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4`} style={{ color: 'var(--theme-accent)' }}>Extracted Action Items</p>
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group/task hover:bg-white/10 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      className={`w-5 h-5 rounded-lg border-white/20 bg-transparent focus:ring-0 cursor-pointer`}
                    />
                    <span className="text-xs text-slate-300 font-semibold group-hover/task:text-white transition-colors">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick AI Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGenerateAudio}
              disabled={loadingAudio || !hasAiKey}
              className={`flex items-center justify-between p-5 rounded-3xl border transition-all text-left ${hasAiKey ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              title={!hasAiKey ? 'AI API Key missing' : 'Listen to brief'}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-200">Audio</p>
                {!hasAiKey && <p className="text-[8px] text-rose-400 font-bold uppercase mt-1">No Key</p>}
              </div>
              {loadingAudio ? (
                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent animate-spin rounded-full"></div>
              ) : <span className="text-sm">🔊</span>}
            </button>

            <button
              onClick={handleTranslate}
              disabled={loadingTranslation || !hasAiKey}
              className={`flex items-center justify-between p-5 rounded-3xl border transition-all text-left ${isTranslated ? 'bg-indigo-600 border-indigo-400' :
                hasAiKey ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              title={!hasAiKey ? 'AI API Key missing' : 'Translate content'}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-200">{isTranslated ? 'Original' : 'Translate'}</p>
                {!hasAiKey && <p className="text-[8px] text-rose-400 font-bold uppercase mt-1">No Key</p>}
              </div>
              {loadingTranslation ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
              ) : <span className="text-sm">🌍</span>}
            </button>
          </div>
        </section>

        {/* Email Body Content */}
        <section className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 hidden lg:block"></div>

          <div className="flex gap-6 items-start">
            <div className={`w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-400 z-10 hidden lg:flex`}>
              1
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 w-full relative">
              {/* Toggle between summary and original */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleFetchOriginal}
                  disabled={loadingOriginal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all"
                >
                  {loadingOriginal ? (
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {showOriginal ? 'View Summary' : 'View Original'}
                </button>
              </div>

              <div className={`text-sm text-slate-700 leading-relaxed font-medium transition-all duration-500 ${loadingTranslation || loadingOriginal ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}>
                {showOriginal && fullOriginalBody ? (
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: fullOriginalBody.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') }} />
                ) : (
                  <div className="whitespace-pre-wrap">
                    {isTranslated ? translatedBody : email.body}
                  </div>
                )}
              </div>

              {mapsContext && (
                <div className="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 text-xs text-indigo-900 flex items-start gap-4 animate-in zoom-in-95 duration-500">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-widest text-[10px] text-indigo-500 mb-1">AI Place Intelligence</p>
                    <p className="leading-relaxed">{mapsContext}</p>
                    <button className="mt-3 text-[10px] font-black uppercase text-indigo-600 hover:underline">Open in Google Maps</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default EmailDetail;
