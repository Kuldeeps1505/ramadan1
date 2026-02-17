import React, { useState } from 'react';
import { UserProfile, CalculationMethod, AsrMethod } from '../types';
import { Icons } from './ui/Icon';
import { profileService } from '../services/progressService';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    city: '',
    latitude: 0,
    longitude: 0,
    goalQuranMinutes: 30
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleNext = () => setStep(p => p + 1);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to get city name from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geocodeData = await response.json();
          const city = geocodeData.address?.city ||
            geocodeData.address?.town ||
            geocodeData.address?.village ||
            geocodeData.address?.state ||
            'Your Location';
          const country = geocodeData.address?.country || '';

          setData({
            ...data,
            city: country ? `${city}, ${country}` : city,
            latitude,
            longitude,
          });
        } catch {
          // If reverse geocoding fails, just use coordinates
          setData({
            ...data,
            city: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            latitude,
            longitude,
          });
        }

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enter city manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Please enter city manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again.');
            break;
          default:
            setLocationError('Unable to get location. Please enter city manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCityChange = async (city: string) => {
    setData({ ...data, city });

    // Geocode city name to coordinates (debounced, only when user stops typing)
    if (city.length > 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
        );
        const results = await response.json();
        if (results.length > 0) {
          setData(prev => ({
            ...prev,
            city,
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          }));
        }
      } catch {
        // Silently fail geocoding, user can still proceed
      }
    }
  };

  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      // Save to backend
      await profileService.saveOnboarding({
        name: data.name || '',
        city: data.city || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        calculationMethod: data.calculationMethod,
        asrMethod: data.asrMethod,
        goalQuranMinutes: data.goalQuranMinutes
      });
      // Call onComplete to update local state
      onComplete(data);
    } catch (err) {
      console.error('Failed to save profile:', err);
      // Still complete onboarding locally even if backend fails
      onComplete(data);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 z-0">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand-200 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-100 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg relative z-10">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-800 mb-1 sm:mb-2">Ramadan Flow</h1>
          <p className="text-slate-500 text-sm sm:text-base md:text-lg">Your intelligent spiritual companion.</p>
        </div>

        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-brand-100">
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-brand-600 uppercase tracking-wider mb-1 sm:mb-2">First things first</label>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">What should we call you?</h2>
              </div>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-sm sm:text-base md:text-lg text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                value={data.name}
                onChange={e => setData({ ...data, name: e.target.value })}
              />
              <button onClick={handleNext} disabled={!data.name} className="w-full bg-brand-600 text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold hover:bg-brand-500 transition-colors disabled:opacity-50 shadow-lg shadow-brand-200">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-brand-600 uppercase tracking-wider mb-1 sm:mb-2">Location</label>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Where are you fasting?</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">We need this for accurate prayer times</p>
              </div>

              {/* Use My Location Button */}
              <button
                onClick={handleUseLocation}
                disabled={locationLoading}
                className="w-full bg-brand-50 border border-brand-200 text-brand-600 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold hover:bg-brand-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {locationLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    Getting location...
                  </>
                ) : (
                  <>
                    <Icons.MapPin size={18} />
                    Use My Location
                  </>
                )}
              </button>

              {locationError && (
                <p className="text-red-500 text-xs text-center">{locationError}</p>
              )}

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-slate-400 text-xs uppercase">or enter manually</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div className="relative">
                <Icons.MapPin className="absolute left-3 sm:left-4 top-3 sm:top-4 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="City, Country"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 pl-10 sm:pl-12 text-sm sm:text-base md:text-lg text-slate-800 placeholder:text-slate-400 focus:border-brand-500 outline-none transition-all"
                  value={data.city}
                  onChange={e => handleCityChange(e.target.value)}
                />
              </div>

              {data.latitude !== 0 && data.longitude !== 0 && (
                <p className="text-brand-600 text-xs text-center flex items-center justify-center gap-1">
                  <Icons.Check size={14} />
                  Location detected: {data.latitude?.toFixed(4)}°, {data.longitude?.toFixed(4)}°
                </p>
              )}

              <button
                onClick={finish}
                disabled={saving || !data.city || (data.latitude === 0 && data.longitude === 0)}
                className="w-full bg-brand-600 text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold hover:bg-brand-500 transition-colors disabled:opacity-50 shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Start Journey'
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 flex justify-center gap-2">
          <div className={`h-1 rounded-full transition-all duration-300 ${step === 1 ? 'w-6 sm:w-8 bg-brand-500' : 'w-2 bg-slate-200'}`} />
          <div className={`h-1 rounded-full transition-all duration-300 ${step === 2 ? 'w-6 sm:w-8 bg-brand-500' : 'w-2 bg-slate-200'}`} />
        </div>
      </div>
    </div>
  );
};