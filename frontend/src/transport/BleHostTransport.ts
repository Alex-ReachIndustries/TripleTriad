/**
 * BLE Host Transport: Android peripheral role.
 * Advertises a lobby, accepts BLE connections, runs lobby logic locally via LocalLobbyManager.
 * Connected clients send/receive LobbyMessages via BLE characteristic writes/notifications.
 *
 * Uses the custom BleServer Capacitor plugin (BleServerPlugin.java) for GATT server functionality.
 */

import type { ITransport, ClientMessage, ServerMessage, PlayerProfile } from '../types/multiplayer'
import type { PluginListenerHandle } from '@capacitor/core'
import { LocalLobbyManager } from './LocalLobbyManager'
import { BLE_SERVICE_UUID, BLE_LOBBY_CHAR_UUID } from './BleTransport'
import { BleServer } from './ble-server-plugin'

function encodeToBase64(msg: ServerMessage): string {
  const json = JSON.stringify(msg)
  const encoder = new TextEncoder()
  const bytes = encoder.encode(json)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function decodeFromBase64(b64: string): ClientMessage | null {
  try {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decoder = new TextDecoder()
    const json = decoder.decode(bytes)
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
  private listeners: PluginListenerHandle[] = []

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
    // Initialize BLE server (peripheral) mode
    await BleServer.initialize()

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
    await BleServer.addService({
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
    const writeListener = await BleServer.addListener(
      'characteristicWriteRequest',
      (event) => {
        if (event.characteristic === BLE_LOBBY_CHAR_UUID) {
          const msg = decodeFromBase64(event.value)
          if (msg && this.lobbyManager) {
            // Determine player ID from the message (join messages include profile)
            if (msg.type === 'join') {
              this.devicePlayerMap.set(event.deviceId, msg.profile.id)
            }
            const senderId = msg.type === 'join' ? msg.profile.id : this.getPlayerIdForDevice(event.deviceId)
            if (senderId) {
              this.lobbyManager.handleMessage(senderId, msg)
            }
          }
        }
      },
    )
    this.listeners.push(writeListener)

    // Track subscribed devices
    const subListener = await BleServer.addListener('subscribed', (event) => {
      this.connectedDevices.add(event.deviceId)
    })
    this.listeners.push(subListener)

    const unsubListener = await BleServer.addListener('unsubscribed', (event) => {
      this.connectedDevices.delete(event.deviceId)
    })
    this.listeners.push(unsubListener)

    // Start advertising
    await BleServer.startAdvertising({
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
    BleServer.closeServer().catch(() => {})
    for (const listener of this.listeners) {
      listener.remove()
    }
    this.listeners = []
    this._connected = false
    this.lobbyManager = null
    this.connectedDevices.clear()
    this.devicePlayerMap.clear()
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
    if (this.connectedDevices.size === 0) return
    try {
      await BleServer.notifyCharacteristic({
        value: encodeToBase64(msg),
      })
    } catch { /* ignore notification failures */ }
  }

  // Map device IDs to player IDs (tracked via join messages)
  private devicePlayerMap = new Map<string, string>()

  private getPlayerIdForDevice(deviceId: string): string | null {
    return this.devicePlayerMap.get(deviceId) || null
  }
}
