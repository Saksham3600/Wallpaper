'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Avatar from './Avatar';
import authService from '@/lib/appwrite/auth.service';
import { deleteCookie } from 'cookies-next';

const Navigation = () => {
    const router = useRouter();
    const { user, setUser, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsProfileMenuOpen(false);
            deleteCookie('token');
            router.replace('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50'
                : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="group flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 via-pink-600 to-blue-600 rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
                                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-orange-600  to-pink-700 rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform duration-300"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">W</span>
                                </div>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                WallpaperHub
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
                        <div className="flex items-center space-x-1 mr-6">
                            
                        </div>

                       
                    </div>

                    {/* Upload + Profile Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user && (
                            <Link
                                href="/upload"
                                className="px-4 py-2 text-sm text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-xl font-medium shadow-md hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition duration-200"
                            >
                            Upload
                            </Link>
                        )}

                        {loading ? (
                            <div className="animate-pulse flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            </div>
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-all"
                                >
                                    <div className="relative w-10 h-10">
                                        <Avatar user={user} />
                                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    </div>
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
                                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <Avatar user={user} />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            {[
                                                { href: '/profile', label: 'Profile', icon: '👤' },
                                                { href: '/settings', label: 'Settings', icon: '⚙️' },
                                                { href: '/favorites', label: 'Favorites', icon: '❤️' }
                                            ].map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <span className="text-lg">{item.icon}</span>
                                                    <span className="font-medium">{item.label}</span>
                                                </Link>
                                            ))}
                                            <hr className="my-2" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <span className="text-lg">🚪</span>
                                                <span className="font-medium">Sign out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link
                                    href="/auth/login"
                                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                            <svg className={`h-6 w-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`} stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 pt-4 pb-6 space-y-3 bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search wallpapers..."
                                className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                            />
                        </div>


                        {/* Always show Home */}
                        <Link
                            href="/"
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-purple-50 hover:text-gray-900 transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <span className="text-lg">🏠</span>
                            <span>Home</span>
                        </Link>

                        {user ? (
                            <>
                                {/* Authenticated menu */}
                                {[
                                    { href: '/upload', label: 'Upload', icon: '📤' },
                                    { href: '/favorites', label: 'Favorites', icon: '❤️' },
                                    { href: '/profile', label: 'Profile', icon: '👤' },
                                    { href: '/settings', label: 'Settings', icon: '⚙️' }
                                ].map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-purple-50 hover:text-gray-900 transition-all duration-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                ))}

                                <hr className="my-4" />
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                    <span className="text-lg">🚪</span>
                                    <span>Sign out</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Unauthenticated menu */}
                                <Link
                                    href="/auth/login"
                                    className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-purple-50 hover:text-gray-900 transition-all duration-200"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-lg">🔐</span>
                                    <span>Sign In</span>
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-lg">✨</span>
                                    <span>Get Started</span>
                                </Link>
                            </>
                        )}



                        {user && (
                            <>
                                <hr className="my-4" />
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                    <span className="text-lg">🚪</span>
                                    <span>Sign out</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
