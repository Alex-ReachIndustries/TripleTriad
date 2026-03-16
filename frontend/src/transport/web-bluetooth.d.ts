/**
 * Minimal Web Bluetooth API type declarations.
 * These types are not included in TypeScript's default lib.dom.d.ts.
 */

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  addEventListener(type: 'gattserverdisconnected', listener: () => void): void
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value?: DataView
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  writeValue(value: ArrayBuffer): Promise<void>
  writeValueWithoutResponse(value: ArrayBuffer): Promise<void>
  addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void
}

interface BluetoothRequestDeviceFilter {
  services?: string[]
  name?: string
  namePrefix?: string
}

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[]
  optionalServices?: string[]
  acceptAllDevices?: boolean
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
  getDevices?(): Promise<BluetoothDevice[]>
}

interface Navigator {
  readonly bluetooth: Bluetooth
}
