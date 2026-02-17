import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import axios from 'axios';

// Define the shape of the user object based on backend response
interface User {
    email: string;
    role: string;
    name: string;
    picture: string;
    token: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    handleGoogleLoginSuccess: (credentialResponse: any) => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

    useEffect(() => {
        // Check for stored user data on mount
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                setUser({ ...JSON.parse(storedUser), token: storedToken });
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = (token: string, userData: User) => {
        setUser({ ...userData, token });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const handleGoogleLoginSuccess = async (credentialResponse: any) => {
        try {
            const { credential } = credentialResponse;
            if (!credential) {
                console.error("No credential received from Google");
                return;
            }

            const res = await axios.post(`${API_BASE_URL}/auth/google`, { idToken: credential });
            const { token, ...userData } = res.data;
            login(token, userData);
        } catch (error) {
            console.error("Backend login failed", error);
            alert("Login failed");
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, handleGoogleLoginSuccess, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
