"use client";
import { useEffect, useState } from "react";
import { storage } from "@/lib/appwrite/config";
import config from "@/lib/appwrite/config";
import { Query } from "appwrite";
import WallpaperCard from "@/components/WallpaperCard";
import Image from "next/image";
import {
  FaDownload,
  FaHeart,
  FaRegHeart,
  FaUserPlus,
  FaUserCheck,
} from "react-icons/fa";
import wallpaperService from "@/lib/appwrite/wallpaper.service";

const WallpaperSkeleton = () => (
  <div className="relative rounded-xl overflow-hidden bg-gray-200 animate-pulse" style={{ paddingTop: "75%" }}>
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-300" />
  </div>
);

const CategoryButton = ({ children, active, count, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all group flex items-center gap-2 ${
      active
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    <span>{children}</span>
    {count !== undefined && count > 0 && (
      <span
        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
          active
            ? "bg-white/20 text-white"
            : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
        }`}
      >
        {count.toLocaleString()}
      </span>
    )}
  </button>
);

const WallpaperGallery = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [categories, setCategories] = useState([
    { id: "all", name: "All" },
    { id: "nature", name: "Nature" },
    { id: "abstract", name: "Abstract" },
    { id: "minimal", name: "Minimal" },
    { id: "dark", name: "Dark" },
    { id: "light", name: "Light" },
    { id: "gaming", name: "Gaming" },
    { id: "space", name: "Space" },
    { id: "animals", name: "Animals" },
    { id: "architecture", name: "Architecture" }
  ]);

  const [allWallpapers, setAllWallpapers] = useState([]);

  // Initial load of wallpapers
  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        setLoading(true);
        
        // Fetch files from storage directly
        const response = await storage.listFiles(
          config.bucketId,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.offset(0)
          ]
        );

        let files = response.files;

        // Apply category filter if needed
        if (activeCategory !== "all") {
          files = files.filter(file =>
            file.name.toLowerCase().includes(activeCategory.toLowerCase())
          );
        }

        // Apply search filter if needed
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          files = files.filter(file => {
            const title = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
            const category = activeCategory.toLowerCase();

        return (
              title.includes(query) ||
              category.includes(query)
            );
          });
        }

        // Map files to wallpaper format
        const wallpaperData = await Promise.all(
          files.map(async (file) => {
            const fileUrl = storage.getFileView(config.bucketId, file.$id);
            const previewUrl = storage.getFilePreview(config.bucketId, file.$id, 400, 300, 'center', 80);

            return {
              id: file.$id,
              title: file.name.replace(/\.[^/.]+$/, ""),
              description: file.name,
              imageUrl: fileUrl,
              thumbnail: previewUrl,
              category: activeCategory !== 'all' ? activeCategory : 'uncategorized',
              tags: [],
              uploaderName: "Anonymous",
              uploaderAvatar: "/avatar.png",
              uploaderId: file.userId || "anonymous",
              uploadDate: new Date(file.$createdAt).toLocaleDateString(),
              liked: false,
              likes: Math.floor(Math.random() * 100),
              downloads: Math.floor(Math.random() * 50),
              following: false,
              width: file.width || 1920,
              height: file.height || 1080,
            };
          })
        );

        setAllWallpapers(wallpaperData);
        setWallpapers(wallpaperData);
      } catch (error) {
        console.error("❌ Failed to load wallpapers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpapers();
  }, []); // Only run once on mount

  // Filter wallpapers based on search and category
  useEffect(() => {
    if (allWallpapers.length > 0) {
      let filtered = [...allWallpapers];
      
      // Apply category filter
      if (activeCategory !== "all") {
        filtered = filtered.filter(wp => 
          wp.title.toLowerCase().includes(activeCategory.toLowerCase())
        );
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(wp => 
          wp.title.toLowerCase().includes(query)
        );
      }

      setWallpapers(filtered);
    }
  }, [allWallpapers, activeCategory, searchQuery]);

  useEffect(() => {
    if (!loading && wallpapers.length > 0) {
      const categoryCounts = wallpapers.reduce((acc, wp) => {
        const category = wp.category.toLowerCase();
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      setCategories(prev => prev.map(cat => ({
        ...cat,
        count: cat.id === 'all' ? wallpapers.length : categoryCounts[cat.id.toLowerCase()] || 0
      })));
    }
  }, [wallpapers, loading]);

  // Load More functionality
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loadingMore, setLoadingMore] = useState(false);
  // Track if there are more wallpapers to load
  const [hasMore, setHasMore] = useState(true);

  const loadMoreWallpapers = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    try {
      const nextPage = page + 1;
      const offset = (nextPage - 1) * limit;
      
      // Fetch next page of files
      const response = await storage.listFiles(
        config.bucketId,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      // Keep track of existing IDs to avoid duplicates
      const existingIds = new Set(allWallpapers.map(wp => wp.id));

      let newFiles = response.files;

      // Apply filters
      if (activeCategory !== "all") {
        newFiles = newFiles.filter(file =>
          file.name.toLowerCase().includes(activeCategory.toLowerCase())
        );
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        newFiles = newFiles.filter(file => {
          const title = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
          return title.includes(query);
        });
      }

      // Map to wallpaper format
      const newWallpapers = await Promise.all(
        newFiles.map(async (file) => {
          const fileUrl = storage.getFileView(config.bucketId, file.$id);
          const previewUrl = storage.getFilePreview(config.bucketId, file.$id, 400, 300, 'center', 80);
          
          return {
            id: file.$id,
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: file.name,
            imageUrl: fileUrl,
            thumbnail: previewUrl,
            category: activeCategory !== 'all' ? activeCategory : 'uncategorized',
            tags: [],
            uploaderName: "Anonymous",
            uploaderAvatar: "/avatar.png",
            uploaderId: file.userId || "anonymous",
            uploadDate: new Date(file.$createdAt).toLocaleDateString(),
            liked: false,
            likes: Math.floor(Math.random() * 100),
            downloads: Math.floor(Math.random() * 50),
            following: false,
            width: file.width || 1920,
            height: file.height || 1080
          };
        })
      );

      if (newWallpapers.length === 0 || newWallpapers.length < limit) {
        setHasMore(false);
      }

      // Only add new wallpapers that aren't already in the list
      const uniqueNewWallpapers = newWallpapers.filter(wp => !existingIds.has(wp.id));
      
      if (uniqueNewWallpapers.length === 0 || uniqueNewWallpapers.length < limit) {
        setHasMore(false);
      }

      setAllWallpapers(prev => [...prev, ...uniqueNewWallpapers]);
      setWallpapers(prev => [...prev, ...uniqueNewWallpapers]);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more wallpapers:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Reset hasMore when search or category changes
  useEffect(() => {
    setHasMore(true);
    setPage(1);
  }, [searchQuery, activeCategory]);

  const closeModal = () => setSelectedWallpaper(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Load More Button */}
  

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-gray-800 to-blue-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Amazing Wallpapers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Find the perfect wallpaper for your device
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search wallpapers by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-full text-gray-900 bg-white/90 backdrop-blur-sm border-0 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
                />
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 ${!searchQuery && 'hidden'}`}
                >
                  ✕
                </button>
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
                  onClick={() => document.querySelector('input[type="text"]').focus()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16">
          <svg
            className="absolute bottom-0 w-full h-16 text-gray-50"
            preserveAspectRatio="none"
            viewBox="0 0 1440 54"
            fill="currentColor"
          >
            <path d="M0 22L120 16.7C240 11 480 1.00001 720 0.700012C960 1.00001 1200 11 1320 16.7L1440 22V54H1320C1200 54 960 54 720 54C480 54 240 54 120 54H0V22Z" />
          </svg>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              active={activeCategory === category.id}
              count={category.id === 'all' ? wallpapers.length : category.count}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </CategoryButton>
          ))}
        </div>

        {/* Wallpapers Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 gap-3 space-y-3 mx-auto px-4 w-full">
          {loading ? (
            Array(8).fill(0).map((_, i) => <WallpaperSkeleton key={i} />)
          ) : wallpapers.length === 0 ? (
            <p className="text-center text-gray-500 col-span-full">No wallpapers found.</p>
          ) : (
            wallpapers.map((wp) => (
              <div key={wp.id} className="break-inside-avoid mb-3">
                <div className="transform hover:scale-[1.02] transition-all duration-300 ease-in-out">
                  <WallpaperCard wallpaper={wp} onSelect={() => setSelectedWallpaper(wp)} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-center py-8">
          {hasMore ? (
            <button
              onClick={loadMoreWallpapers}
              disabled={loadingMore}
              className="px-6 py-3 rounded-full bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          ) : (
            <span className="text-gray-400">All wallpapers loaded.</span>
          )}
        </div>
      </div>

      {/* Modal (same as before, not repeated here for brevity) */}
      {/* ... include your full modal code here ... */}
    </div>
  );
};
handleWebpackExternalForEdgeRuntime;

export default WallpaperGallery;
