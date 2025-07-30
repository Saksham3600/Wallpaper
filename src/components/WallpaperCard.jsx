"use client";
import { useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaDownload,
  FaUserPlus,
  FaUserCheck,
} from "react-icons/fa";
import wallpaperService from "@/lib/appwrite/wallpaper.service";

const WallpaperCard = ({ wallpaper, onSelect }) => {
  const [liked, setLiked] = useState(wallpaper.liked);
  const [likes, setLikes] = useState(wallpaper.likes);
  const [following, setFollowing] = useState(wallpaper.following);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      await wallpaperService.toggleLike(wallpaper.id);
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    try {
      await wallpaperService.toggleFollow(wallpaper.uploaderId);
      setFollowing(!following);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    setShowDownloadOptions(!showDownloadOptions);
  };

  const handleDownload = async (url, size) => {
    try {
      await wallpaperService.download(url, `${wallpaper.title}_${size}`);
      setShowDownloadOptions(false);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const downloadOptions = [
    { size: "Original", url: wallpaper.imageUrl },
    { size: "HD (1920x1080)", url: `${wallpaper.imageUrl}?size=hd` },
    { size: "4K (3840x2160)", url: `${wallpaper.imageUrl}?size=4k` },
  ];

  return (
    <div
      onClick={() => onSelect && onSelect(wallpaper)}
      className="relative group break-inside-avoid rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-900"
    >
      <div className="relative">
        {/* Image */}
        <img
          src={wallpaper.imageUrl}
          alt={wallpaper.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Title and Stats */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-medium truncate mb-2">
            {wallpaper.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-white/90 text-sm flex items-center gap-1">
              <FaHeart className="text-pink-500" size={12} /> {likes}
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={handleLike}
            className="text-white hover:text-pink-400 transition"
            title="Like"
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
          </button>

          <button
            onClick={handleFollow}
            className="text-white hover:text-blue-300 transition"
            title={following ? "Unfollow" : "Follow"}
          >
            {following ? <FaUserCheck /> : <FaUserPlus />}
          </button>

          <div className="relative">
            <button
              onClick={handleDownloadClick}
              className="text-white hover:text-green-300 transition"
              title="Download"
            >
              <FaDownload />
            </button>

            {/* Download Options Dropdown */}
            {showDownloadOptions && (
              <div
                className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {downloadOptions.map((option) => (
                  <button
                    key={option.size}
                    onClick={() =>
                      handleDownload(option.url, option.size.replace(/\s+/g, ""))
                    }
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {option.size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallpaperCard;
