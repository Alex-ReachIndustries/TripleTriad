/**
 * Web Bluetooth transport for browser-based BLE client (central role).
 * Uses the navigator.bluetooth API available in Chrome on desktop.
 * Connects to a phone running the BLE GATT server (host) as a central.
 *
 * Limitations:
 * - Browser can only be client (central), never host (peripheral)
 * - navigator.bluetooth.requestDevice() shows a device picker dialog
 * - Requires secure context (HTTPS or localhost)
 */

import type { ITransport, ClientMessage, ServerMessage } from '../types/multiplayer'
import { BLE_SERVICE_UUID, BLE_LOBBY_CHAR_UUID } from './BleTransport'

function encodeMessage(msg: ClientMessage): ArrayBuffer {
  const json = JSON.stringify(msg)
  const encoder = new TextEncoder()
  return encoder.encode(json).buffer
}

function decodeMessage(buffer: ArrayBuffer): ServerMessage | null {
  try {
    const decoder = new TextDecoder()
    const json = decoder.decode(buffer)
    return JSON.parse(json) as ServerMessage
  } catch {
    return null
  }
}

/** Module-level cache for the device picked via user gesture. */
let _cachedDevice: BluetoothDevice | null = null

export class WebBleTransport implements ITransport {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private messageHandler: ((msg: ServerMessage) => void) | null = null
  private disconnectHandler: (() => void) | null = null
  private _connected = false
  // Chunk reassembly state
  private pendingChunks = new Map<number, Uint8Array>()
  private expectedTotal = 0

  get connected(): boolean {
    return this._connected
  }

  get type(): 'ble' {
    return 'ble'
  }

  /**
   * Request a BLE device via the browser picker. MUST be called directly
   * from a user gesture (click handler) — browsers block requestDevice()
   * outside of user-initiated events. The picked device is cached so
   * connect() can retrieve it later in an async context.
   */
  static async pickDevice(): Promise<BluetoothDevice> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not available')
    }
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [BLE_SERVICE_UUID] }],
    })
    _cachedDevice = device
    return device
  }

  /**
   * Connect to a BLE device. If pickDevice() was called first (from a user
   * gesture), the cached device is used automatically.
   */
  async connect(_target: string): Promise<void> {
    // Use cached device from pickDevice(), window global, or instance setDevice()
    if (!this.device && _cachedDevice) {
      this.device = _cachedDevice
      _cachedDevice = null
    }
    if (!this.device && (window as any).__blePickedDevice) {
      this.device = (window as any).__blePickedDevice
      delete (window as any).__blePickedDevice
    }
    if (!this.device) {
      throw new Error('No device selected. Call WebBleTransport.pickDevice() first from a user gesture.')
    }

    if (!this.device.gatt) {
      throw new Error('GATT not available on device')
    }

    // Listen for disconnection
    this.device.addEventListener('gattserverdisconnected', () => {
      this._connected = false
      this.disconnectHandler?.()
    })

    // Connect to GATT server
    this.server = await this.device.gatt.connect()

    // Get the lobby service and characteristic
    const service = await this.server.getPrimaryService(BLE_SERVICE_UUID)
    this.characteristic = await service.getCharacteristic(BLE_LOBBY_CHAR_UUID)

    // Subscribe to notifications from the host (with chunk reassembly)
    await this.characteristic.startNotifications()
    this.characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic
      if (!target.value || target.value.byteLength < 2) return

      const bytes = new Uint8Array(target.value.buffer)
      const chunkIndex = bytes[0]
      const totalChunks = bytes[1]
      const payload = bytes.slice(2)

      if (totalChunks === 1) {
        // Single chunk — decode directly
        const msg = decodeMessage(payload.buffer)
        if (msg) this.messageHandler?.(msg)
        return
      }

      // Multi-chunk: accumulate and reassemble
      this.expectedTotal = totalChunks
      this.pendingChunks.set(chunkIndex, payload)

      if (this.pendingChunks.size === this.expectedTotal) {
        // All chunks received — reassemble
        const decoder = new TextDecoder()
        let json = ''
        for (let i = 0; i < this.expectedTotal; i++) {
          const chunk = this.pendingChunks.get(i)
          if (!chunk) { this.pendingChunks.clear(); return }
          json += decoder.decode(chunk)
        }
        this.pendingChunks.clear()
        try {
          const msg = JSON.parse(json) as ServerMessage
          this.messageHandler?.(msg)
        } catch { /* ignore */ }
      }
    })

    this._connected = true
  }

  /** Set the pre-picked device before calling connect(). */
  setDevice(device: BluetoothDevice): void {
    this.device = device
  }

  disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this._connected = false
    this.device = null
    this.server = null
    this.characteristic = null
  }

  send(msg: ClientMessage): void {
    if (!this._connected || !this.characteristic) return
    const data = encodeMessage(msg)
    // writeValueWithoutResponse for lower latency
    this.characteristic.writeValueWithoutResponse(data).catch(() => {})
  }

  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandler = handler
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandler = handler
  }

  /**
   * Check if Web Bluetooth is available in this browser.
   */
  static isAvailable(): boolean {
    return typeof navigator !== 'undefined'
      && 'bluetooth' in navigator
      && window.isSecureContext
  }
}
