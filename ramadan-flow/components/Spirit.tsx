import React, { useState } from 'react';
import { Icons } from './ui/Icon';
import { aiService } from '../services/aiService';
import { storage } from '../services/storage';
import { SpiritInsight } from '../types';

export const Spirit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<SpiritInsight | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMood = async (mood: string) => {
    setSelectedMood(mood);
    setLoading(true);
    setInsight(null);
    try {
      const result = await aiService.getSpiritInsight(mood);
      setInsight(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white pt-12 pb-8 px-4 sm:px-6 rounded-b-3xl">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-2">Spiritual Lift</h1>
        <p className="text-brand-100">Find peace through connection</p>
      </div>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold relative z-10 mb-1 sm:mb-2">The Heart</h1>
        <p className="opacity-80 relative z-10 text-xs sm:text-sm md:text-base leading-relaxed max-w-[90%] md:max-w-[80%]">
          "Verily, in the remembrance of Allah do hearts find rest." (13:28)
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {!insight && !loading && (
            <div className="animate-fade-in">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-4 sm:mb-6 text-center">How is your heart feeling?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {['Anxious', 'Grateful', 'Tired', 'Lost', 'Angry', 'Hopeful'].map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleMood(mood)}
                    className={`p-4 sm:p-6 rounded-2xl text-center transition-all hover:scale-105 border-2 shadow-sm ${selectedMood === mood ? 'bg-brand-500 text-white border-brand-500 shadow-brand-200' : 'bg-white border-brand-100 hover:border-brand-300'} flex flex-col items-center gap-2 sm:gap-3 group`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                      {mood === 'Anxious' ? <Icons.Coffee size={20} className="sm:w-6 sm:h-6" /> :
                        mood === 'Grateful' ? <Icons.Heart size={20} className="sm:w-6 sm:h-6" /> :
                          <Icons.Sparkles size={20} className="sm:w-6 sm:h-6" />}
                    </div>
                    <span className="font-medium text-sm sm:text-base text-slate-600">{mood}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 animate-fade-in min-h-[50vh]">
              <Icons.Sparkles className="text-brand-400 w-10 h-10 sm:w-12 sm:h-12 animate-pulse-slow mb-3 sm:mb-4" />
              <p className="text-brand-900 font-serif text-lg sm:text-xl md:text-2xl">Consulting 1400 years of wisdom...</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 sm:mt-2">Finding the right medicine for your heart.</p>
            </div>
          )}

          {insight && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in-up pb-10">
              <button onClick={() => setInsight(null)} className="flex items-center gap-2 text-xs sm:text-sm text-brand-400 hover:text-brand-600 mb-2">
                <Icons.ArrowRight className="rotate-180" size={14} /> Back
              </button>

              {/* Wisdom Card */}
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-lg border border-brand-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-brand-100 rounded-bl-full -mr-8 -mt-8 sm:-mr-10 sm:-mt-10 opacity-50"></div>
                <h4 className="text-[10px] sm:text-xs font-bold text-brand-400 uppercase tracking-widest mb-2 sm:mb-3">Divine Wisdom</h4>
                <p className="text-lg sm:text-xl md:text-2xl font-serif text-slate-800 leading-relaxed mb-4 sm:mb-6">"{insight.wisdom}"</p>

                <div className="bg-brand-50 rounded-xl p-3 sm:p-4 md:p-5 border border-brand-100">
                  <p className="text-right font-serif text-xl sm:text-2xl md:text-3xl text-brand-900 mb-1 sm:mb-2">{insight.dua.arabic}</p>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 italic">"{insight.dua.translation}"</p>
                </div>
              </div>

              {/* AI Content (if available) */}
              {selectedMood && insight && ( // Changed aiContent to insight
                <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm">
                  <h3 className="text-xl font-bold mb-3 text-slate-800">Guidance for You</h3>
                  <p className="text-slate-600 whitespace-pre-line mb-6">{insight.message}</p> {/* Assuming insight has a message property */}
                  <div className="bg-gradient-to-br from-brand-50 to-brand-100 p-4 rounded-xl border border-brand-200">
                    <p className="text-xs uppercase tracking-wider text-brand-600 font-bold mb-2">Suggested Dua</p>
                    <p className="text-lg text-slate-700 italic">"{insight.dua.translation}"</p> {/* Using insight.dua.translation */}
                  </div>
                </div>
              )}
              {/* Small Deed */}
              <div className="bg-emerald-50 p-4 sm:p-5 md:p-6 rounded-3xl border border-emerald-100 flex items-start gap-3 sm:gap-4">
                <div className="bg-white p-2 sm:p-3 rounded-full text-emerald-600 shadow-sm shrink-0">
                  <Icons.Check size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-emerald-800 font-bold text-base sm:text-lg md:text-xl mb-1">Small Deed, Big Reward</h4>
                  <p className="text-emerald-700 text-xs sm:text-sm md:text-base leading-relaxed">{insight.action}</p>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-emerald-500 mt-1 sm:mt-2 font-medium uppercase tracking-wider">Why? "The most beloved deeds to Allah are those that are consistent, even if small."</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};