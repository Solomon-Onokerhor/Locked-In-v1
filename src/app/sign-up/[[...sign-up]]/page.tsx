'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GrokBot } from '@/components/grok-bot'
import { Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react'

type AvatarAnimation = 'idle' | 'listening' | 'working' | 'thinking' | 'searching' | 'excited' | 'sad'

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])

  const [showPassword, setShowPassword] = useState(false)
  const [avatarAnimation, setAvatarAnimation] = useState<AvatarAnimation>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [verifying, setVerifying] = useState(false)

  const isLoading = fetchStatus === 'fetching'

  // OTP input refs
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (verifying) {
      setAvatarAnimation('searching')
      inputRefs[0]?.current?.focus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifying])

  const handleGoogleSignUp = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!signUp) return
    setAvatarAnimation('thinking')
    signUp.sso({
      strategy: 'oauth_google',
      redirectUrl: '/',
      redirectCallbackUrl: '/sso-callback'
    }).catch(() => {
      setAvatarAnimation('sad')
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!signUp) return

    setErrorMsg('')
    setAvatarAnimation('thinking')

    try {
      await signUp.password({
        firstName,
        lastName,
        emailAddress: email,
        password
      })

      await signUp.verifications.sendEmailCode()
      setVerifying(true)
    } catch (err: any) {
      setAvatarAnimation('sad')
      if (err.errors && err.errors.length > 0) {
        setErrorMsg(err.errors[0].longMessage || err.errors[0].message)
      } else if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg("An unknown error occurred")
      }
      setTimeout(() => {
        setAvatarAnimation('idle')
      }, 3000)
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (!signUp) return

    setErrorMsg('')
    setAvatarAnimation('thinking')

    const codeStr = code.join('')

    try {
      await signUp.verifications.verifyEmailCode({ code: codeStr })

      if (signUp.status === 'complete') {
        setAvatarAnimation('excited')
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl('/')
            if (url.startsWith('http')) {
              window.location.href = url
            } else {
              router.push(url)
            }
          }
        })
      }
    } catch (err: any) {
      setAvatarAnimation('sad')
      if (err.errors && err.errors.length > 0) {
        setErrorMsg(err.errors[0].longMessage || err.errors[0].message)
      } else if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg("An unknown error occurred")
      }
      setTimeout(() => {
        setAvatarAnimation('idle')
      }, 3000)
    }
  }

  const resendCode = async () => {
    if (!signUp) return
    try {
      await signUp.verifications.sendEmailCode()
      setErrorMsg('')
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setErrorMsg(err.errors[0].longMessage || err.errors[0].message)
      } else if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg("An unknown error occurred")
      }
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) {
      inputRefs[index + 1]?.current?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputRefs[5]?.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F6FAFD] flex flex-col md:flex-row">
      {/* Mobile Avatar */}
      <div className="md:hidden flex justify-center items-center py-8 bg-black/20">
        <GrokBot size={180} animation={avatarAnimation} theme={avatarAnimation === 'sad' ? 'error' : 'default'} />
      </div>

      {/* Left side (form) - ~60% */}
      <div className="flex-1 md:w-[60%] flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 relative z-10">
        {/* Brand */}
        <div className="absolute top-8 left-6 sm:left-12 lg:left-24 flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">Locked In</span>
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>

        <div className="max-w-md w-full mx-auto relative">
          <div className="bg-[rgba(15,15,15,0.6)] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

            {!verifying ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
                  <p className="text-gray-400 text-sm">Join the most focused students on campus</p>
                </div>

                {/* Google OAuth */}
                <button
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black rounded-xl py-3 px-4 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-gray-500 text-sm">or</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* Error banner */}
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name row */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="relative flex items-center">
                        <User className="absolute left-4 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value)
                            if (avatarAnimation !== 'working') setAvatarAnimation('working')
                          }}
                          onFocus={() => setAvatarAnimation('listening')}
                          onBlur={() => setAvatarAnimation('idle')}
                          placeholder="First name"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value)
                          if (avatarAnimation !== 'working') setAvatarAnimation('working')
                        }}
                        onFocus={() => setAvatarAnimation('listening')}
                        onBlur={() => setAvatarAnimation('idle')}
                        placeholder="Last name"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (avatarAnimation !== 'working') setAvatarAnimation('working')
                        }}
                        onFocus={() => setAvatarAnimation('listening')}
                        onBlur={() => setAvatarAnimation('idle')}
                        placeholder="Email address"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    {errors?.fields?.emailAddress && (
                      <p className="text-red-400 text-sm pl-1">{errors.fields.emailAddress.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 w-5 h-5 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (avatarAnimation !== 'working') setAvatarAnimation('working')
                        }}
                        onFocus={() => setAvatarAnimation('listening')}
                        onBlur={() => setAvatarAnimation('idle')}
                        placeholder="Password"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors?.fields?.password && (
                      <p className="text-red-400 text-sm pl-1">{errors.fields.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-white text-black rounded-xl py-3 px-4 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 mt-6"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link href="/sign-in" className="text-blue-500 hover:text-blue-400 transition-colors">
                      Sign in
                    </Link>
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Check your email</h1>
                  <p className="text-gray-400 text-sm">We sent a verification code to {email}</p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        onFocus={() => setAvatarAnimation('searching')}
                        className="w-12 h-14 text-xl text-center rounded-xl border border-white/20 bg-white/5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || code.join('').length !== 6}
                    className="w-full flex items-center justify-center bg-white text-black rounded-xl py-3 px-4 font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resendCode}
                      disabled={isLoading}
                      className="text-blue-500 hover:text-blue-400 text-sm transition-colors disabled:opacity-50"
                    >
                      Didn&apos;t get the code? Resend
                    </button>
                  </div>
                </form>
              </>
            )}

            <div id="clerk-captcha" />
          </div>
        </div>
      </div>

      {/* Right side (avatar) - ~40% */}
      <div className="hidden md:flex md:w-[40%] relative items-center justify-center overflow-hidden border-l border-white/5 bg-black/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-blue-500/[0.04] blur-[100px] pointer-events-none" />
        </div>
        <div className="relative z-10 transition-transform duration-500 hover:scale-105">
          <GrokBot size={280} animation={avatarAnimation} theme={avatarAnimation === 'sad' ? 'error' : 'default'} />
        </div>
      </div>
    </div>
  )
}




