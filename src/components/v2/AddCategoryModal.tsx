"use client";


import React, { useState } from 'react';
import { ThemeConfig, CustomCategory } from '../../types/v2/types';

interface AddCategoryModalProps {
  onClose: () => void;
  onSave: (category: CustomCategory) => void;
  theme: ThemeConfig;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onSave, theme }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-indigo-500');

  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
    'bg-cyan-500', 'bg-purple-500', 'bg-slate-700', 'bg-pink-500'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    
    onSave({
      id: `cat_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      color
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
        <div className="p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart Label</h2>
              <p className="text-sm text-slate-500">Train AI to sort your mail automatically.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Label Name</label>
                <input 
                    type="text" 
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none" 
                    placeholder="e.g. Travel Plans, Invoices" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">AI Context / Instructions</label>
                <textarea 
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-slate-200 outline-none h-24 resize-none" 
                    placeholder="Describe what belongs here (e.g. 'Emails about my upcoming trip to Japan including flights and hotel receipts')" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    required 
                />
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Label Color</label>
                <div className="flex gap-2 flex-wrap">
                    {colors.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full transition-all ${c} ${color === c ? 'ring-4 ring-slate-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                    ))}
                </div>
            </div>

            <button 
                type="submit"
                className={`w-full bg-${theme.secondary} hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 mt-8 active:scale-95`}
            >
                Create Smart Rule
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
