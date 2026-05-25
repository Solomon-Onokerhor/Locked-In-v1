import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        routing="path"
        path="/sign-in"
        appearance={{
          elements: {
            otpCodeFieldInput:
              'w-12 h-12 text-xl text-center rounded-xl border border-white/20 bg-white/5 text-white focus:border-white/50 focus:ring-0 caret-white',
            otpCodeField: 'gap-2 justify-center',
          },
        }}
      />
    </div>
  )
}
