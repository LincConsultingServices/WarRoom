// Minimal Howler type shim — we only use a tiny slice of its API.
// Replace with `@types/howler` if/when the dep is added.

declare module 'howler' {
  export interface HowlOptions {
    src: string | string[]
    volume?: number
    html5?: boolean
    preload?: boolean | 'metadata'
    loop?: boolean
    autoplay?: boolean
    rate?: number
    mute?: boolean
    onload?: () => void
    onloaderror?: (id: number, err: unknown) => void
    onplay?: (id: number) => void
    onplayerror?: (id: number, err: unknown) => void
    onend?: (id: number) => void
    onstop?: (id: number) => void
    onfade?: (id: number) => void
  }

  export class Howl {
    constructor(opts: HowlOptions)
    play(spriteOrId?: string | number): number
    pause(id?: number): this
    stop(id?: number): this
    mute(muted?: boolean, id?: number): this | boolean
    volume(): number
    volume(vol: number, id?: number): this
    fade(from: number, to: number, duration: number, id?: number): this
    seek(): number
    seek(seek: number, id?: number): this
    rate(): number
    rate(rate: number, id?: number): this
    load(): this
    playing(id?: number): boolean
    duration(id?: number): number
    state(): 'unloaded' | 'loading' | 'loaded'
    on(event: string, fn: (...args: unknown[]) => void, id?: number): this
    once(event: string, fn: (...args: unknown[]) => void, id?: number): this
    off(event?: string, fn?: (...args: unknown[]) => void, id?: number): this
    unload(): void
  }

  export const Howler: {
    volume(): number
    volume(vol: number): unknown
    mute(muted?: boolean): unknown
    unload(): void
    codecs(ext: string): boolean
    autoUnlock: boolean
    html5PoolSize: number
    ctx: AudioContext | null
  }
}
