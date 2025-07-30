'use client';

import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const DebugAuth = () => {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // Get all cookies for debugging
    const [cookies, setCookies] = useState({});
    useEffect(() => {
        const getCookies = () => {
            if (typeof document !== 'undefined') {
                return document.cookie.split(';').reduce((cookies, cookie) => {
                    const [name, value] = cookie.trim().split('=');
                    cookies[name] = value;
                    return cookies;
                }, {});
            }
            return {};
        };
        setCookies(getCookies());
    }, []);

    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
            <h3 className="font-bold mb-2">🐛 Debug Info</h3>
            <div className="space-y-1">
                <p><strong>Path:</strong> {pathname}</p>
                <p><strong>User:</strong> {user ? '✅ Logged in' : '❌ Not logged in'}</p>
                <p><strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
                <p><strong>User Name:</strong> {user?.name || 'None'}</p>
                <p><strong>User Email:</strong> {user?.email || 'None'}</p>
                
                <div className="mt-2">
                    <strong>Cookies:</strong>
                    <ul className="text-xs mt-1 max-h-20 overflow-y-auto">
                        {Object.keys(cookies).length > 0 ? (
                            Object.keys(cookies).map(key => (
                                <li key={key}>• {key}</li>
                            ))
                        ) : (
                            <li>No cookies found</li>
                        )}
                    </ul>
                </div>
            </div>
            
            <div className="mt-2 text-xs">
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-blue-600 px-2 py-1 rounded mr-2"
                >
                    Reload
                </button>
                <button 
                    onClick={() => console.log('Auth Debug:', { user, loading, cookies, pathname })} 
                    className="bg-green-600 px-2 py-1 rounded"
                >
                    Log Debug
                </button>
            </div>
        </div>
    );
};

export default DebugAuth;