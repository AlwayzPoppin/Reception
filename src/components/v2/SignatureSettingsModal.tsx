"use client";


import React, { useState } from 'react';
import { Account, ThemeConfig, SignatureStyle } from '../../types/v2/types';
import { generateSignatures } from '../../lib/v2/geminiService';

interface SignatureSettingsModalProps {
  account: Account;
  theme: ThemeConfig;
  onClose: () => void;
  onSave: (signature: string) => void;
}

const SignatureSettingsModal: React.FC<SignatureSettingsModalProps> = ({ account, theme, onClose, onSave }) => {
  const [profile, setProfile] = useState({ name: account.name, role: '', company: '', extra: '' });
  const [signatures, setSignatures] = useState<{ style: SignatureStyle; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(account.signature || null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const results = await generateSignatures(profile);
      setSignatures(results);
      if (results.length > 0) setSelected(results[0].text);
    } catch (e) {
      console.error(e);
      alert("AI failed to generate signatures. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-200 h-[80vh]">
        {/* Input Sidebar */}
        <div className="md:w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Designer</h2>
            <p className="text-xs text-slate-500 font-medium">Craft your professional identity.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
              <input 
                type="text" 
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-100" 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Role / Job Title</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-100" 
                value={profile.role} 
                onChange={e => setProfile({...profile, role: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company</label>
              <input 
                type="text" 
                placeholder="e.g. Reception AI"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-100" 
                value={profile.company} 
                onChange={e => setProfile({...profile, company: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Additional Links / Info</label>
              <textarea 
                placeholder="LinkedIn, Twitter, or Website..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-100 h-24 resize-none" 
                value={profile.extra} 
                onChange={e => setProfile({...profile, extra: e.target.value})}
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full btn-primary text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? 'AI Drawing...' : '✨ Generate Options'}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-10 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-bold text-slate-800">Preview & Selection</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
            {signatures.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <span className="text-4xl mb-4">🖋️</span>
                <p className="text-slate-500 font-bold">Input your details on the left to generate AI signatures.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reception AI is designing...</p>
              </div>
            )}

            {signatures.map((sig, i) => (
              <div 
                key={i}
                onClick={() => setSelected(sig.text)}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group ${
                  selected === sig.text ? 'border-primary bg-primary-soft shadow-xl' : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    selected === sig.text ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {sig.style}
                  </span>
                  {selected === sig.text && (
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  )}
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700">
                  {sig.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button onClick={onClose} className="px-6 py-3 rounded-xl text-slate-400 font-bold">Cancel</button>
            <button 
              onClick={() => selected && onSave(selected)}
              disabled={!selected}
              className={`px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                selected ? 'btn-primary' : 'bg-slate-200 cursor-not-allowed'
              }`}
            >
              Use This Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureSettingsModal;
