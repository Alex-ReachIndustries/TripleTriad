/**
 * TypeScript bridge for the custom BleServer Capacitor plugin.
 * The native Java implementation lives at:
 *   android/app/src/main/java/com/tripletriad/app/BleServerPlugin.java
 */

import { registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

export interface BleCharacteristicDef {
  uuid: string
  properties: {
    read?: boolean
    write?: boolean
    writeWithoutResponse?: boolean
    notify?: boolean
  }
}

export interface BleServiceDef {
  uuid: string
  characteristics: BleCharacteristicDef[]
}

export interface BleAdvertiseOptions {
  services: string[]
  localName?: string
}

export interface CharacteristicWriteEvent {
  deviceId: string
  characteristic: string
  /** Base64-encoded value */
  value: string
}

export interface DeviceEvent {
  deviceId: string
}

export interface BleServerPlugin {
  initialize(): Promise<void>
  addService(service: BleServiceDef): Promise<void>
  startAdvertising(options: BleAdvertiseOptions): Promise<void>
  stopAdvertising(): Promise<void>
  notifyCharacteristic(options: { value: string }): Promise<void>
  closeServer(): Promise<void>

  addListener(
    event: 'characteristicWriteRequest',
    handler: (data: CharacteristicWriteEvent) => void,
  ): Promise<PluginListenerHandle>

  addListener(
    event: 'deviceConnected',
    handler: (data: DeviceEvent) => void,
  ): Promise<PluginListenerHandle>

  addListener(
    event: 'deviceDisconnected',
    handler: (data: DeviceEvent) => void,
  ): Promise<PluginListenerHandle>

  addListener(
    event: 'subscribed',
    handler: (data: DeviceEvent) => void,
  ): Promise<PluginListenerHandle>

  addListener(
    event: 'unsubscribed',
    handler: (data: DeviceEvent) => void,
  ): Promise<PluginListenerHandle>
}

export const BleServer = registerPlugin<BleServerPlugin>('BleServer')
