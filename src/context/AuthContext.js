'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/lib/appwrite/auth.service';

const AuthContext = createContext({
    user: null,
    loading: true,
    loginWithGoogle: async () => {},
    logout: async () => {},
    setUser: () => {},
    updateUser: () => {}
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check auth status on mount and when localStorage changes
    useEffect(() => {
        const checkAuth = async () => {
            setLoading(true);
            try {
                // First check localStorage
                const storedUser = localStorage.getItem('user');
                
                // If we have a stored user, verify it's still valid
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    // You can add additional validation here if needed
                    setUser(parsedUser);
                } else {
                    // If no stored user, try to get current session
                    try {
                        const session = await authService.getCurrentUser();
                        if (session) {
                            setUser(session);
                            localStorage.setItem('user', JSON.stringify(session));
                        } else {
                            setUser(null);
                            localStorage.removeItem('user');
                        }
                    } catch (sessionError) {
                        console.error('Session check failed:', sessionError);
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        // Listen for storage events to sync across tabs
        const handleStorageChange = (e) => {
            if (e.key === 'user') {
                checkAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        checkAuth();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            // Use the actual Google login logic from authService
            await authService.loginWithGoogle();
            // After login, refresh user data to get latest profile image
            const session = await authService.getCurrentUser();
            if (session) {
                setUser(session);
                localStorage.setItem('user', JSON.stringify(session));
            }
            return { success: true };
        } catch (error) {
            console.error('Google login failed:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            localStorage.removeItem('user');
            setUser(null);
            console.log('User logged out');
            return { success: true };
        } catch (error) {
            console.error('Logout failed:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (userData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...userData
        }));
    };

    const value = {
        user,
        loading,
        loginWithGoogle,
        logout,
        setUser,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;