import { type KeyStoreNative } from "./native";
import type { SecureStore } from "./types";
export declare class NativeSecureStore implements SecureStore {
    private readonly native;
    constructor(native?: KeyStoreNative);
    get(key: string, opts?: {
        prompt?: string;
    }): Promise<string | null>;
    set(key: string, value: string, opts?: {
        requireBiometric?: boolean;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    biometricAvailable(): Promise<boolean>;
}
