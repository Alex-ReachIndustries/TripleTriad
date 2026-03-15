/**
 * Minimal type declarations for @capacitor-community/bluetooth-le
 * Only used on Android via dynamic import — not available in web builds.
 */

declare module '@capacitor-community/bluetooth-le' {
  export interface BleDevice {
    deviceId: string
    name?: string
  }

  export interface ScanResult {
    device: BleDevice
    localName?: string
    rssi?: number
  }

  export const BleClient: {
    initialize(): Promise<void>
    isEnabled(): Promise<boolean>
    requestLEScan(
      options: { services?: string[] },
      callback: (result: ScanResult) => void,
    ): Promise<void>
    stopLEScan(): Promise<void>
    connect(deviceId: string, onDisconnect?: () => void): Promise<void>
    disconnect(deviceId: string): Promise<void>
    startNotifications(
      deviceId: string,
      service: string,
      characteristic: string,
      callback: (data: DataView) => void,
    ): Promise<void>
    write(
      deviceId: string,
      service: string,
      characteristic: string,
      data: Uint8Array,
    ): Promise<void>
  }
}
