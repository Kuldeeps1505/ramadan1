import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icons } from './ui/Icon';
import { aiService } from '../services/aiService';
import { ChatMessage, DuaResult, VideoResult } from '../types';

type Mode = 'chat' | 'dua' | 'video';

export const Discover: React.FC = () => {
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('dua');
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', type: 'text', content: 'Salam. I am your AI Hafiz companion. You can ask me for a Dua, clarify a doubt, or find a video.' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Handle incoming deep links and auto-send
  useEffect(() => {
    if (initialized.current) return;

    if (location.state && location.state.askHafizQuery) {
      const initialQuery = location.state.askHafizQuery;
      setMode('chat');
      setQuery(initialQuery);
      handleSend(initialQuery);
      initialized.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSend = async (manualQuery?: string) => {
    const q = manualQuery || query;
    if (!q.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: q, type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
      if (mode === 'dua') {
  const response = await aiService.chatWithHafiz(userMsg.content);
  
  // Extract dua from response
  const duaData = response.type === 'dua_card' 
    ? response.metadata 
    : response.metadata;
  
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    role: 'assistant',
    content: 'Here is a Dua for your situation:',
    type: 'dua_card',
    metadata: duaData
  }]);
      } else if (mode === 'chat') {
        const response = await aiService.chatWithHafiz(userMsg.content);

        // FIXED: Extract text from response properly
        let displayContent = response.response;

        if (typeof displayContent === 'string') {
          // Remove markdown code blocks
          displayContent = displayContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
          displayContent = displayContent.trim();

          // Extract text from JSON if present
          if (displayContent.startsWith('{') && displayContent.includes('"text"')) {
            try {
              const parsed = JSON.parse(displayContent);
              displayContent = parsed.text || displayContent;
            } catch (e) {
              // use as-is if parsing fails
            }
          }
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: displayContent,
          type: response.type || 'text',
          metadata: response.metadata || null
        }]);
      } else if (mode === 'video') {
        const videos = await aiService.findVideos(userMsg.content);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: videos.length > 0 ? 'Here are some videos I found:' : 'I could not find specific videos, but I recommend checking Yaqeen Institute.',
          type: 'video_card',
          metadata: videos
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error connecting to the service. Please try again.',
        type: 'text'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
      <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Mode Switcher */}
        <div className="bg-white border-b border-slate-100 p-3 sticky top-0 z-10">
        <div className="flex bg-slate-100 rounded-xl p-1 max-w-md md:max-w-lg lg:max-w-xl mx-auto">
          {(['dua', 'chat', 'video'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold capitalize transition-all ${mode === m ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
            >
              {m === 'dua' ? 'Find Dua' : m === 'chat' ? 'Ask Hafiz' : 'Watch'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <div className="max-w-3xl mx-auto space-y-1 sm:space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] lg:max-w-[65%] space-y-2`}>
                {msg.content && (
                  <div className={`p-3 sm:p-4 md:p-5 rounded-2xl text-xs sm:text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                    {msg.content}
                  </div>
                )}

                {/* Dua Card */}
                {msg.type === 'dua_card' && msg.metadata && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 sm:p-5 md:p-6 rounded-2xl animate-fade-in-up">
                    <p className="font-serif text-xl sm:text-2xl md:text-3xl text-emerald-900 text-right leading-loose mb-2 sm:mb-3">{msg.metadata.arabic}</p>
                    <p className="text-[10px] sm:text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Transliteration</p>
                    <p className="text-xs sm:text-sm md:text-base text-emerald-800 italic mb-2 sm:mb-3">{msg.metadata.transliteration}</p>
                    <p className="text-xs sm:text-sm md:text-base text-slate-700 mb-2 font-medium">"{msg.metadata.translation}"</p>
                    <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 border-t border-emerald-100 pt-2 mt-2">
                      <span>{msg.metadata.source}</span>
                      <button className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"><Icons.Heart size={10} className="sm:w-3 sm:h-3" /> Save</button>
                    </div>
                  </div>
                )}

                {/* Video Results */}
                {msg.type === 'video_card' && msg.metadata && (
                  <div className="space-y-2 animate-fade-in-up">
                    {(msg.metadata as VideoResult[]).map((video, idx) => (
                      <a href={`https://www.youtube.com/watch?v=${video.thumbnail.split('/vi/')[1]?.split('/')[0]}`} target="_blank" rel="noopener noreferrer" key={idx} className="bg-white p-2 sm:p-3 rounded-xl border border-slate-100 shadow-sm flex gap-2 sm:gap-3 overflow-hidden hover:bg-slate-50 transition-colors">
                        <div className="w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-16 bg-slate-200 rounded-lg flex-shrink-0 bg-cover bg-center relative" style={{ backgroundImage: `url(${video.thumbnail})` }}>
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] sm:text-[9px] px-1 rounded">{video.duration}</div>
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <h4 className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-800 truncate">{video.title}</h4>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500">{video.channel}</p>
                        </div>
                        <div className="ml-auto w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 flex-shrink-0">
                          <Icons.Play size={12} className="sm:w-4 sm:h-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-3">
           <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            className="w-full bg-slate-100 rounded-xl pl-3 sm:pl-4 pr-10 sm:pr-12 py-3 sm:py-3.5 md:py-4 text-xs sm:text-sm md:text-base outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            placeholder={mode === 'dua' ? "Describe your situation..." : mode === 'chat' ? "Ask a question..." : "Search topics..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-brand-600 text-white rounded-lg disabled:opacity-50 hover:bg-brand-700 transition-colors"
          >
            <Icons.ArrowRight size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};