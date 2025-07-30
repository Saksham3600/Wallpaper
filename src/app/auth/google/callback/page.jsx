'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/appwrite/auth.service';
import { useAuth } from '@/context/AuthContext';
import { setCookie } from 'cookies-next';

export default function GoogleCallback() {
    const router = useRouter();
    const { setUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const userData = await authService.handleGoogleCallback();
                console.log('Google callback userData:', userData); // Debug log
                if (userData) {
                    setUser(userData);
                    router.replace('/');
                } else {
                    router.push('/auth/login');
                }
            } catch (error) {
                console.error('Google callback error:', error);
                router.push('/auth/login');
            }
        };

        handleCallback();
    }, [router, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Processing your login...</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
}
