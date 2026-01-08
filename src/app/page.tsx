"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/v2/Sidebar';
import EmailList from '@/components/v2/EmailList';
import EmailDetail from '@/components/v2/EmailDetail';
import MaintenanceDashboard from '@/components/v2/MaintenanceDashboard';
import ConnectAccountModal from '@/components/v2/ConnectAccountModal';
import AddCategoryModal from '@/components/v2/AddCategoryModal';
import SignatureSettingsModal from '@/components/v2/SignatureSettingsModal';
import LiveConcierge from '@/components/v2/LiveConcierge';
import { Category, Email, Account, ThemeConfig, CustomCategory, User, ToneType, Watcher } from '@/types/v2/types';
import { MOCK_ACCOUNTS } from '@/types/v2/constants';
import { classifyEmail, researchAndDraft, refineTone, generateDraftImage } from '@/lib/v2/geminiService';
import { getSeasonalTheme, applyThemeToRoot, ThemeMode } from '@/lib/v2/themeService';
import LoginButton from '@/components/LoginButton';

const App: React.FC = () => {
    const { data: session, status } = useSession();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [activeAccountId, setActiveAccountId] = useState<string | 'all'>('all');
    const [emails, setEmails] = useState<Email[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category | string>(Category.INBOX);
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
    const [watchers, setWatchers] = useState<Watcher[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCompose, setShowCompose] = useState(false);
    const [showConnect, setShowConnect] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showSignatureSettings, setShowSignatureSettings] = useState(false);
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeVisual, setComposeVisual] = useState<string | null>(null);
    const [isAiWorking, setIsAiWorking] = useState(false);
    const [aiFilteringEnabled, setAiFilteringEnabled] = useState(true);
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [theme, setTheme] = useState<ThemeConfig>(getSeasonalTheme('light'));
    const hasAiKey = useMemo(() => {
        const key = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
        return !!key && key !== "undefined" && key !== "null" && key.trim() !== "";
    }, []);

    const activeAccount = useMemo(() => {
        return accounts.find(a => a.id === activeAccountId) || accounts[0];
    }, [accounts, activeAccountId]);

    useEffect(() => {
        // Initialize theme from localStorage
        const storedMode = localStorage.getItem('reception_theme_mode') as ThemeMode;
        if (storedMode) {
            setThemeMode(storedMode);
            const activeTheme = getSeasonalTheme(storedMode);
            setTheme(activeTheme);
            applyThemeToRoot(activeTheme);
        } else {
            const activeTheme = getSeasonalTheme('light');
            setTheme(activeTheme);
            applyThemeToRoot(activeTheme);
        }

        // Initialize accounts from localStorage
        const storedAccounts = localStorage.getItem('reception_accounts');
        if (storedAccounts) {
            try {
                const parsed = JSON.parse(storedAccounts);
                setAccounts(parsed);
                if (parsed.length > 0) setActiveAccountId(parsed[parsed.length - 1].id);
            } catch (e) {
                console.error("Failed to parse stored accounts:", e);
            }
        }

        const storedWatchers = localStorage.getItem('reception_watchers');
        if (storedWatchers) {
            try { setWatchers(JSON.parse(storedWatchers)); }
            catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        if (session?.user?.email) {
            const newAccount: Account = {
                id: session.user.email,
                email: session.user.email,
                name: session.user.name || '',
                provider: 'gmail',
                color: 'bg-indigo-600',
                initials: session.user.name?.[0]?.toUpperCase() || 'U'
            };

            setAccounts(prev => {
                const exists = prev.find(a => a.email === newAccount.email);
                if (exists) {
                    // Check if content actually changed before updating
                    const hasChanged = exists.name !== newAccount.name;
                    if (!hasChanged) return prev;
                    return prev.map(a => a.email === newAccount.email ? { ...a, ...newAccount } : a);
                }
                const updated = [...prev, newAccount];
                localStorage.setItem('reception_accounts', JSON.stringify(updated));
                return updated;
            });

            // Only update ID if not already set correctly or if switching from 'all'
            setActiveAccountId(prev => (prev === 'all' || prev === '') ? newAccount.id : prev);
        }
    }, [session]);

    const fetchEmails = useCallback(async () => {
        if (!session) {
            console.log("fetchEmails: No session found, skipping.");
            return;
        }
        console.log(`fetchEmails: Starting fetch. Accounts: ${accounts.length}, Category: ${activeCategory}, AccountId: ${activeAccountId}`);
        setIsAiWorking(true);
        try {
            let data: any[] = [];

            if (activeCategory === 'all_inboxes' || activeAccountId === 'all') {
                // Always try to fetch from all accounts endpoint if we have accounts
                if (accounts.length > 0) {
                    console.log("fetchEmails: Fetching from /api/emails/all...");
                    const response = await fetch('/api/emails/all', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emails: accounts.map(a => a.email) })
                    });
                    // Check for 401/500 explicitly
                    if (!response.ok) {
                        const err = await response.json();
                        console.warn(`fetchEmails: API Error (${response.status})`, err);
                        if (response.status === 401) {
                            alert("Your Neural Link (Session) has expired. Please sign out and sign back in to reconnect.");
                        }
                        // Stop execution if error
                        return;
                    }
                    data = await response.json();
                } else {
                    // Fallback for no accounts or single default
                    console.log("fetchEmails: No specific accounts, default fetch...");
                    const res = await fetch('/api/emails');
                    if (!res.ok) {
                        const err = await res.json();
                        if (res.status === 401) alert("Session expired. Please sign in again.");
                        throw new Error(`API Error: ${res.status}`);
                    }
                    if (!res.ok) {
                        const err = await res.json();
                        if (res.status === 401) alert("Session expired. Please sign in again.");
                        throw new Error(`API Error: ${res.status}`);
                    }
                    data = await res.json();
                }
            } else if (activeCategory === Category.TRASH) {
                console.log("fetchEmails: Fetching trash...");
                const res = await fetch('/api/emails/trash');
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                data = await res.json();
            } else {
                console.log("fetchEmails: Defaulting to /api/emails...");
                const res = await fetch('/api/emails');
                data = await res.json();
            }

            console.log(`fetchEmails: API returned ${Array.isArray(data) ? data.length : 'non-array'} items`);

            // Map data to new Email interface
            if (!Array.isArray(data)) {
                console.warn("fetchEmails: API did not return an array:", JSON.stringify(data));
                data = [];
            }
            const mappedEmails: Email[] = data.map((e: any) => ({
                id: e.id,
                accountId: e.user_email || session.user?.email || 'primary',
                senderName: e.from?.split('<')[0]?.trim() || 'Unknown',
                senderEmail: e.from?.match(/<(.+)>/)?.[1] || e.from,
                subject: e.originalSubject || e.subject,
                body: e.summary || '',
                timestamp: e.date ? new Date(e.date).toLocaleDateString() : 'Just now',
                isRead: true,
                category: mapCategory(e.category),
                summary: e.summary,
                isPriority: e.category === 'urgent',
                visualUrl: undefined
            }));

            setEmails(mappedEmails);
            console.log("fetchEmails: Successfully updated emails state.");

            // Check for watchers
            watchers.forEach(watcher => {
                const query = watcher.query.toLowerCase();
                const matched = mappedEmails.find(e =>
                    (e.senderName.toLowerCase().includes(query) ||
                        e.subject.toLowerCase().includes(query) ||
                        e.body.toLowerCase().includes(query)) &&
                    new Date(e.timestamp).getTime() > watcher.timestamp
                );

                if (matched) {
                    new Notification('Reception Watcher Match', {
                        body: `Matched: "${watcher.query}"\nFrom: ${matched.senderName}\nSubject: ${matched.subject}`,
                        icon: '/favicon.ico'
                    });
                    // Optionally remove watcher after match
                    setWatchers(prev => prev.filter(w => w.id !== watcher.id));
                }
            });
        } catch (err) {
            console.error("Failed to fetch emails:", err);
        } finally {
            setIsAiWorking(false);
        }
    }, [session, accounts, activeCategory, activeAccountId]);

    // Phase 1: Instant cache load (no Gmail calls)
    const fetchCachedEmails = useCallback(async () => {
        if (!session) return;
        try {
            const res = await fetch('/api/emails/cached');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const mappedEmails: Email[] = data.map((e: any) => ({
                    id: e.id,
                    accountId: e.user_email || session.user?.email || 'primary',
                    senderName: e.from?.split('<')[0]?.trim() || 'Unknown',
                    senderEmail: e.from?.match(/<(.+)>/)?.[1] || e.from,
                    subject: e.originalSubject || e.subject,
                    body: e.summary || '',
                    timestamp: e.date ? new Date(e.date).toLocaleDateString() : 'Just now',
                    isRead: true,
                    category: mapCategory(e.category),
                    summary: e.summary,
                    isPriority: e.category === 'urgent',
                    visualUrl: undefined
                }));
                setEmails(mappedEmails);
                console.log(`⚡ Instant load: ${mappedEmails.length} cached emails`);
            }
        } catch (err) {
            console.log('Cache unavailable, falling back to full fetch');
        }
    }, [session]);

    // Two-phase load: Instant cache, then background refresh
    useEffect(() => {
        if (session) {
            console.log("Session detected, initializing email load sequence...");
            // Phase 1: Try to show cached emails instantly
            fetchCachedEmails().finally(() => {
                // Phase 2: Always refresh from Gmail/Yahoo in background
                console.log("Triggering background fetch refresh...");
                fetchEmails();
            });
        }
    }, [session, fetchCachedEmails, fetchEmails]);

    const mapCategory = (cat: string): Category => {
        switch (cat) {
            case 'urgent': return Category.INBOX;
            case 'newsletter': return Category.PROMOTIONS;
            case 'promo': return Category.PROMOTIONS;
            case 'social': return Category.INBOX;
            case 'spam': return Category.SPAM;
            case 'trash': return Category.TRASH;
            default: return Category.INBOX;
        }
    };

    const handleCompose = (to = '', subject = '', body = '') => {
        setComposeTo(to);
        setComposeSubject(subject);
        setComposeVisual(null);
        const signature = activeAccount?.signature ? `\n\n--\n${activeAccount.signature}` : '';
        setComposeBody(body + signature);
        setShowCompose(true);
    };

    const handleGenerateVisual = async () => {
        if (!composeBody) return;
        setIsAiWorking(true);
        try {
            const img = await generateDraftImage(composeSubject || composeBody.substring(0, 50));
            setComposeVisual(img);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiWorking(false);
        }
    };

    const handleRefineTone = async (tone: ToneType) => {
        if (!composeBody) return;
        setIsAiWorking(true);
        try {
            const refined = await refineTone(composeBody, tone);
            setComposeBody(refined);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiWorking(false);
        }
    };

    const filteredEmails = useMemo(() => {
        let result = emails;

        // Filter by account if specific one is selected (unless in All view)
        if (activeAccountId !== 'all' && activeCategory !== 'all_inboxes') {
            result = result.filter(e => e.accountId === activeAccountId);
        }

        // Filter by category
        if (activeCategory === 'all_inboxes') {
            // No category filter for unified view, show all recent
        } else if (Object.values(Category).includes(activeCategory as Category)) {
            result = result.filter(email => email.category === activeCategory);
        } else {
            result = result.filter(email => email.userCategoryId === activeCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(email => email.subject.toLowerCase().includes(q) || email.senderName.toLowerCase().includes(q));
        }
        return result;
    }, [emails, activeCategory, searchQuery, activeAccountId]);

    const counts = useMemo(() => {
        const res: Record<string, number> = {};
        const contextEmails = activeAccountId === 'all' ? emails : emails.filter(e => e.accountId === activeAccountId);
        Object.values(Category).forEach(cat => res[cat] = 0);
        customCategories.forEach(cat => res[cat.id] = 0);
        contextEmails.forEach(e => {
            if (e.userCategoryId && res[e.userCategoryId] !== undefined) res[e.userCategoryId]++;
            else if (res[e.category] !== undefined) res[e.category]++;
        });
        return res;
    }, [emails, activeAccountId, customCategories]);

    const handleAction = async (action: string, body?: string) => {
        if (!selectedEmailId || !session) return;

        // Optimistic update
        if (action === 'delete') {
            setEmails(prev => prev.map(e => e.id === selectedEmailId ? { ...e, category: Category.TRASH } : e));
            setSelectedEmailId(null);
        }

        // Real backend action
        try {
            await fetch('/api/emails/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, emailId: selectedEmailId })
            });

            if (action === 'reply') {
                const email = emails.find(e => e.id === selectedEmailId);
                if (email) handleCompose(email.senderEmail, `Re: ${email.subject}`, body || '');
            }
        } catch (err) {
            console.error("Action failed:", err);
            // Rollback if critical? skipping for now for speed
        }
    };

    if (status === 'loading') return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">Initializing Neural Link...</div>;

    if (!session) return (
        <div className={`fixed inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br ${theme.bgGradient}`}>
            <div className="bg-white/10 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/20 shadow-2xl text-center">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl mb-8 mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Reception AI</h1>
                <p className="text-white/60 mb-10 font-medium">Please sign in to access your intelligent gateway.</p>
                <div className="scale-125 transform transition-all hover:scale-150 active:scale-100">
                    <LoginButton />
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex h-screen w-full bg-gradient-to-br ${theme.bgGradient} overflow-hidden seasonal-transition`}>
            <Sidebar
                activeCategory={activeCategory} setActiveCategory={setActiveCategory} onCompose={() => handleCompose()} counts={counts}
                aiFilteringEnabled={aiFilteringEnabled} setAiFilteringEnabled={setAiFilteringEnabled} accounts={accounts}
                activeAccountId={activeAccountId} setActiveAccountId={setActiveAccountId} onConnectAccount={() => setShowConnect(true)}
                activeTheme={theme} customCategories={customCategories} onAddCategory={() => setShowAddCategory(true)} onOpenSettings={() => setShowSignatureSettings(true)}
                themeMode={themeMode} onToggleTheme={() => {
                    const newMode = themeMode === 'light' ? 'dark' : 'light';
                    setThemeMode(newMode);
                    localStorage.setItem('reception_theme_mode', newMode);
                    const newTheme = getSeasonalTheme(newMode);
                    setTheme(newTheme);
                    applyThemeToRoot(newTheme);
                }}
            />

            <main className="flex flex-1 overflow-hidden relative">
                {activeCategory === Category.MAINTENANCE ? <MaintenanceDashboard emails={emails.filter(e => activeAccountId === 'all' || e.accountId === activeAccountId)} onResolve={() => { }} /> : (
                    <><EmailList emails={filteredEmails} selectedEmailId={selectedEmailId} onSelectEmail={(e) => { setSelectedEmailId(e.id); setEmails(prev => prev.map(m => m.id === e.id ? { ...m, isRead: true } : m)); }} onRescueEmail={(id) => setEmails(prev => prev.map(e => e.id === id ? { ...e, category: Category.INBOX, isSpam: false } : e))} activeCategory={activeCategory as Category} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSimulate={fetchEmails} isProcessing={isAiWorking} activeTheme={theme} />
                        <EmailDetail email={emails.find(e => e.id === selectedEmailId) || null} onAction={handleAction} onDraftReady={(d, t, s) => handleCompose(t, s, d)} activeTheme={theme} /></>
                )}

                <LiveConcierge
                    emails={emails}
                    onAddWatcher={(w) => {
                        const updated = [...watchers, w];
                        setWatchers(updated);
                        localStorage.setItem('reception_watchers', JSON.stringify(updated));
                        alert(`Neural Link: Watcher active for "${w.query}". I'll notify you when it arrives!`);
                    }}
                />

                {showCompose && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                            <div className="p-8 flex justify-between items-center text-white btn-primary">
                                <h3 className="font-bold text-xl">New Message</h3>
                                <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">✕</button>
                            </div>
                            <div className="p-10 space-y-6">
                                {composeVisual && (
                                    <div className="w-full h-40 rounded-3xl overflow-hidden shadow-inner border border-slate-100 mb-4 animate-in fade-in zoom-in duration-700">
                                        <img src={composeVisual} className="w-full h-full object-cover" alt="Draft Context" />
                                    </div>
                                )}
                                <input type="text" placeholder="Recipient" className="w-full py-2 border-b border-slate-100 outline-none font-bold" value={composeTo} onChange={e => setComposeTo(e.target.value)} />
                                <input type="text" placeholder="Subject" className="w-full py-2 border-b border-slate-100 outline-none font-bold" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
                                <textarea placeholder="Start typing..." className="w-full h-40 outline-none resize-none py-2 leading-relaxed font-medium" value={composeBody} onChange={e => setComposeBody(e.target.value)} />

                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Tone:</span>
                                        {(['Executive', 'Friendly', 'Concise', 'Urgent'] as ToneType[]).map(tone => (
                                            <button key={tone} onClick={() => handleRefineTone(tone)} disabled={isAiWorking} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-all">{tone}</button>
                                        ))}
                                        <button
                                            onClick={handleGenerateVisual}
                                            disabled={isAiWorking || !hasAiKey}
                                            className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border transition-all ${hasAiKey
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                                }`}
                                            title={hasAiKey ? 'Generate a visual context image' : 'AI API Key missing in environment'}
                                        >
                                            {isAiWorking ? 'Generating...' : '✨ Generate Visual'}
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={async () => { setIsAiWorking(true); const res = await researchAndDraft(composeSubject); setComposeBody(res); setIsAiWorking(false); }}
                                                disabled={isAiWorking || !hasAiKey}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs border transition-all ${hasAiKey
                                                    ? 'bg-slate-50 text-primary border-current hover:bg-current/10'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                ✨ Research & Draft
                                            </button>
                                            {!hasAiKey && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest animate-pulse">Key Missing in .env.local</p>}
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setShowCompose(false)} className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-xs">Discard</button>
                                            <button onClick={() => { /* Real send logic would go here if we implemented a send endpoint */ setShowCompose(false); }} className="px-10 py-2.5 btn-primary text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all">Send Now</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showConnect && (
                    <ConnectAccountModal
                        onClose={() => setShowConnect(false)}
                        onConnect={(account) => {
                            // This prop is legacy/unused by the new OAuth modal but we keep it to satisfy type
                            console.log("Connected:", account);
                            setShowConnect(false);
                        }}
                        theme={theme}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
