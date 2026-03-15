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

export class WebBleTransport implements ITransport {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private messageHandler: ((msg: ServerMessage) => void) | null = null
  private disconnectHandler: (() => void) | null = null
  private _connected = false

  get connected(): boolean {
    return this._connected
  }

  get type(): 'ble' {
    return 'ble'
  }

  /**
   * Connect to a BLE device. For Web Bluetooth, `target` is ignored —
   * the browser shows its own device picker dialog.
   */
  async connect(_target: string): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not available')
    }

    // Request device — browser shows picker filtered to our service UUID
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [BLE_SERVICE_UUID] }],
    })

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

    // Subscribe to notifications from the host
    await this.characteristic.startNotifications()
    this.characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic
      if (target.value) {
        const msg = decodeMessage(target.value.buffer)
        if (msg) {
          this.messageHandler?.(msg)
        }
      }
    })

    this._connected = true
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
