import { type KeyStoreNative } from "./native";
import type { DeviceKey, KeyProvider } from "./types";
export declare class NativeKeyProvider implements KeyProvider {
    private readonly native;
    constructor(native?: KeyStoreNative);
    getOrCreateDeviceKey(): Promise<DeviceKey>;
    sign(data: Uint8Array): Promise<Uint8Array>;
    deleteDeviceKey(): Promise<void>;
}
