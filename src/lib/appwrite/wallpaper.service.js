import { ID, Query } from 'appwrite';
import { databases } from './config';
import config from './config';


class WallpaperService {
    // Create wallpaper
    async createWallpaper({ title, description, imageUrl, category, tags = [], owner }) {
        try {
            return await databases.createDocument(
                config.databaseId,
                config.collections.wallpapers,
                ID.unique(),
                {
                    title,
                    description,
                    imageUrl,
                    category,
                    tags,
                    owner,
                    likes: 0,
                    favorites: 0,
                    createdAt: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error("WallpaperService :: createWallpaper :: error", error);
            throw error;
        }
    }

    // Get all wallpapers with filtering and search
    async getWallpapers({ search = '', category = '', page = 1, limit = 12 }) {
        try {
            let queries = [
                Query.limit(limit),
                Query.offset((page - 1) * limit),
                Query.orderDesc('createdAt')
            ];

            // Add search query if provided
            if (search) {
                queries.push(Query.search('title', search));
            }

            // Add category filter if provided
            if (category) {
                queries.push(Query.equal('category', category));
            }

            return await databases.listDocuments(
                config.databaseId,
                config.collections.wallpapers,
                queries
            );
        } catch (error) {
            console.error("WallpaperService :: getWallpapers :: error", error);
            throw error;
        }
    }

    // Get trending wallpapers
    async getTrendingWallpapers(limit = 10) {
        try {
            return await databases.listDocuments(
                config.databaseId,
                config.collections.wallpapers,
                [
                    Query.orderDesc('likes'),
                    Query.limit(limit)
                ]
            );
        } catch (error) {
            console.error("WallpaperService :: getTrendingWallpapers :: error", error);
            throw error;
        }
    }

    // Get wallpaper by ID
    async getWallpaper(wallpaperId) {
        try {
            return await databases.getDocument(
                config.databaseId,
                config.collections.wallpapers,
                wallpaperId
            );
        } catch (error) {
            console.error("WallpaperService :: getWallpaper :: error", error);
            throw error;
        }
    }

    // Get wallpapers by owner
    async getUserWallpapers(owner) {
        try {
            return await databases.listDocuments(
                config.databaseId,
                config.collections.wallpapers,
                [
                    Query.equal('owner', owner),
                    Query.orderDesc('createdAt')
                ]
            );
        } catch (error) {
            console.error("WallpaperService :: getUserWallpapers :: error", error);
            throw error;
        }
    }

    // Delete wallpaper
    async deleteWallpaper(wallpaperId) {
        try {
            return await databases.deleteDocument(
                config.databaseId,
                config.collections.wallpapers,
                wallpaperId
            );
        } catch (error) {
            console.error("WallpaperService :: deleteWallpaper :: error", error);
            throw error;
        }
    }

    // Update wallpaper
    async updateWallpaper(wallpaperId, { title, description, category, tags, imageUrl, owner }) {
        try {
            // First check if wallpaper exists
            await this.getWallpaper(wallpaperId);
            
            return await databases.updateDocument(
                config.databaseId,
                config.collections.wallpapers,
                wallpaperId,
                {
                    title,
                    description,
                    category,
                    tags,
                    imageUrl,
                    ...(owner && { owner }) // Only update owner if provided
                }
            );
        } catch (error) {
            console.error("WallpaperService :: updateWallpaper :: error", error);
            throw error;
        }
    }

    // Fetch all wallpapers (stub)
    async getAllWallpapers() {
        // TODO: Replace with Appwrite DB fetch
        return [
            {
                id: '1',
                imageUrl: '/sample1.jpg',
                title: 'Sample 1',
                uploaderId: 'user1',
                uploaderName: 'Alice',
                uploaderAvatar: '/avatar1.png',
                likes: 12,
                liked: false,
                following: false,
            },
            {
                id: '2',
                imageUrl: '/sample2.jpg',
                title: 'Sample 2',
                uploaderId: 'user2',
                uploaderName: 'Bob',
                uploaderAvatar: '/avatar2.png',
                likes: 8,
                liked: true,
                following: true,
            },
        ];
    }

    // Toggle like (stub)
    async toggleLike(wallpaperId) {
        // TODO: Integrate with Appwrite DB
        return true;
    }

    // Toggle follow (stub)
    async toggleFollow(uploaderId) {
        // TODO: Integrate with Appwrite DB
        return true;
    }

    // Download a single wallpaper with progress tracking
    async download(imageUrl, title) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const fileName = `${title || 'wallpaper'}.${this.getFileExtension(imageUrl)}`;

            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);

            // Record download in database
            await this.recordDownload(imageUrl, fileName);

            return { success: true, fileName };
        } catch (error) {
            console.error('Download failed:', error);
            throw new Error('Failed to download wallpaper');
        }
    }

    // Download multiple wallpapers
    async downloadMultiple(files) {
        try {
            const downloads = files.map(({ url, filename }) => 
                this.download(url, filename)
            );
            
            const results = await Promise.allSettled(downloads);
            
            // Check results
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            return {
                success: failed === 0,
                summary: `Successfully downloaded ${successful} files${failed > 0 ? `, ${failed} failed` : ''}`
            };
        } catch (error) {
            console.error('Batch download failed:', error);
            throw new Error('Failed to download wallpapers');
        }
    }

    // Get user's download history
    async getUserDownloads(userId) {
        try {
            return await databases.listDocuments(
                config.databaseId,
                config.collections.downloads,
                [
                    Query.equal('userId', userId),
                    Query.orderDesc('downloadDate'),
                    Query.limit(50)
                ]
            );
        } catch (error) {
            console.error("WallpaperService :: getUserDownloads :: error", error);
            throw error;
        }
    }

    // Record download in database
    async recordDownload(imageUrl, fileName) {
        try {
            return await databases.createDocument(
                config.databaseId,
                config.collections.downloads,
                ID.unique(),
                {
                    userId: this.getCurrentUserId(),
                    imageUrl,
                    fileName,
                    downloadDate: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error("WallpaperService :: recordDownload :: error", error);
            // Don't throw error here as it's not critical for the download functionality
        }
    }

    // Helper method to get file extension from URL
    getFileExtension(url) {
        const extension = url.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? extension : 'jpg';
    }

    // Helper method to get current user ID
    getCurrentUserId() {
        // Check if we're in a browser environment before accessing localStorage
        if (typeof window !== 'undefined') {
            return localStorage.getItem('userId') || 'anonymous';
        }
        return 'anonymous';
    }
}

const wallpaperService = new WallpaperService();
export default wallpaperService;
