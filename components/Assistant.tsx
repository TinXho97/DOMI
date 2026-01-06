
import React, { useState, useRef, useEffect } from 'react';
import { getSmartAssistantStream } from '../services/geminiService';

const Assistant: React.FC<{ userContext: string }> = ({ userContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: '¡Hola! Soy DOMI-AI. 🤖 ¿En qué puedo ayudarte hoy? ¿Buscamos algo de comer o un viaje?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const stream = await getSmartAssistantStream(userMsg, userContext);
    
    if (!stream) {
      setChat(prev => [...prev, { role: 'ai', text: 'Ups, tengo problemas técnicos. Intentemos de nuevo en un momento. 🔌' }]);
      setLoading(false);
      return;
    }

    let fullText = '';
    setChat(prev => [...prev, { role: 'ai', text: '' }]);
    
    setLoading(false);
    try {
        for await (const chunk of stream) {
          const chunkText = chunk.text;
          if (chunkText) {
            fullText += chunkText;
            setChat(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'ai', text: fullText };
              return updated;
            });
          }
        }
    } catch (e) {
        console.error(e);
        setChat(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'ai', text: fullText + " [Conexión interrumpida]" };
            return updated;
        });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[10000]">
      {isOpen ? (
        <div className="bg-white w-[90vw] md:w-96 h-[550px] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in ring-1 ring-black/5 origin-bottom-right">
          <div className="p-6 bg-blue-600 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🤖</div>
              <div>
                <span className="font-black text-sm uppercase tracking-widest block">Domi AI</span>
                <span className="text-[9px] font-bold opacity-60 uppercase">Asistente Inteligente</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/10 hover:bg-black/20 transition-colors">✕</button>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                }`}>
                  {msg.text || (msg.role === 'ai' && <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregúntale algo a DOMI..."
              className="flex-1 p-4 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400 font-bold transition-all placeholder:text-slate-300"
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="text-xl">➤</span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 w-20 h-20 rounded-[2rem] shadow-2xl flex items-center justify-center text-4xl hover:scale-110 transition-transform active:scale-95 ring-8 ring-white"
        >
          🤖
        </button>
      )}
    </div>
  );
};

export default Assistant;
