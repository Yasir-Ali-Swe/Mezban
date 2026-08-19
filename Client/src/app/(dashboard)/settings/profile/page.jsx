'use client';

import { UserProfile } from '@clerk/nextjs';

const ProfilePage = () => {
    return (
        <div className="w-full flex items-center justify-center">
            <UserProfile routing="hash" />
        </div>
    );
};

export default ProfilePage;