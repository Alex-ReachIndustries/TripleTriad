package com.tripletriad.app;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BleServer",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_ADVERTISE }, alias = "advertise"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "connect"),
        @Permission(strings = { Manifest.permission.BLUETOOTH_SCAN }, alias = "scan"),
    }
)
public class BleServerPlugin extends Plugin {

    private static final String TAG = "BleServerPlugin";

    private BluetoothManager bluetoothManager;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothGattServer gattServer;
    private BluetoothLeAdvertiser advertiser;
    private final Set<BluetoothDevice> subscribedDevices = new HashSet<>();
    private BluetoothGattCharacteristic lobbyCharacteristic;

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            Log.d(TAG, "Advertising started successfully");
        }

        @Override
        public void onStartFailure(int errorCode) {
            Log.e(TAG, "Advertising failed: " + errorCode);
        }
    };

    private final BluetoothGattServerCallback gattServerCallback = new BluetoothGattServerCallback() {
        @Override
        public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
            if (newState == BluetoothGatt.STATE_CONNECTED) {
                JSObject data = new JSObject();
                data.put("deviceId", device.getAddress());
                notifyListeners("deviceConnected", data);
            } else if (newState == BluetoothGatt.STATE_DISCONNECTED) {
                subscribedDevices.remove(device);
                JSObject data = new JSObject();
                data.put("deviceId", device.getAddress());
                notifyListeners("deviceDisconnected", data);
            }
        }

        @Override
        public void onCharacteristicWriteRequest(
            BluetoothDevice device, int requestId,
            BluetoothGattCharacteristic characteristic,
            boolean preparedWrite, boolean responseNeeded,
            int offset, byte[] value
        ) {
            if (responseNeeded && gattServer != null) {
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
            }

            JSObject data = new JSObject();
            data.put("deviceId", device.getAddress());
            data.put("characteristic", characteristic.getUuid().toString());
            data.put("value", Base64.encodeToString(value, Base64.NO_WRAP));
            notifyListeners("characteristicWriteRequest", data);
        }

        @Override
        public void onCharacteristicReadRequest(
            BluetoothDevice device, int requestId, int offset,
            BluetoothGattCharacteristic characteristic
        ) {
            if (gattServer != null) {
                byte[] value = characteristic.getValue();
                if (value == null) value = new byte[0];
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
            }
        }

        @Override
        public void onDescriptorWriteRequest(
            BluetoothDevice device, int requestId,
            android.bluetooth.BluetoothGattDescriptor descriptor,
            boolean preparedWrite, boolean responseNeeded,
            int offset, byte[] value
        ) {
            // Client enabling/disabling notifications
            if (responseNeeded && gattServer != null) {
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null);
            }

            // Check if enabling notifications (0x0100) or indications (0x0200)
            if (value != null && value.length >= 2 && (value[0] != 0 || value[1] != 0)) {
                subscribedDevices.add(device);
                JSObject data = new JSObject();
                data.put("deviceId", device.getAddress());
                notifyListeners("subscribed", data);
            } else {
                subscribedDevices.remove(device);
                JSObject data = new JSObject();
                data.put("deviceId", device.getAddress());
                notifyListeners("unsubscribed", data);
            }
        }
    };

    private PluginCall pendingInitCall;

    @PluginMethod
    public void initialize(PluginCall call) {
        // Request runtime permissions first (Android 12+)
        if (!allPermissionsGranted()) {
            pendingInitCall = call;
            requestAllPermissions(call, "onPermissionResult");
            return;
        }
        completeInitialize(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void onPermissionResult(PluginCall call) {
        if (call == null) call = pendingInitCall;
        pendingInitCall = null;

        if (!allPermissionsGranted()) {
            call.reject("Bluetooth permissions were denied");
            return;
        }
        completeInitialize(call);
    }

    private boolean allPermissionsGranted() {
        return getPermissionState("advertise") == com.getcapacitor.PermissionState.GRANTED
            && getPermissionState("connect") == com.getcapacitor.PermissionState.GRANTED
            && getPermissionState("scan") == com.getcapacitor.PermissionState.GRANTED;
    }

    private void completeInitialize(PluginCall call) {
        bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager == null) {
            call.reject("BluetoothManager not available");
            return;
        }
        bluetoothAdapter = bluetoothManager.getAdapter();
        if (bluetoothAdapter == null) {
            call.reject("BluetoothAdapter not available");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void addService(PluginCall call) {
        String serviceUuid = call.getString("uuid");
        if (serviceUuid == null) {
            call.reject("Service UUID is required");
            return;
        }

        if (gattServer == null) {
            try {
                gattServer = bluetoothManager.openGattServer(getContext(), gattServerCallback);
            } catch (SecurityException e) {
                call.reject("Missing BLUETOOTH_CONNECT permission");
                return;
            }
        }

        BluetoothGattService service = new BluetoothGattService(
            UUID.fromString(serviceUuid),
            BluetoothGattService.SERVICE_TYPE_PRIMARY
        );

        // Add characteristics from the call
        com.getcapacitor.JSArray chars = call.getArray("characteristics");
        if (chars != null) {
            for (int i = 0; i < chars.length(); i++) {
                try {
                    JSObject charDef = JSObject.fromJSONObject(chars.getJSONObject(i));
                    String charUuid = charDef.getString("uuid");
                    if (charUuid == null) continue;

                    JSObject props = charDef.getJSObject("properties");
                    int properties = 0;
                    int permissions = 0;

                    if (props != null) {
                        if (Boolean.TRUE.equals(props.getBool("read"))) {
                            properties |= BluetoothGattCharacteristic.PROPERTY_READ;
                            permissions |= BluetoothGattCharacteristic.PERMISSION_READ;
                        }
                        if (Boolean.TRUE.equals(props.getBool("write"))) {
                            properties |= BluetoothGattCharacteristic.PROPERTY_WRITE;
                            permissions |= BluetoothGattCharacteristic.PERMISSION_WRITE;
                        }
                        if (Boolean.TRUE.equals(props.getBool("writeWithoutResponse"))) {
                            properties |= BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE;
                            permissions |= BluetoothGattCharacteristic.PERMISSION_WRITE;
                        }
                        if (Boolean.TRUE.equals(props.getBool("notify"))) {
                            properties |= BluetoothGattCharacteristic.PROPERTY_NOTIFY;
                        }
                    }

                    BluetoothGattCharacteristic characteristic = new BluetoothGattCharacteristic(
                        UUID.fromString(charUuid), properties, permissions
                    );

                    // Add CCCD (Client Characteristic Configuration Descriptor) for notify
                    if ((properties & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0) {
                        android.bluetooth.BluetoothGattDescriptor cccd =
                            new android.bluetooth.BluetoothGattDescriptor(
                                UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"),
                                android.bluetooth.BluetoothGattDescriptor.PERMISSION_READ
                                    | android.bluetooth.BluetoothGattDescriptor.PERMISSION_WRITE
                            );
                        characteristic.addDescriptor(cccd);
                    }

                    service.addCharacteristic(characteristic);
                    lobbyCharacteristic = characteristic;
                } catch (Exception e) {
                    Log.e(TAG, "Error adding characteristic: " + e.getMessage());
                }
            }
        }

        try {
            gattServer.addService(service);
        } catch (SecurityException e) {
            call.reject("Missing BLUETOOTH_CONNECT permission");
            return;
        }

        call.resolve();
    }

    @PluginMethod
    public void startAdvertising(PluginCall call) {
        if (bluetoothAdapter == null) {
            call.reject("Bluetooth not initialized");
            return;
        }

        advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            call.reject("BLE advertising not supported on this device");
            return;
        }

        String serviceUuid = null;
        com.getcapacitor.JSArray services = call.getArray("services");
        if (services != null && services.length() > 0) {
            try {
                serviceUuid = services.getString(0);
            } catch (Exception ignored) {}
        }

        String localName = call.getString("localName");
        if (localName != null) {
            try {
                bluetoothAdapter.setName(localName);
            } catch (SecurityException ignored) {}
        }

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setConnectable(true)
            .setTimeout(0)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .build();

        AdvertiseData.Builder dataBuilder = new AdvertiseData.Builder()
            .setIncludeDeviceName(true);

        if (serviceUuid != null) {
            dataBuilder.addServiceUuid(new ParcelUuid(UUID.fromString(serviceUuid)));
        }

        try {
            advertiser.startAdvertising(settings, dataBuilder.build(), advertiseCallback);
        } catch (SecurityException e) {
            call.reject("Missing BLUETOOTH_ADVERTISE permission");
            return;
        }

        call.resolve();
    }

    @PluginMethod
    public void stopAdvertising(PluginCall call) {
        if (advertiser != null) {
            try {
                advertiser.stopAdvertising(advertiseCallback);
            } catch (SecurityException ignored) {}
        }
        call.resolve();
    }

    @PluginMethod
    public void notifyCharacteristic(PluginCall call) {
        String valueBase64 = call.getString("value");
        if (valueBase64 == null || gattServer == null || lobbyCharacteristic == null) {
            call.reject("Not ready or missing value");
            return;
        }

        byte[] value = Base64.decode(valueBase64, Base64.NO_WRAP);
        lobbyCharacteristic.setValue(value);

        for (BluetoothDevice device : subscribedDevices) {
            try {
                gattServer.notifyCharacteristicChanged(device, lobbyCharacteristic, false);
            } catch (SecurityException e) {
                Log.e(TAG, "Notify failed for " + device.getAddress() + ": " + e.getMessage());
            }
        }

        call.resolve();
    }

    @PluginMethod
    public void closeServer(PluginCall call) {
        if (advertiser != null) {
            try {
                advertiser.stopAdvertising(advertiseCallback);
            } catch (SecurityException ignored) {}
        }
        if (gattServer != null) {
            try {
                gattServer.close();
            } catch (SecurityException ignored) {}
            gattServer = null;
        }
        subscribedDevices.clear();
        lobbyCharacteristic = null;
        call.resolve();
    }
}
