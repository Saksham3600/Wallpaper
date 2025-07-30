import { account } from './config';
import userService from './user.service';

class AuthService {
    // Google OAuth Login
    async loginWithGoogle() {
        try {
            // Start Google OAuth login
            await account.createOAuth2Session(
                'google',
                'http://localhost:3000/auth/google/callback',
                'http://localhost:3000/auth/login'
            );
        } catch (error) {
            console.error("AuthService :: loginWithGoogle :: error", error);
            throw error;
        }
    }

    // Handle Google OAuth callback
    async handleGoogleCallback() {
        try {
            // Get current session
            const session = await account.get();
            if (!session) {
                throw new Error('No session found');
            }

            // Get OAuth data including profile image
            const oauthData = await userService.getOAuthData();
            if (!oauthData) {
                throw new Error('No OAuth data found');
            }
            
            // Save Google profile image
            const profileImage = await userService.saveGoogleProfileImage();
            
            // Store user data in localStorage
            const userData = {
                ...session,
                profileImage: profileImage || oauthData.profileImage,
                name: oauthData.name,
                email: oauthData.email
            };
            
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(userData));
            }
            
            return userData;
        } catch (error) {
            console.error("AuthService :: handleGoogleCallback :: error", error);
            throw error;
        }
    }

    // Email/password login
    async login({ email, password }) {
        try {
            return await account.createEmailPasswordSession(email, password);
        } catch (error) {
            console.error("AuthService :: login :: error", error);
            throw error;
        }
    }

    // Register new user (local signup)
    async registerUser({ email, username, password }) {
        try {
            return await account.create(
                'unique()', // unique user ID
                email,
                password,
                username // name
            );
        } catch (error) {
            console.error("AuthService :: registerUser :: error", error);
            throw error;
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            const user = await account.get();
            const prefs = await account.getPrefs();
            let profileImage = prefs.profileImage;
            let name = prefs.name;
            let email = prefs.email;
            // Fallback to Google OAuth if missing
            if (!profileImage || !name || !email) {
                try {
                    const oauthData = await userService.getOAuthData();
                    if (oauthData) {
                        profileImage = profileImage || oauthData.profileImage;
                        name = name || oauthData.name;
                        email = email || oauthData.email;
                    }
                } catch (e) {
                    // Ignore, fallback to default
                }
            }
            return {
                ...user,
                profileImage: profileImage || '/avatar.png',
                name: name || 'Anonymous User',
                email: email || '',
            };
        } catch (error) {
            console.error("AuthService :: getCurrentUser :: error", error);
            return null;
        }
    }

    // Logout
    async logout() {
        try {
            // Check if user is logged in before attempting to delete session
            const session = await account.get();
            if (session && session.$id) {
                return await account.deleteSession('current');
            } else {
                // No session, just resolve (user is already logged out)
                return null;
            }
        } catch (error) {
            // If error is due to missing session, ignore
            if (error && error.message && error.message.includes('missing scope')) {
                return null;
            }
            console.error("AuthService :: logout :: error", error);
            throw error;
        }
    }
}

const authService = new AuthService();
export default authService;
