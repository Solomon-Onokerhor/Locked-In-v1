'use client';

import { useAuth } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

/**
 * AuthHeader — shows user button when signed in.
 */
export function AuthHeader() {
    const { isSignedIn } = useAuth();

    if (!isSignedIn) return null;

    return (
        <header className="flex justify-end items-center p-4 gap-4 h-16 absolute top-0 right-0 z-50">
            <div className="flex items-center gap-3">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
            </div>
        </header>
    );
}
