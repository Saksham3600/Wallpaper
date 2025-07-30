'use client';

import { useState } from 'react';
import Image from 'next/image';
import userService from '@/lib/appwrite/user.service';
import { useAuth } from '@/context/AuthContext';

const ProfileImageUpload = () => {
    const { user, setUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const imageUrl = await userService.uploadProfileImage(file);
            setUser({ ...user, profileImage: imageUrl });
        } catch (error) {
            console.error('Error uploading profile image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {user?.profileImage ? (
                    <Image
                        src={user.profileImage}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="(max-width: 128px) 100vw, 128px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-4xl text-gray-500 uppercase">
                            {user?.name?.charAt(0) || '?'}
                        </span>
                    </div>
                )}
                
                {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    </div>
                )}
            </div>

            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                />
                {isUploading ? 'Uploading...' : 'Change Profile Picture'}
            </label>
        </div>
    );
};

export default ProfileImageUpload;
