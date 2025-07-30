'use client';

import Image from 'next/image';

const Avatar = ({ user }) => {
    return (
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
            {user?.profileImage && user.profileImage !== '/avatar.png' ? (
                <Image
                    src={user.profileImage}
                    alt={user.name || 'User avatar'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 40px) 100vw, 40px"
                />
            ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xl font-bold uppercase">
                        {user?.name?.charAt(0) || 'A'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default Avatar;
