import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { Icons } from './ui/Icon';
import { storage } from '../services/storage';
import { useAuth } from '../src/context/AuthContext';

interface SettingsProps {
  user: UserProfile;
  onUpdate: (u: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleLast10 = () => {
    const newUser = { ...user, lastTenNightsMode: !user.lastTenNightsMode };
    onUpdate(newUser);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      // The auth context handles the redirect and state clearing
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-28 flex flex-col">
      {/* Header */}
      <div className="bg-white p-3 sm:p-4 border-b border-slate-200 flex items-center gap-3 sm:gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-600">
          <Icons.ArrowRight className="rotate-180 w-5 h-5 sm:w-6 sm:h-6" size={20} />
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Settings</h1>
      </div>

      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-2xl mx-auto w-full">

        {/* Features */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg text-indigo-600"><Icons.Moon size={18} className="sm:w-5 sm:h-5" /></div>
              <div>
                <p className="font-medium text-sm sm:text-base text-slate-900">Last 10 Nights Mode</p>
                <p className="text-[10px] sm:text-xs text-slate-500">Adds Tahajjud & Taraweeh focus</p>
              </div>
            </div>
            <button
              onClick={toggleLast10}
              className={`w-10 h-6 sm:w-12 sm:h-7 rounded-full transition-colors relative ${user.lastTenNightsMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${user.lastTenNightsMode ? 'left-5 sm:left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-brand-100 p-1.5 sm:p-2 rounded-lg text-brand-600"><Icons.MapPin size={18} className="sm:w-5 sm:h-5" /></div>
              <div>
                <p className="font-medium text-sm sm:text-base text-slate-900">Location</p>
                <p className="text-[10px] sm:text-xs text-slate-500">{user.city}</p>
              </div>
            </div>
            {/* Future edit feature */}
          </div>
        </div>

        {/* Data */}
        <div>
          <div className="px-2 mb-2 text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider">Account & Data</div>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button onClick={storage.exportData} className="w-full p-3 sm:p-4 border-b border-slate-50 flex items-center gap-2 sm:gap-3 hover:bg-slate-50 text-left">
              <Icons.Download size={16} className="text-slate-500 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base text-slate-700">Export My Data (JSON)</span>
            </button>
            <button onClick={handleLogout} className="w-full p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:bg-slate-50 text-left group">
              <Icons.LogOut size={16} className="text-slate-500 group-hover:text-slate-700 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base text-slate-600 group-hover:text-slate-800">Sign Out</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] sm:text-xs text-slate-400 px-4 sm:px-8 pt-6 sm:pt-8">
          Ramadan Flow v1.0.2<br />
          All data stored locally. No tracking.
        </p>
      </div>
    </div>
  );
};