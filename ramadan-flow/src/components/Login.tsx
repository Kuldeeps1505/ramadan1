import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { handleGoogleLoginSuccess, isAuthenticated, user, logout } = useAuth();

    if (isAuthenticated) {
        return (
            <div className="flex flex-col items-center gap-4 p-8 bg-white min-h-screen">
                <h2 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h2>
                <img src={user?.picture} alt={user?.name} className="w-16 h-16 rounded-full border-2 border-brand-200" />
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-100 max-w-sm w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200">
                        <span className="text-white text-2xl font-serif">ر</span>
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-800 mb-1">Ramadan Flow</h1>
                    <p className="text-slate-500 text-sm">Your spiritual companion</p>
                </div>
                <h2 className="text-lg font-bold mb-6 text-slate-700 text-center">Sign in to continue</h2>
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        useOneTap
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;

