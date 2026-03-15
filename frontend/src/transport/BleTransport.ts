/**
 * Bluetooth LE transport for local multiplayer on Android.
 * Uses @capacitor-community/bluetooth-le for BLE communication.
 *
 * Host (peripheral): advertises lobby, accepts connections, relays messages.
 * Client (central): scans for hosts, connects, sends/receives lobby messages.
 *
 * Messages are JSON-serialized and chunked if > 512 bytes.
 */

import type { ITransport, ClientMessage, ServerMessage } from '../types/multiplayer'

// BLE Service/Characteristic UUIDs
export const BLE_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb'
export const BLE_LOBBY_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb'

const MAX_CHUNK_SIZE = 512

// ─── Chunk protocol ───

function chunkMessage(data: string): Uint8Array[] {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)

  if (bytes.length <= MAX_CHUNK_SIZE - 2) {
    // Single chunk: [0, 1, ...payload]
    const chunk = new Uint8Array(bytes.length + 2)
    chunk[0] = 0  // chunk index
    chunk[1] = 1  // total chunks
    chunk.set(bytes, 2)
    return [chunk]
  }

  const payloadPerChunk = MAX_CHUNK_SIZE - 2
  const totalChunks = Math.ceil(bytes.length / payloadPerChunk)
  const chunks: Uint8Array[] = []

  for (let i = 0; i < totalChunks; i++) {
    const start = i * payloadPerChunk
    const end = Math.min(start + payloadPerChunk, bytes.length)
    const payload = bytes.slice(start, end)
    const chunk = new Uint8Array(payload.length + 2)
    chunk[0] = i
    chunk[1] = totalChunks
    chunk.set(payload, 2)
    chunks.push(chunk)
  }

  return chunks
}

function reassembleChunks(chunks: Map<number, Uint8Array>, total: number): string | null {
  if (chunks.size !== total) return null
  const decoder = new TextDecoder()
  let result = ''
  for (let i = 0; i < total; i++) {
    const chunk = chunks.get(i)
    if (!chunk) return null
    result += decoder.decode(chunk)
  }
  return result
}

// ─── BLE Transport (Central / Client role) ───

export class BleTransport implements ITransport {
  private deviceId: string | null = null
  private messageHandler: ((msg: ServerMessage) => void) | null = null
  private disconnectHandler: (() => void) | null = null
  private _connected = false
  private pendingChunks = new Map<number, Uint8Array>()
  private expectedTotal = 0
  private bleModule: any = null

  get connected(): boolean {
    return this._connected
  }

  get type(): 'ble' {
    return 'ble'
  }

  private async getBle() {
    if (!this.bleModule) {
      const mod = await import('@capacitor-community/bluetooth-le')
      this.bleModule = mod.BleClient
      await this.bleModule.initialize()
    }
    return this.bleModule
  }

  async connect(deviceId: string): Promise<void> {
    const ble = await this.getBle()
    this.deviceId = deviceId

    await ble.connect(deviceId, () => {
      this._connected = false
      this.disconnectHandler?.()
    })

    this._connected = true

    // Subscribe to lobby characteristic notifications
    await ble.startNotifications(
      deviceId,
      BLE_SERVICE_UUID,
      BLE_LOBBY_CHAR_UUID,
      (data: DataView) => {
        this.handleIncomingData(data)
      },
    )
  }

  disconnect(): void {
    if (this.deviceId && this.bleModule) {
      this.bleModule.disconnect(this.deviceId).catch(() => {})
    }
    this._connected = false
    this.deviceId = null
  }

  send(msg: ClientMessage): void {
    if (!this._connected || !this.deviceId || !this.bleModule) return
    const json = JSON.stringify(msg)
    const chunks = chunkMessage(json)

    // Write chunks sequentially
    const writeNext = async (i: number) => {
      if (i >= chunks.length) return
      await this.bleModule.write(
        this.deviceId,
        BLE_SERVICE_UUID,
        BLE_LOBBY_CHAR_UUID,
        chunks[i],
      )
      await writeNext(i + 1)
    }
    writeNext(0).catch(() => {})
  }

  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandler = handler
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandler = handler
  }

  private handleIncomingData(data: DataView): void {
    const bytes = new Uint8Array(data.buffer)
    if (bytes.length < 2) return

    const chunkIndex = bytes[0]
    const totalChunks = bytes[1]
    const payload = bytes.slice(2)

    if (totalChunks === 1) {
      // Single chunk message
      const decoder = new TextDecoder()
      const json = decoder.decode(payload)
      try {
        const msg = JSON.parse(json) as ServerMessage
        this.messageHandler?.(msg)
      } catch { /* ignore */ }
      return
    }

    // Multi-chunk: accumulate
    this.expectedTotal = totalChunks
    this.pendingChunks.set(chunkIndex, payload)

    const result = reassembleChunks(this.pendingChunks, this.expectedTotal)
    if (result) {
      this.pendingChunks.clear()
      try {
        const msg = JSON.parse(result) as ServerMessage
        this.messageHandler?.(msg)
      } catch { /* ignore */ }
    }
  }

  // ─── Static scan methods ───

  static async isAvailable(): Promise<boolean> {
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le')
      await BleClient.initialize()
      const enabled = await BleClient.isEnabled()
      return enabled
    } catch {
      return false
    }
  }

  static async scanForLobbies(
    onFound: (device: { id: string; name: string }) => void,
    durationMs = 5000,
  ): Promise<void> {
    const { BleClient } = await import('@capacitor-community/bluetooth-le')
    await BleClient.initialize()

    await BleClient.requestLEScan(
      { services: [BLE_SERVICE_UUID] },
      (result) => {
        if (result.device.name) {
          onFound({ id: result.device.deviceId, name: result.device.name })
        }
      },
    )

    // Stop scan after duration
    setTimeout(async () => {
      await BleClient.stopLEScan()
    }, durationMs)
  }
}
