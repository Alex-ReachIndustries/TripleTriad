/**
 * Transport factory: creates WebSocket or BLE transport based on platform/user choice.
 */

import type { ITransport } from '../types/multiplayer'
import { WebSocketTransport } from './WebSocketTransport'

export type TransportMode = 'websocket' | 'ble'

export function isNativePlatform(): boolean {
  try {
    // Capacitor injects this global
    return !!(window as any).Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

export async function isBleAvailable(): Promise<boolean> {
  // Native Capacitor BLE (Android)
  if (isNativePlatform()) {
    try {
      const { BleTransport } = await import('./BleTransport')
      return BleTransport.isAvailable()
    } catch {
      return false
    }
  }
  // Web Bluetooth (Chrome desktop — central/client only)
  try {
    const { WebBleTransport } = await import('./WebBleTransport')
    return WebBleTransport.isAvailable()
  } catch {
    return false
  }
}

export async function createTransport(mode: TransportMode): Promise<ITransport> {
  if (mode === 'ble') {
    if (isNativePlatform()) {
      const { BleTransport } = await import('./BleTransport')
      return new BleTransport()
    }
    // Web Bluetooth for desktop browsers
    const { WebBleTransport } = await import('./WebBleTransport')
    return new WebBleTransport()
  }
  return new WebSocketTransport()
}

export { WebSocketTransport } from './WebSocketTransport'
