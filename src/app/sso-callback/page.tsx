'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { GrokBot } from '@/components/grok-bot'

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Animated GrokBot thinking while SSO processes */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/[0.04] rounded-full blur-[60px] scale-150" />
          <GrokBot animation="thinking" size={200} />
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Completing sign in...</h2>
          <p className="text-sm text-gray-400">Hang tight, we&apos;re getting you set up.</p>
        </div>

        {/* Pulsing dots loader */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/40 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Clerk SSO callback handler */}
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
