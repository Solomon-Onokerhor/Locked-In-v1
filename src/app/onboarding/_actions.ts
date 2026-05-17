'use server';

/**
 * Server action stub for onboarding completion.
 * This marks onboarding as complete and is called after the Supabase profile is updated.
 */
export async function completeOnboarding(formData: FormData): Promise<{ error?: string } | void> {
    try {
        // Profile is already saved to Supabase in the onboarding page component.
        // This server action is a no-op stub — onboarding state is controlled
        // by the presence of faculty/programme/level/whatsapp_number in the profile.
        return;
    } catch (err: any) {
        return { error: err?.message || 'Failed to complete onboarding.' };
    }
}
