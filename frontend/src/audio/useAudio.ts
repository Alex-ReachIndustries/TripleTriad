/**
 * React hook providing access to the AudioManager singleton.
 * Handles autoplay unlock on first user interaction and app visibility changes.
 */

import { useEffect, useCallback, useRef } from 'react'
import { AudioManager } from './AudioManager'

const audio = AudioManager.getInstance()

/** Unlock audio on first user gesture (click/touch/keydown) */
function useAutoplayUnlock(): void {
  useEffect(() => {
    const unlock = () => {
      audio.unlock()
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('click', unlock, { once: false })
    document.addEventListener('touchstart', unlock, { once: false })
    document.addEventListener('keydown', unlock, { once: false })
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])
}

/** Pause BGM when app goes to background, resume on foreground */
function useVisibilityPause(): void {
  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden) {
        audio.pause()
      } else {
        audio.resume()
      }
    }
    document.addEventListener('visibilitychange', onVisChange)
    return () => document.removeEventListener('visibilitychange', onVisChange)
  }, [])
}

export interface UseAudioReturn {
  play: (trackId: string, loop?: boolean) => void
  playOneShot: (trackId: string, onDone?: () => void) => void
  stop: () => void
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
  getVolume: () => number
  isMuted: () => boolean
}

/**
 * Main audio hook — call once in App.tsx.
 * Sets up autoplay unlock + visibility pause/resume.
 * Returns stable callbacks for play/stop/volume control.
 */
export function useAudio(): UseAudioReturn {
  useAutoplayUnlock()
  useVisibilityPause()

  const play = useCallback((trackId: string, loop = true) => {
    audio.play(trackId, loop)
  }, [])

  const playOneShot = useCallback((trackId: string, onDone?: () => void) => {
    audio.playOneShot(trackId, onDone)
  }, [])

  const stop = useCallback(() => {
    audio.stop()
  }, [])

  const setVolume = useCallback((v: number) => {
    audio.setVolume(v)
  }, [])

  const setMuted = useCallback((m: boolean) => {
    audio.setMuted(m)
  }, [])

  const getVolume = useCallback(() => audio.getVolume(), [])
  const isMutedFn = useCallback(() => audio.isMuted(), [])

  return { play, playOneShot, stop, setVolume, setMuted, getVolume, isMuted: isMutedFn }
}

/**
 * Reactive track switcher — plays the given trackId whenever it changes.
 * Pass null to stop music.
 */
export function useTrack(trackId: string | null, loop = true): void {
  const prevRef = useRef<string | null>(null)

  useEffect(() => {
    if (trackId === prevRef.current) return
    prevRef.current = trackId

    if (trackId) {
      audio.play(trackId, loop)
    } else {
      audio.stop()
    }
  }, [trackId, loop])
}
