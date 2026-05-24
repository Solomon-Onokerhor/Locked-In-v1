import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

/**
 * AuthHeader — shows sign-in/sign-up when signed out, user button when signed in.
 * Uses Clerk's SSR-compatible Show component to prevent hydration mismatch.
 */
export function AuthHeader() {
    return (
        <header className="flex justify-end items-center p-4 gap-4 h-16 absolute top-0 right-0 z-50">
            <Show 
                when="signed-in"
                fallback={
                    <>
                        <SignInButton />
                        <SignUpButton />
                    </>
                }
            >
                <UserButton />
            </Show>
        </header>
    );
}
