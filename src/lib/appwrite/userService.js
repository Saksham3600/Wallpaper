import { databases } from './config';
import config from './config';
import { ID, Query } from 'appwrite';

class UserService {
  async followUser(followerId, followingId) {
    try {
      await databases.createDocument(
        config.databaseId,
        config.collections.followers,
        ID.unique(),
        {
          followerId,
          followingId,
          createdAt: new Date().toISOString()
        }
      );
      return true;
    } catch (error) {
      console.error("Follow user error:", error);
      return false;
    }
  }

  async unfollowUser(followerId, followingId) {
    try {
      const follow = await databases.listDocuments(
        config.databaseId,
        config.collections.followers,
        [
          Query.equal('followerId', followerId),
          Query.equal('followingId', followingId)
        ]
      );

      if (follow.documents.length > 0) {
        await databases.deleteDocument(
          config.databaseId,
          config.collections.followers,
          follow.documents[0].$id
        );
      }
      return true;
    } catch (error) {
      console.error("Unfollow user error:", error);
      return false;
    }
  }

  async getUserStats(userId) {
    try {
      const [followers, following, uploads, likes, favorites] = await Promise.all([
        // Get followers count
        databases.listDocuments(
          config.databaseId,
          config.collections.followers,
          [Query.equal('followingId', userId)]
        ),
        // Get following count
        databases.listDocuments(
          config.databaseId,
          config.collections.followers,
          [Query.equal('followerId', userId)]
        ),
        // Get uploads count
        databases.listDocuments(
          config.databaseId,
          config.collections.wallpapers,
          [Query.equal('userId', userId)]
        ),
        // Get total likes received
        databases.listDocuments(
          config.databaseId,
          config.collections.likes,
          [Query.equal('userId', userId)]
        ),
        // Get favorites count
        databases.listDocuments(
          config.databaseId,
          config.collections.favorites,
          [Query.equal('userId', userId)]
        )
      ]);

      return {
        followersCount: followers.total,
        followingCount: following.total,
        uploadsCount: uploads.total,
        likesCount: likes.total,
        favoritesCount: favorites.total
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      return {
        followersCount: 0,
        followingCount: 0,
        uploadsCount: 0,
        likesCount: 0,
        favoritesCount: 0
      };
    }
  }

  async getUserProfile(userId) {
    try {
      const stats = await this.getUserStats(userId);
      const uploads = await databases.listDocuments(
        config.databaseId,
        config.collections.wallpapers,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(12)
        ]
      );

      return {
        stats,
        recentUploads: uploads.documents
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      return null;
    }
  }

  async isFollowing(followerId, followingId) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.followers,
        [
          Query.equal('followerId', followerId),
          Query.equal('followingId', followingId)
        ]
      );
      return result.total > 0;
    } catch (error) {
      console.error("Check following status error:", error);
      return false;
    }
  }

  async getFollowers(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const followers = await databases.listDocuments(
        config.databaseId,
        config.collections.followers,
        [
          Query.equal('followingId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      return followers.documents;
    } catch (error) {
      console.error("Get followers error:", error);
      return [];
    }
  }

  async getFollowing(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const following = await databases.listDocuments(
        config.databaseId,
        config.collections.followers,
        [
          Query.equal('followerId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      return following.documents;
    } catch (error) {
      console.error("Get following error:", error);
      return [];
    }
  }
}

const userService = new UserService();
export default userService;
