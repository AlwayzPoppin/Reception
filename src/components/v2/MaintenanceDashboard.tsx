"use client";


import React, { useState, useEffect } from 'react';
import { Email, MaintenanceAction } from '../../types/v2/types';
import { performMaintenanceAudit } from '../../lib/v2/geminiService';

interface MaintenanceDashboardProps {
  emails: Email[];
  onResolve: (emailIds: string[]) => void;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ emails, onResolve }) => {
  const [actions, setActions] = useState<MaintenanceAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAudit = async () => {
      setLoading(true);
      try {
        const audit = await performMaintenanceAudit(emails);
        setActions(audit);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    runAudit();
  }, [emails.length]);

  return (
    <div className="flex-1 bg-white h-screen overflow-y-auto p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Cleanup Assistant</h1>
            <p className="text-slate-500 font-medium">Reception AI has audited your mailbox to save you time.</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Inbox Health</p>
            <p className="text-3xl font-black text-indigo-600">84%</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800">Thinking through your inbox...</h3>
              <p className="text-sm text-slate-400">Gemini 3 Pro is auditing 32768 tokens of context.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {actions.map((action) => (
              <div key={action.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-indigo-200 transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                      action.impact === 'High' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border border-slate-200'
                    }`}>
                      {action.impact} Impact
                    </span>
                    <span className="text-xs font-bold text-indigo-400">{action.emailIds.length} items</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    {action.description}
                  </p>
                </div>
                <button 
                  onClick={() => onResolve(action.emailIds)}
                  className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-[0.98]"
                >
                  {action.actionLabel}
                </button>
              </div>
            ))}
            
            {actions.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Your inbox is perfectly optimized. No maintenance required.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
