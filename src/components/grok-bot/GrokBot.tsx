'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react'
import { loadAvatarRuntime, type RuntimeAvatar } from './avatar-runtime'
import { avatarData, type AnimationName } from './grok-bot.avatar'

export type { AnimationName } from './grok-bot.avatar'
export type AvatarHandle = {
  play: (animation?: AnimationName) => void
  pause: () => void
  stop: () => void
  setLookAt: (x: number, y: number) => void
}
export type AvatarProps = {
  animation?: AnimationName
  playing?: boolean
  loop?: boolean
  size?: number | string
  className?: string
  style?: CSSProperties
  theme?: 'default' | 'error'
  onAnimationEnd?: (animation: AnimationName) => void
}

export const GrokBot = forwardRef<AvatarHandle, AvatarProps>(function GrokBot(
  {
    animation = "idle",
    playing = true,
    loop,
    size = 240,
    className,
    style,
    theme = 'default',
    onAnimationEnd,
  },
  ref
) {
  const host = useRef<HTMLSpanElement>(null)
  const controller = useRef<RuntimeAvatar<AnimationName> | null>(null)
  const animationRef = useRef(animation)
  const playingRef = useRef(playing)
  const onAnimationEndRef = useRef(onAnimationEnd)
  animationRef.current = animation
  playingRef.current = playing
  onAnimationEndRef.current = onAnimationEnd

  useEffect(() => {
    if (!host.current) return
    let disposed = false
    let avatar: RuntimeAvatar<AnimationName> | null = null

    const dataToLoad = theme === 'error' ? {
      ...avatarData,
      avatar: {
        ...avatarData.avatar,
        colors: {
          body: '#B93030',
          eyes: '#5C0000'
        }
      }
    } : avatarData

    void loadAvatarRuntime<AnimationName>(dataToLoad).then(runtime => {
      if (disposed || !host.current) return
      avatar = runtime.createAvatar(host.current, {
        animation: animationRef.current,
        autoplay: playingRef.current,
        loop,
        size: '100%',
        onAnimationEnd: next => onAnimationEndRef.current?.(next),
      })
      controller.current = avatar
    })
    return () => {
      disposed = true
      avatar?.destroy()
      controller.current = null
    }
  }, [loop, theme])

  useEffect(() => {
    if (!host.current) return

    if (theme === 'error' || animation === 'angry') {
      // Snap to look straight ahead
      controller.current?.setLookAt(0, 0);
      
      // Violent shake via WAAPI
      const shake = host.current.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          { transform: 'translate(-8px, -8px) rotate(-3deg) scale(1.05)' },
          { transform: 'translate(8px, 8px) rotate(3deg) scale(1.05)' },
          { transform: 'translate(-8px, 8px) rotate(-3deg) scale(1.05)' },
          { transform: 'translate(8px, -8px) rotate(3deg) scale(1.05)' },
          { transform: 'translate(0, 0) rotate(0deg) scale(1)' }
        ],
        {
          duration: 250,
          iterations: Infinity,
          easing: 'linear'
        }
      )
      
      return () => shake.cancel()
    }

    // Cursor tracking
    let rafId: number
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!host.current) return
      const rect = host.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const maxRotate = 25 // degrees
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY
      
      // Calculate percentage of screen distance
      // Invert the mapping: moving right (positive deltaX) means we want positive headX
      // If it was inverted previously, let's negate deltaX and deltaY
      // Wait, earlier I had targetY = deltaX and targetX = -deltaY.
      // If it was inverted vertically and horizontally:
      targetY = -(deltaX / (window.innerWidth / 2)) * maxRotate 
      targetX = (deltaY / (window.innerHeight / 2)) * maxRotate
      
      // Clamp to max rotation
      targetY = Math.max(Math.min(targetY, maxRotate), -maxRotate)
      targetX = Math.max(Math.min(targetX, maxRotate), -maxRotate)
    }

    const animate = () => {
      // Lerp factor increased from 0.12 to 0.45 for much snappier, less laggy response
      currentX += (targetX - currentX) * 0.45
      currentY += (targetY - currentY) * 0.45

      // Apply to internal avatar state instead of CSS transform!
      // currentY maps to headX (horizontal), currentX maps to headY (vertical)
      controller.current?.setLookAt(currentY, currentX);

      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [theme, animation])

  useEffect(() => {
    const avatar = controller.current
    if (!avatar) return
    if (playing) avatar.play(animation)
    else avatar.pause()
  }, [animation, playing])

  useImperativeHandle(ref, () => ({
    play(next = animation) { controller.current?.play(next) },
    pause() { controller.current?.pause() },
    stop() { controller.current?.stop() },
    setLookAt(x, y) { controller.current?.setLookAt(x, y) },
  }), [animation])

  const dimension = typeof size === 'number' ? size + 'px' : size
  return <span ref={host} className={className} style={{ display: 'inline-block', width: dimension, height: dimension, ...style }} />
})

export default GrokBot

