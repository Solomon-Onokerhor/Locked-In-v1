
export type AvatarData<AnimationName extends string = string> = Readonly<{
  version: number
  avatar: Readonly<{ name: string } & Record<string, unknown>>
  expressions: Readonly<Record<string, unknown>>
  animations: Readonly<Record<AnimationName, unknown>>
}>

export type RuntimeAvatar<AnimationName extends string = string> = {
  play: (animation?: AnimationName) => RuntimeAvatar<AnimationName>
  pause: () => RuntimeAvatar<AnimationName>
  stop: () => RuntimeAvatar<AnimationName>
  destroy: () => void
}

export type AvatarRuntimeModule<AnimationName extends string = string> = {
  createAvatar: (
    target: HTMLElement,
    options: {
      animation: AnimationName
      autoplay: boolean
      loop?: boolean
      size: string
      onAnimationEnd: (animation: AnimationName) => void
    }
  ) => RuntimeAvatar<AnimationName>
}

export const AVATAR_RUNTIME_VERSION = 1
