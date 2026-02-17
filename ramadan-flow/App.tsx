import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Discover } from './components/Discover';
import { Spirit } from './components/Spirit';
import { Tracker } from './components/Tracker';
import { Quran } from './components/Quran';
import { Hadees } from './components/Hadees';
import { ProphetHistory } from './components/ProphetHistory';
import { Calendar } from './components/Calendar';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Icons } from './components/ui/Icon';
import { storage } from './services/storage';
import { UserProfile } from './types';
import { DEFAULT_PROFILE } from './constants';
import { useAuth } from './src/context/AuthContext';
import Login from './src/components/Login';

// Helper component to conditionally hide bottom nav
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = ['/settings'].includes(location.pathname);

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-slate-50">
      <main className={`flex-1 overflow-y-auto no-scrollbar relative ${!hideNav ? 'pb-24 sm:pb-28' : ''}`}>
        {children}
      </main>

      {/* Floating Dock Navigation - Hidden on Settings */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-[max(16px,env(safe-area-inset-bottom))] md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto md:min-w-[600px] lg:min-w-[700px]">
          <div className="bg-white/95 backdrop-blur-xl border border-brand-100 rounded-2xl p-1 sm:p-2 flex justify-between items-center shadow-lg shadow-brand-900/10 max-w-lg mx-auto md:max-w-none">
            <NavLink to="/" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.Home size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Home</span>
            </NavLink>
            <NavLink to="/quran" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.BookOpen size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Quran</span>
            </NavLink>
            <NavLink to="/hadees" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.BookText size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Hadith</span>
            </NavLink>
            <NavLink to="/prophet" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.History size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Seerah</span>
            </NavLink>
            <NavLink to="/discover" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.Sparkles size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Discover</span>
            </NavLink>
            <NavLink to="/spirit" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.Heart size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Spirit</span>
            </NavLink>
            <NavLink to="/tracker" className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 sm:py-3 px-1.5 sm:px-3 md:px-4 rounded-xl transition-all ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-500 hover:bg-brand-50/50'}`}>
              <Icons.Calendar size={18} className="sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">Track</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      // First load from local storage
      const localProfile = storage.getProfile();

      // If authenticated, try to load from backend
      if (isAuthenticated) {
        try {
          const { profileService } = await import('./services/progressService');
          const backendProfile = await profileService.getProfile();

          // Merge backend data with local profile
          const mergedProfile: UserProfile = {
            ...localProfile,
            name: backendProfile.name || localProfile.name,
            city: backendProfile.city || localProfile.city,
            latitude: backendProfile.latitude ?? localProfile.latitude,
            longitude: backendProfile.longitude ?? localProfile.longitude,
            calculationMethod: (backendProfile.calculationMethod as any) || localProfile.calculationMethod,
            asrMethod: (backendProfile.asrMethod as any) || localProfile.asrMethod,
            goalQuranMinutes: backendProfile.goalQuranMinutes ?? localProfile.goalQuranMinutes,
            isOnboarded: backendProfile.isOnboarded ?? localProfile.isOnboarded
          };

          setUser(mergedProfile);
          storage.saveProfile(mergedProfile);
        } catch (err) {
          console.error('Failed to load profile from backend:', err);
          setUser(localProfile);
        }
      } else {
        setUser(localProfile);
      }

      setLoading(false);
    };

    if (!authLoading) {
      loadProfile();
    }
  }, [isAuthenticated, authLoading]);

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    storage.saveProfile(updated);
  };

  const handleOnboardingComplete = (data: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...data, isOnboarded: true };
    handleUpdateUser(updatedUser);
  };

  if (loading || authLoading) return null;

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!user.isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/hadees" element={<Hadees />} />
          <Route path="/prophet" element={<ProphetHistory />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/spirit" element={<Spirit />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings user={user} onUpdate={handleUpdateUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}