import { Client, Account, Storage, Databases } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

const config = {
  appwriteUrl: String(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT),
  appwriteProjectId: String(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
  databaseId: String(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID),
  collections: {
    users: String(process.env.NEXT_PUBLIC_COLLECTION_USER_ID),
    wallpapers: String(process.env.NEXT_PUBLIC_COLLECTION_WALLPAPER_ID),
    likes: String(process.env.NEXT_PUBLIC_COLLECTION_LIKES_ID),
    favourites: String(process.env.NEXT_PUBLIC_COLLECTION_FAVOURITES_ID),
    follows: String(process.env.NEXT_PUBLIC_COLLECTION_FOLLOWS_ID),
    downloads: 'downloads', // Add downloads collection
  },
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '',
};

export default config;
