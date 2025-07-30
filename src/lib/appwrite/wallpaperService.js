import { storage, databases } from './config';
import config from './config';
import { ID, Query } from 'appwrite';

class WallpaperService {
  async uploadWallpaper(file, metadata = {}) {
    try {
      // Upload file to storage
      const uploadedFile = await storage.createFile(
        config.bucketId,
        ID.unique(),
        file
      );
      
      // If metadata is provided, create a document in the wallpapers collection
      if (metadata && Object.keys(metadata).length > 0) {
        const { title, description, category, tags = [] } = metadata;
        
        // Create wallpaper document with file information and metadata
        await databases.createDocument(
          config.databaseId,
          config.collections.wallpapers,
          ID.unique(),
          {
            title: title || file.name,
            description: description || '',
            category: category || 'Other',
            tags: Array.isArray(tags) ? tags : [],
            imageUrl: this.getFilePreview(uploadedFile.$id),
            fileId: uploadedFile.$id,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            owner: this.getCurrentUserId(),
            likes: 0,
            favorites: 0,
            createdAt: new Date().toISOString()
          }
        );
      }
      
      return uploadedFile;
    } catch (error) {
      console.error("Error uploading wallpaper:", error);
      throw error;
    }
  }

  // Helper method to get current user ID
  getCurrentUserId() {
    // Check if we're in a browser environment before accessing localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || 'anonymous';
    }
    return 'anonymous';
  }

  async getWallpapers(page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit;
      const response = await storage.listFiles(
        config.bucketId,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      return response.files.map(file => ({
        id: file.$id,
        name: file.name,
        url: storage.getFilePreview(
          config.bucketId,
          file.$id,
          2000,
          2000,
          'center',
          100
        ).href,
        width: file.width || 1920,
        height: file.height || 1080,
        createdAt: file.$createdAt,
      }));
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      return [];
    }
  }

  async deleteWallpaper(fileId) {
    try {
      await storage.deleteFile(config.bucketId, fileId);
      return true;
    } catch (error) {
      console.error("Error deleting wallpaper:", error);
      return false;
    }
  }

  getFilePreview(fileId, width = 2000, height = 2000) {
    return storage.getFilePreview(
      config.bucketId,
      fileId,
      width,
      height,
      'center',
      100
    ).href;
  }

  async getWallpaperStats(wallpaperId) {
    try {
      const [likes, favorites] = await Promise.all([
        databases.listDocuments(
          config.databaseId,
          config.collections.likes,
          [Query.equal('wallpaperId', wallpaperId)]
        ),
        databases.listDocuments(
          config.databaseId,
          config.collections.favorites,
          [Query.equal('wallpaperId', wallpaperId)]
        )
      ]);

      return {
        likes: likes.total,
        favorites: favorites.total
      };
    } catch (error) {
      console.error("Error fetching wallpaper stats:", error);
      return { likes: 0, favorites: 0 };
    }
  }

  // Fast search wallpapers by keyword (title, tags, category) with pagination
  async searchWallpapers(keyword = '', page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit;
      // Build search queries
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];
      if (keyword) {
        queries.push(
          Query.or([
            Query.search('title', keyword),
            Query.search('tags', keyword),
            Query.search('category', keyword)
          ])
        );
      }
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.wallpapers,
        queries
      );
      return response.documents.map(doc => ({
        id: doc.$id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        tags: doc.tags,
        imageUrl: doc.imageUrl,
        fileId: doc.fileId,
        createdAt: doc.createdAt
      }));
    } catch (error) {
      console.error('Error searching wallpapers:', error);
      return [];
    }
  }
}

const wallpaperService = new WallpaperService();
export default wallpaperService;
