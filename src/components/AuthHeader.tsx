'use client';

import { useUser } from '@clerk/nextjs';
import { SignInButton, SignUpButton, SignOutButton, UserButton } from '@clerk/nextjs';

/**
 * AuthHeader — shows sign-in/sign-up when signed out, user button when signed in.
 * Client component so it can use useUser() for reactive state.
 */
export function AuthHeader() {
    const { isSignedIn, isLoaded } = useUser();

    if (!isLoaded) return null;

    return (
        <header className="flex justify-end items-center p-4 gap-4 h-16 absolute top-0 right-0 z-50">
            {isSignedIn ? (
                <UserButton />
            ) : (
                <>
                    <SignInButton />
                    <SignUpButton />
                </>
            )}
        </header>
    );
}
