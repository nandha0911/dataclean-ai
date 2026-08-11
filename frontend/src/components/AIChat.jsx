/**
 * Nordic Light AIChat — Soft floating assistant
 */
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, Send, Minimize2, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../api/client';

const QUICK = ['Explain KNN', 'What is Winsorization?', 'Handling Missing Data'];
const LOCAL_KB = { default: 'I am your DataClean Assistant. Ask me about imputation, scaling, or handling outliers.' };
function findAnswer(q) { return LOCAL_KB.default; }

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMin] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([{ role: 'ai', text: 'Hi there! I can help explain any data cleaning techniques.' }]);
  const endRef = useRef(null);

  useEffect(() => { if (open && !minimized) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open, minimized, thinking]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setInput(''); setThinking(true);
    try {
      const res = await sendChatMessage(q);
      setMsgs(m => [...m, { role: 'ai', text: res.data.answer }]);
    } catch { setMsgs(m => [...m, { role: 'ai', text: findAnswer(q) }]); }
    finally { setThinking(false); }
  };

  if (!open) return (
    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-soft-lg">
      <MessageSquare size={22} />
    </motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-8 right-8 z-50 w-96 flex flex-col bg-white rounded-3xl shadow-soft-lg overflow-hidden border border-gray-100"
      style={{ height: minimized ? 'auto' : 560 }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-[#F7F6F3] border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Assistant</h3>
            <p className="text-xs text-gray-500 font-medium">Ready to help</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMin(!minimized)} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"><Minimize2 size={16} /></button>
          <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="flex gap-2 p-4 flex-wrap bg-gray-50 border-b border-gray-100">
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => send(q)} disabled={thinking} 
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-900 shadow-sm transition-all">
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm font-medium">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-gray-900 text-white rounded-br-sm shadow-md' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} disabled={thinking} placeholder="Type a message..." 
                className="flex-1 text-sm bg-gray-50 rounded-full px-5 py-3 border-none focus:ring-2 focus:ring-gray-200" />
              <button type="submit" disabled={!input.trim() || thinking} 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!input.trim() || thinking ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white shadow-md hover:bg-gray-800'}`}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
}
