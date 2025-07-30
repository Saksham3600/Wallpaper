'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { FaHeart, FaDownload, FaUsers, FaImages, FaEdit, FaTwitter, FaInstagram, FaGithub, FaGlobe } from 'react-icons/fa';
import userService from '@/lib/appwrite/user.service';
import wallpaperService from '@/lib/appwrite/wallpaper.service';

const StatCard = ({ icon, value, label, trend }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {value.toLocaleString()}
          </div>
          {trend && (
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
              trend > 0 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-gray-600 mt-1">{label}</div>
      </div>
    </div>
  </div>
);

const SocialLink = ({ icon, url, platform }) => {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
      title={platform}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
    </a>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [userWallpapers, setUserWallpapers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('wallpapers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    social: {
      twitter: '',
      instagram: '',
      github: ''
    }
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userStats, wallpapers] = await Promise.all([
          userService.getUserStats(user.$id),
          wallpaperService.getUserWallpapers(user.$id)
        ]);
        setStats(userStats);
        setUserWallpapers(wallpapers);
        
        // Get user preferences for editable fields
        const prefs = await userService.getCurrentUser();
        setFormData({
          name: prefs.name || user.name,
          bio: prefs.bio || '',
          location: prefs.location || '',
          website: prefs.website || '',
          social: prefs.social || {
            twitter: '',
            instagram: '',
            github: ''
          }
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    const fetchSocialData = async () => {
      if (!user) return;
      try {
        const [followersList, followingList, downloads] = await Promise.all([
          userService.getFollowers(user.$id),
          userService.getFollowing(user.$id),
          wallpaperService.getUserDownloads(user.$id)
        ]);
        setFollowers(followersList);
        setFollowing(followingList);
        setDownloadHistory(downloads);
      } catch (error) {
        console.error('Failed to fetch social data:', error);
      }
    };
    fetchSocialData();
  }, [user]);

  const handleEditToggle = () => setEditing(!editing);

  const handleSave = async () => {
    try {
      await userService.updateUserPrefs(formData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Please sign in to view your profile</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 h-60"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Image
                  src={user.profileImage || '/avatar.png'}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-xl shadow-lg"
                />
                <button 
                  onClick={() => document.getElementById('avatar-upload').click()}
                  className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <FaEdit className="w-4 h-4 text-gray-600" />
                </button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => userService.uploadProfileImage(e.target.files[0])}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-grow">
              {editing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xl font-semibold text-gray-800 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 text-gray-600 border rounded focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Location"
                      className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="Website URL"
                      className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleEditToggle}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800 mb-1">{formData.name}</h1>
                      {formData.bio && (
                        <p className="text-gray-600 mb-2">{formData.bio}</p>
                      )}
                      {formData.location && (
                        <p className="text-gray-500 text-sm">{formData.location}</p>
                      )}
                    </div>
                    <button
                      onClick={handleEditToggle}
                      className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <FaEdit className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <SocialLink
                      icon={<FaTwitter className="w-5 h-5" />}
                      url={formData.social?.twitter}
                      platform="Twitter"
                    />
                    <SocialLink
                      icon={<FaInstagram className="w-5 h-5" />}
                      url={formData.social?.instagram}
                      platform="Instagram"
                    />
                    <SocialLink
                      icon={<FaGithub className="w-5 h-5" />}
                      url={formData.social?.github}
                      platform="GitHub"
                    />
                    {formData.website && (
                      <SocialLink
                        icon={<FaGlobe className="w-5 h-5" />}
                        url={formData.website}
                        platform="Website"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard
              icon={<FaHeart className="w-5 h-5" />}
              value={stats?.totalLikes || 0}
              label="Total Likes"
              trend={stats?.likesGrowth}
            />
            <StatCard
              icon={<FaUsers className="w-5 h-5" />}
              value={stats?.followers || 0}
              label="Followers"
              trend={stats?.followersGrowth}
            />
            <StatCard
              icon={<FaDownload className="w-5 h-5" />}
              value={stats?.downloads || 0}
              label="Downloads"
              trend={stats?.downloadsGrowth}
            />
            <StatCard
              icon={<FaImages className="w-5 h-5" />}
              value={stats?.uploads || 0}
              label="Uploads"
              trend={stats?.uploadsGrowth}
            />
          </div>

          {/* Tabs Navigation */}
          <div className="mt-8 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'wallpapers', label: 'Wallpapers', icon: FaImages },
                { id: 'followers', label: 'Followers', icon: FaUsers },
                { id: 'downloads', label: 'Downloads', icon: FaDownload },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {id === 'followers' && <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">{followers.length}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'wallpapers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {userWallpapers.map((wallpaper) => (
                  <div
                    key={wallpaper.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={wallpaper.thumbnail}
                      alt={wallpaper.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800">{wallpaper.title}</h3>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaHeart className="w-4 h-4 text-pink-500" />
                          {wallpaper.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaDownload className="w-4 h-4 text-blue-500" />
                          {wallpaper.downloads}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'followers' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={follower.avatarUrl || '/default-avatar.png'}
                      alt={follower.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{follower.name}</h3>
                      <p className="text-sm text-gray-500">Following since {new Date(follower.followDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Download History</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Total Downloads: {stats?.downloads || 0}</span>
                    <button 
                      onClick={() => {
                        const downloadUrls = downloadHistory.map(d => ({
                          url: d.wallpaper.imageUrl,
                          filename: d.wallpaper.title
                        }));
                        wallpaperService.downloadMultiple(downloadUrls);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      disabled={downloadHistory.length === 0}
                    >
                      <FaDownload className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  </div>
                </div>
                {downloadHistory.map((download) => (
                  <div
                    key={download.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={download.wallpaper.thumbnail}
                      alt={download.wallpaper.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{download.wallpaper.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500">
                          Downloaded on {new Date(download.downloadDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {download.wallpaper.width} × {download.wallpaper.height}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {(download.wallpaper.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {download.wallpaper.format || 'JPG'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await wallpaperService.download(download.wallpaper.imageUrl, download.wallpaper.title);
                          // Update download count in stats
                          setStats(prev => ({
                            ...prev,
                            downloads: (prev.downloads || 0) + 1
                          }));
                        } catch (error) {
                          console.error('Failed to download:', error);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Download again"
                    >
                      <FaDownload className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    
  </div>

)};

export default ProfilePage;
