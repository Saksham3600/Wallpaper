import { databases } from './config';
import config from './config';
import { ID, Query } from 'appwrite';

class InteractionService {
  async likeWallpaper(userId, wallpaperId) {
    try {
      // Check if already liked
      const existing = await this.isWallpaperLikedByUser(userId, wallpaperId);
      if (existing) {
        return existing;
      }

      const like = await databases.createDocument(
        config.databaseId,
        config.collections.likes,
        ID.unique(),
        {
          userId,
          wallpaperId,
          createdAt: new Date().toISOString()
        }
      );

      // Update wallpaper likes count
      await this.updateWallpaperLikesCount(wallpaperId, 1);

      return like;
    } catch (error) {
      console.error("Like wallpaper error:", error);
      throw error;
    }
  }

  async unlikeWallpaper(userId, wallpaperId) {
    try {
      const like = await this.isWallpaperLikedByUser(userId, wallpaperId);
      if (!like) return true;

      await databases.deleteDocument(
        config.databaseId,
        config.collections.likes,
        like.$id
      );

      // Update wallpaper likes count
      await this.updateWallpaperLikesCount(wallpaperId, -1);

      return true;
    } catch (error) {
      console.error("Unlike wallpaper error:", error);
      return false;
    }
  }

  async isWallpaperLikedByUser(userId, wallpaperId) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.likes,
        [
          Query.equal('userId', userId),
          Query.equal('wallpaperId', wallpaperId)
        ]
      );
      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error("Check like status error:", error);
      return null;
    }
  }

  async addToFavorites(userId, wallpaperId) {
    try {
      // Check if already in favorites
      const existing = await this.isWallpaperInFavorites(userId, wallpaperId);
      if (existing) {
        return existing;
      }

      const favorite = await databases.createDocument(
        config.databaseId,
        config.collections.favorites,
        ID.unique(),
        {
          userId,
          wallpaperId,
          createdAt: new Date().toISOString()
        }
      );

      // Update wallpaper favorites count
      await this.updateWallpaperFavoritesCount(wallpaperId, 1);

      return favorite;
    } catch (error) {
      console.error("Add to favorites error:", error);
      throw error;
    }
  }

  async removeFromFavorites(userId, wallpaperId) {
    try {
      const favorite = await this.isWallpaperInFavorites(userId, wallpaperId);
      if (!favorite) return true;

      await databases.deleteDocument(
        config.databaseId,
        config.collections.favorites,
        favorite.$id
      );

      // Update wallpaper favorites count
      await this.updateWallpaperFavoritesCount(wallpaperId, -1);

      return true;
    } catch (error) {
      console.error("Remove from favorites error:", error);
      return false;
    }
  }

  async isWallpaperInFavorites(userId, wallpaperId) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.favorites,
        [
          Query.equal('userId', userId),
          Query.equal('wallpaperId', wallpaperId)
        ]
      );
      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error("Check favorite status error:", error);
      return null;
    }
  }

  async getUserFavorites(userId, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit;
      const favorites = await databases.listDocuments(
        config.databaseId,
        config.collections.favorites,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      return favorites.documents;
    } catch (error) {
      console.error("Get user favorites error:", error);
      return [];
    }
  }

  async getUserLikes(userId, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit;
      const likes = await databases.listDocuments(
        config.databaseId,
        config.collections.likes,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      return likes.documents;
    } catch (error) {
      console.error("Get user likes error:", error);
      return [];
    }
  }

  async updateWallpaperLikesCount(wallpaperId, change) {
    try {
      const wallpaper = await databases.getDocument(
        config.databaseId,
        config.collections.wallpapers,
        wallpaperId
      );

      await databases.updateDocument(
        config.databaseId,
        config.collections.wallpapers,
        wallpaperId,
        {
          likesCount: (wallpaper.likesCount || 0) + change
        }
      );
    } catch (error) {
      console.error("Update likes count error:", error);
    }
  }

  async updateWallpaperFavoritesCount(wallpaperId, change) {
    try {
      const wallpaper = await databases.getDocument(
        config.databaseId,
        config.collections.wallpapers,
        wallpaperId
      );

      await databases.updateDocument(
        config.databaseId,
        config.collections.wallpapers,
        wallpaperId,
        {
          favoritesCount: (wallpaper.favoritesCount || 0) + change
        }
      );
    } catch (error) {
      console.error("Update favorites count error:", error);
    }
  }
}

const interactionService = new InteractionService();
export default interactionService;
