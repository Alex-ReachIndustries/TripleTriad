/**
 * AudioManager — singleton BGM controller for Triple Triad.
 *
 * Uses HTMLAudioElement for cross-platform compatibility (browser + Capacitor WebView).
 * Handles autoplay restrictions, crossfade transitions, looping, and volume persistence.
 */

const FADE_MS = 800
const FADE_STEP_MS = 30
const MUSIC_BASE = '/music/'

export class AudioManager {
  private static instance: AudioManager | null = null

  private current: HTMLAudioElement | null = null
  private currentTrack: string | null = null
  private volume = 0.5
  private muted = false
  private unlocked = false // Tracks whether user gesture has allowed audio

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /** Call on first user interaction to unlock audio context (autoplay policy) */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    // Play silent audio to unlock on iOS/Android
    const silent = new Audio()
    silent.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwTHAAAAAAD/+xBkAA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAAQAAAAAAAAAAAAA//sQZBQP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEAAAAAAAAAAAAA'
    silent.play().catch(() => {})
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.current && !this.muted) {
      this.current.volume = this.volume
    }
  }

  getVolume(): number {
    return this.volume
  }

  setMuted(m: boolean): void {
    this.muted = m
    if (this.current) {
      this.current.volume = m ? 0 : this.volume
    }
  }

  isMuted(): boolean {
    return this.muted
  }

  /** Play a track by ID (e.g. "title", "town_balamb_garden"). Crossfades if another track is playing. */
  play(trackId: string, loop = true): void {
    if (!this.unlocked) return
    if (trackId === this.currentTrack && this.current && !this.current.paused) return

    const src = `${MUSIC_BASE}${trackId}.mp3`
    const next = new Audio(src)
    next.loop = loop
    next.volume = 0 // Start silent for fade-in
    next.preload = 'auto'

    if (this.current && !this.current.paused) {
      this.fadeOut(this.current)
    }

    this.current = next
    this.currentTrack = trackId

    next.play().then(() => {
      this.fadeIn(next)
    }).catch(() => {
      // Autoplay blocked — will retry on next user gesture
      this.unlocked = false
    })
  }

  /** Play a one-shot track (victory/defeat fanfare). Does not loop. Resumes previous track when done. */
  playOneShot(trackId: string, onDone?: () => void): void {
    if (!this.unlocked) return

    const prevTrack = this.currentTrack
    const prevEl = this.current

    // Pause current
    if (prevEl && !prevEl.paused) {
      this.fadeOut(prevEl)
    }

    const src = `${MUSIC_BASE}${trackId}.mp3`
    const shot = new Audio(src)
    shot.loop = false
    shot.volume = this.muted ? 0 : this.volume

    shot.addEventListener('ended', () => {
      onDone?.()
      // Resume previous track
      if (prevTrack && prevEl) {
        this.current = prevEl
        this.currentTrack = prevTrack
        prevEl.play().then(() => this.fadeIn(prevEl)).catch(() => {})
      }
    }, { once: true })

    this.current = shot
    this.currentTrack = trackId
    shot.play().catch(() => {})
  }

  stop(): void {
    if (this.current) {
      this.fadeOut(this.current)
      this.current = null
      this.currentTrack = null
    }
  }

  pause(): void {
    if (this.current && !this.current.paused) {
      this.current.pause()
    }
  }

  resume(): void {
    if (this.current && this.current.paused && this.currentTrack) {
      this.current.play().catch(() => {})
    }
  }

  getCurrentTrack(): string | null {
    return this.currentTrack
  }

  isPlaying(): boolean {
    return !!(this.current && !this.current.paused)
  }

  private fadeIn(el: HTMLAudioElement): void {
    const target = this.muted ? 0 : this.volume
    const steps = Math.ceil(FADE_MS / FADE_STEP_MS)
    const increment = target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      el.volume = Math.min(target, increment * step)
      if (step >= steps) clearInterval(timer)
    }, FADE_STEP_MS)
  }

  private fadeOut(el: HTMLAudioElement): void {
    const startVol = el.volume
    const steps = Math.ceil(FADE_MS / FADE_STEP_MS)
    const decrement = startVol / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      el.volume = Math.max(0, startVol - decrement * step)
      if (step >= steps) {
        clearInterval(timer)
        el.pause()
        el.currentTime = 0
      }
    }, FADE_STEP_MS)
  }
}
