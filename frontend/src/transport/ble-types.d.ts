/**
 * Type declarations for @capacitor-community/bluetooth-le
 * Covers both Central (client) and Peripheral (server/host) roles.
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

  // Central (client) role
  export const BleClient: {
    initialize(options?: { androidNeverForLocation?: boolean }): Promise<void>
    isEnabled(): Promise<boolean>
    requestDevice(options?: { services?: string[]; optionalServices?: string[] }): Promise<BleDevice>
    requestLEScan(
      options: { services?: string[]; allowDuplicates?: boolean },
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
    stopNotifications(deviceId: string, service: string, characteristic: string): Promise<void>
    write(
      deviceId: string,
      service: string,
      characteristic: string,
      data: DataView,
    ): Promise<void>
    read(deviceId: string, service: string, characteristic: string): Promise<DataView>
  }

  // Peripheral (server/host) role
  export interface BleService {
    uuid: string
    characteristics: BleCharacteristic[]
  }

  export interface BleCharacteristic {
    uuid: string
    properties: {
      read?: boolean
      write?: boolean
      writeWithoutResponse?: boolean
      notify?: boolean
      indicate?: boolean
    }
  }

  export interface ReadRequestEvent {
    deviceId: string
    service: string
    characteristic: string
  }

  export interface WriteRequestEvent {
    deviceId: string
    service: string
    characteristic: string
    value: DataView
  }

  export const BleServer: {
    initialize(): Promise<void>
    addService(service: BleService): Promise<void>
    startAdvertising(options: {
      services: string[]
      localName?: string
    }): Promise<void>
    stopAdvertising(): Promise<void>
    notifyCharacteristic(options: {
      service: string
      characteristic: string
      value: DataView
    }): Promise<void>
    onRead(callback: (event: ReadRequestEvent) => DataView): void
    onWrite(callback: (event: WriteRequestEvent) => void): void
    onSubscribed(callback: (event: { deviceId: string; service: string; characteristic: string }) => void): void
    onUnsubscribed(callback: (event: { deviceId: string; service: string; characteristic: string }) => void): void
  }
}
