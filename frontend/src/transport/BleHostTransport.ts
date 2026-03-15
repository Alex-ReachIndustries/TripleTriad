/**
 * BLE Host Transport: Android peripheral role.
 * Advertises a lobby, accepts BLE connections, runs lobby logic locally via LocalLobbyManager.
 * Connected clients send/receive LobbyMessages via BLE characteristic writes/notifications.
 */

import type { ITransport, ClientMessage, ServerMessage, PlayerProfile } from '../types/multiplayer'
import { LocalLobbyManager } from './LocalLobbyManager'
import { BLE_SERVICE_UUID, BLE_LOBBY_CHAR_UUID } from './BleTransport'

function encodeMessage(msg: ServerMessage): DataView {
  const json = JSON.stringify(msg)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(json)
  const buffer = new ArrayBuffer(bytes.length)
  const view = new Uint8Array(buffer)
  view.set(bytes)
  return new DataView(buffer)
}

function decodeMessage(data: DataView): ClientMessage | null {
  try {
    const decoder = new TextDecoder()
    const json = decoder.decode(data.buffer)
    return JSON.parse(json) as ClientMessage
  } catch {
    return null
  }
}

/**
 * BleHostTransport: the host uses this to manage the lobby via BLE.
 * Internally, the host is also a "player" in the lobby — messages from the host
 * go directly to the LocalLobbyManager without BLE.
 */
export class BleHostTransport implements ITransport {
  private lobbyManager: LocalLobbyManager | null = null
  private messageHandler: ((msg: ServerMessage) => void) | null = null
  private disconnectHandler: (() => void) | null = null
  private _connected = false
  private connectedDevices = new Set<string>()
  private hostProfile: PlayerProfile
  private bleServerModule: any = null

  constructor(hostProfile: PlayerProfile) {
    this.hostProfile = hostProfile
  }

  get connected(): boolean {
    return this._connected
  }

  get type(): 'ble' {
    return 'ble'
  }

  async connect(_target: string): Promise<void> {
    const mod = await import('@capacitor-community/bluetooth-le')
    this.bleServerModule = mod.BleServer

    // Initialize BLE server (peripheral) mode
    await this.bleServerModule.initialize()

    // Create the lobby manager
    this.lobbyManager = new LocalLobbyManager(
      this.hostProfile,
      // sendToPlayer: route messages to the right device or back to host
      (playerId: string, msg: ServerMessage) => {
        if (playerId === this.hostProfile.id) {
          // Message to host — deliver directly
          this.messageHandler?.(msg)
        } else {
          // Message to a BLE client — notify via characteristic
          this.notifyClient(msg)
        }
      },
      // broadcastAll: send to all players including host
      (msg: ServerMessage) => {
        this.messageHandler?.(msg)
        this.notifyClient(msg)
      },
    )

    // Add BLE service with lobby characteristic
    await this.bleServerModule.addService({
      uuid: BLE_SERVICE_UUID,
      characteristics: [{
        uuid: BLE_LOBBY_CHAR_UUID,
        properties: {
          read: true,
          write: true,
          writeWithoutResponse: true,
          notify: true,
        },
      }],
    })

    // Handle writes from clients (incoming messages)
    this.bleServerModule.onWrite((event: any) => {
      if (event.characteristic === BLE_LOBBY_CHAR_UUID) {
        const msg = decodeMessage(event.value)
        if (msg && this.lobbyManager) {
          // Determine player ID from the message (join messages include profile)
          const senderId = msg.type === 'join' ? msg.profile.id : this.getPlayerIdForDevice(event.deviceId)
          if (senderId) {
            this.lobbyManager.handleMessage(senderId, msg)
          }
        }
      }
    })

    // Track connected/disconnected devices
    this.bleServerModule.onSubscribed((event: any) => {
      this.connectedDevices.add(event.deviceId)
    })

    this.bleServerModule.onUnsubscribed((event: any) => {
      this.connectedDevices.delete(event.deviceId)
    })

    // Start advertising
    await this.bleServerModule.startAdvertising({
      services: [BLE_SERVICE_UUID],
      localName: this.hostProfile.name.slice(0, 20),
    })

    this._connected = true

    // Auto-join the host as a player
    this.lobbyManager.handleMessage(this.hostProfile.id, {
      type: 'join',
      profile: this.hostProfile,
    })
  }

  disconnect(): void {
    if (this.bleServerModule) {
      this.bleServerModule.stopAdvertising().catch(() => {})
    }
    this._connected = false
    this.lobbyManager = null
    this.disconnectHandler?.()
  }

  send(msg: ClientMessage): void {
    // Host sends messages directly to the local lobby manager
    if (this.lobbyManager) {
      this.lobbyManager.handleMessage(this.hostProfile.id, msg)
    }
  }

  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandler = handler
  }

  onDisconnect(handler: () => void): void {
    this.disconnectHandler = handler
  }

  private async notifyClient(msg: ServerMessage): Promise<void> {
    if (!this.bleServerModule || this.connectedDevices.size === 0) return
    try {
      await this.bleServerModule.notifyCharacteristic({
        service: BLE_SERVICE_UUID,
        characteristic: BLE_LOBBY_CHAR_UUID,
        value: encodeMessage(msg),
      })
    } catch { /* ignore notification failures */ }
  }

  // Map device IDs to player IDs (tracked via join messages)
  private devicePlayerMap = new Map<string, string>()

  private getPlayerIdForDevice(deviceId: string): string | null {
    return this.devicePlayerMap.get(deviceId) || null
  }
}
