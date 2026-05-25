import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050505]">

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-3xl" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Branding */}
      <div className="relative z-10 mb-8 text-center px-4">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 6V12C4 16.418 7.582 20.418 12 22C16.418 20.418 20 16.418 20 12V6L12 2Z" fill="#050505" />
            </svg>
          </div>
          <span className="text-white text-2xl font-black tracking-tight">Locked In</span>
        </div>
        <p className="text-gray-400 text-sm font-medium">Join thousands of UMaT students. Study smarter.</p>
      </div>

      {/* Clerk Widget */}
      <div className="relative z-10 w-full max-w-[420px] px-4">
        <SignUp
          routing="path"
          path="/sign-up"
          appearance={{
            variables: {
              colorPrimary: '#ffffff',
              colorBackground: '#0f0f0f',
              colorText: '#f6fafd',
              colorTextSecondary: '#9ca3af',
              colorInputBackground: '#1a1a1a',
              colorInputText: '#ffffff',
              borderRadius: '0.875rem',
              fontFamily: 'Manrope, ui-sans-serif, system-ui, sans-serif',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-2xl border border-white/10 bg-[#0f0f0f] rounded-2xl',
              headerTitle: 'text-white font-black',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all',
              formButtonPrimary: 'bg-white text-black hover:bg-gray-100 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]',
              formFieldInput: 'bg-[#1a1a1a] border-white/10 text-white rounded-xl focus:border-white/30 focus:ring-0',
              formFieldLabel: 'text-gray-300 font-medium',
              footerActionLink: 'text-white hover:text-gray-300 font-semibold',
              identityPreviewText: 'text-gray-300',
              formResendCodeLink: 'text-gray-400 hover:text-white',
              dividerLine: 'bg-white/10',
              dividerText: 'text-gray-500',
              alertText: 'text-red-400',
            }
          }}
        />
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-gray-600 text-xs text-center px-4">
        Built for UMaT students · Locked In © 2025
      </p>
    </div>
  )
}
