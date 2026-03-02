const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'

export async function createRoom(): Promise<{ roomId: string; code: string }> {
  const res = await fetch(`${API_URL}/room`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json()
}

export async function joinRoom(code: string): Promise<{ roomId: string }> {
  const res = await fetch(`${API_URL}/room/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.toUpperCase() }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Room not found')
  }
  return res.json()
}

export function getWsUrl(roomId: string, player: 0 | 1): string {
  const base = WS_URL.replace(/^http/, 'ws')
  return `${base}/ws?roomId=${encodeURIComponent(roomId)}&player=${player}`
}
