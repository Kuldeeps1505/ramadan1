import React, { useState } from 'react';
import { Icons } from './ui/Icon';
import { aiService } from '../services/aiService';
import { storage } from '../services/storage';
import { Recipe } from '../types';

export const Nourish: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [log, setLog] = useState(storage.getDailyLog(new Date().toISOString().split('T')[0]));

  const generateRecipe = async () => {
    if (!ingredients) return;
    setLoading(true);
    setRecipe(null);
    try {
      const result = await aiService.generateRecipe(ingredients);
      setRecipe(result);
    } finally {
      setLoading(false);
    }
  };

  const addWater = () => {
    const updated = { ...log, waterIntake: log.waterIntake + 1 };
    setLog(updated);
    storage.saveDailyLog(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="bg-emerald-800 text-white p-6 pt-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <Icons.Utensils className="absolute -right-6 -bottom-6 text-white/5 w-40 h-40" />
        <h1 className="text-2xl font-serif font-bold relative z-10">Nourish & Heal</h1>
        <p className="opacity-80 relative z-10 text-sm mt-1">Smart nutrition for your fasting body.</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Hydration Tracker */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold flex items-center gap-2 text-slate-800"><Icons.Droplets className="text-blue-500" size={20}/> Hydration</h3>
             <span className="text-2xl font-serif text-blue-600">{log.waterIntake}<span className="text-sm text-slate-400 font-sans ml-1">/ 8 cups</span></span>
          </div>
          <div className="flex gap-1 h-12 mb-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`flex-1 rounded-md transition-all duration-500 ${i < log.waterIntake ? 'bg-blue-500 shadow-blue-200 shadow-lg' : 'bg-slate-100'}`} />
            ))}
          </div>
          <button onClick={addWater} className="w-full py-3 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors">
            + Add Cup (250ml)
          </button>
        </div>

        {/* AI Chef */}
        <div>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Icons.Sparkles className="text-amber-500" />
            AI Kitchen
          </h3>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm mb-4">Got leftovers? Enter 3 ingredients and AI will suggest a Sunnah-inspired Suhoor or Iftar.</p>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. Dates, Oats, Milk"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button 
                onClick={generateRecipe}
                disabled={loading || !ingredients}
                className="bg-emerald-600 text-white p-3 rounded-xl disabled:opacity-50"
              >
                {loading ? <Icons.RefreshCw className="animate-spin" /> : <Icons.ArrowRight />}
              </button>
            </div>

            {recipe && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 animate-fade-in-up">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-emerald-900">{recipe.title}</h4>
                   <span className="text-xs bg-white px-2 py-1 rounded text-emerald-600 font-medium">{recipe.prepTime}</span>
                </div>
                <p className="text-sm text-emerald-800 mb-3 leading-relaxed">{recipe.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {recipe.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {!recipe && !loading && ingredients && (
                <div className="text-center text-xs text-slate-400 mt-2">
                    Press arrow to generate
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};