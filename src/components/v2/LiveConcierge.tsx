"use client";


import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

import { Category, Email, Watcher } from '@/types/v2/types';

interface LiveConciergeProps {
  emails: Email[];
  onAddWatcher: (watcher: Watcher) => void;
}

const LiveConcierge: React.FC<LiveConciergeProps> = ({ emails, onAddWatcher }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);

  const startSession = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      alert("Please add NEXT_PUBLIC_GOOGLE_AI_API_KEY to your .env.local to use the Live Concierge.");
      return;
    }

    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey });

    // Setup audio
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const recentEmailsContext = emails.slice(0, 10).map(e => `- From: ${e.senderName} (${e.senderEmail}), Subject: ${e.subject}, Summary: ${e.summary}`).join('\n');

      const session = await ai.live.connect({
        model: 'gemini-1.5-flash',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
              session.sendRealtimeInput({ media: { data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))), mimeType: 'audio/pcm;rate=16000' } });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            const textData = msg.serverContent?.modelTurn?.parts[0]?.text;

            if (textData) {
              // Check for watcher commands in text (internal protocol)
              if (textData.includes('[WATCH:')) {
                const match = textData.match(/\[WATCH:\s*(.+?)\]/);
                if (match) {
                  onAddWatcher({
                    id: Math.random().toString(36).substr(2, 9),
                    query: match[1],
                    timestamp: Date.now()
                  });
                }
              }
              setChatHistory(prev => [...prev, { role: 'assistant', content: textData }]);
            }

            if (audioData) {
              const bytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
              const int16 = new Int16Array(bytes.buffer);
              const buffer = audioContextRef.current!.createBuffer(1, int16.length, 24000);
              const channel = buffer.getChannelData(0);
              for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / 32768.0;
              const source = audioContextRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current!.destination);
              source.start();
            }
          },
          onclose: () => setIsActive(false),
          onerror: () => setIsActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          systemInstruction: `You are Reception Concierge. You help users manage their emails. 
          You are witty, efficient, and always professional.
          
          CONTEXT:
          Current User's Recent Emails:
          ${recentEmailsContext}
          
          CAPABILITIES:
          - You can answer questions about existing emails.
          - You can WATCH for new emails. If a user asks you to watch/notify them about an email from someone or about a topic, confirm it and respond with the tag [WATCH: query] at the end of your message.
          - Switch between voice and text modes naturally.`
        }
      });
      sessionRef.current = session;
    } catch (e) {
      console.error(e);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    setIsActive(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !sessionRef.current) return;

    const text = textInput;
    setTextInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: text }]);

    // Use the realtime session to send text input
    sessionRef.current.sendContent({
      parts: [{ text }]
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-[999] flex flex-col items-end gap-3 max-w-md pointer-events-none">
      {isActive && (
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-6 duration-700 w-80 sm:w-96 overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Neural Link Active</p>
            </div>
            <button onClick={() => setIsTextMode(!isTextMode)} className="text-[10px] text-slate-500 hover:text-white uppercase tracking-widest transition-colors font-bold">
              {isTextMode ? 'Voice Mode' : 'Text Mode'}
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-1">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-slate-300 font-medium leading-relaxed opacity-80">
                "I'm scanning your recent communications. How can I assist you today?"
              </p>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-200 border border-white/5'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleTextSubmit} className={`transition-all duration-500 overflow-hidden ${isTextMode ? 'h-12 opacity-100' : 'h-0 opacity-0'}`}>
            <div className="relative group">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all"
              />
              <button type="submit" className="absolute right-2 top-1.5 p-1 text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </form>

          {!isTextMode && (
            <div className="flex flex-col items-center py-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
              <div className="flex gap-1.5 mb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-1 bg-indigo-400 rounded-full animate-wave" style={{ height: '12px', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-[10px] text-indigo-300/60 uppercase font-black tracking-widest">Listening...</p>
            </div>
          )}
        </div>
      )}

      <div className="relative pointer-events-auto">
        <button
          onClick={isActive ? stopSession : startSession}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-700 relative z-10 overflow-hidden shadow-[0_20px_50px_rgba(79,70,229,0.3)] ${isActive ? 'scale-110' : 'hover:scale-110 active:scale-95'
            }`}
          style={{
            background: isActive
              ? 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)'
              : 'linear-gradient(135deg, #1e293b, #0f172a)'
          }}
        >
          {/* Pulsing Neural Mesh Animation */}
          {isActive && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/20 animate-pulse" />
          )}

          {isConnecting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" />
          ) : (
            <svg className={`w-8 h-8 transition-transform duration-500 ${isActive ? 'text-white rotate-90' : 'text-slate-400 rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isActive
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              }
            </svg>
          )}
        </button>

        {isActive && (
          <div className="absolute inset-0 -z-10 bg-indigo-500/50 rounded-full blur-2xl animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default LiveConcierge;
