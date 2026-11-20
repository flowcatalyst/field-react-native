import type { TurboModule } from "react-native";
export interface Spec extends TurboModule {
    /** FieldConfig as JSON-ish: platformUrl, appCode, clientIdentifier?, requireUnlock?, expiryWarningsMs?, keepAliveLeadMs?, allowedPlatformOrigins?. */
    configure(config: Object): Promise<void>;
    /** { state: "SignedOut" | "SignedIn" | "Locked", session: Session | null, device: DeviceRecord | null } */
    restore(): Promise<Object>;
    getState(): Promise<Object>;
    enrol(qrOrCode: string, info: Object): Promise<Object>;
    login(creds: Object): Promise<Object>;
    redeemSignInCode(code: string): Promise<Object>;
    actAs(target: Object): Promise<Object>;
    /** { session: Session | null } */
    endImpersonation(): Promise<Object>;
    changePin(currentPin: string, newPin: string): Promise<void>;
    /**
     * The signed-in worker's own photo. `size` is "thumb" or "full"; `haveVersion` the version already held, or null.
     * Resolves { photo: null } when there is none, else { photo: { bytes: base64url | null, contentType, version, notModified } }
     * (bytes is null when notModified). Binary crosses as base64url, as for `sign`.
     */
    getPhoto(size: string, haveVersion: string | null): Promise<Object>;
    /** Sets the worker's own photo from base64url bytes (contentType null = unknown); resolves the Session. */
    setPhoto(bytesB64u: string, contentType: string | null): Promise<Object>;
    /** Removes the worker's own photo; resolves the Session. */
    removePhoto(): Promise<Object>;
    logout(scope: string): Promise<void>;
    unlock(prompt: string): Promise<Object>;
    refresh(): Promise<Object>;
    /** { Authorization, DPoP } */
    headersFor(method: string, url: string): Promise<Object>;
    headersForRetry(method: string, url: string, nonce: string): Promise<Object>;
    noteNonce(url: string, nonce: string): void;
    keepAlive(on: boolean): void;
    addListener(eventName: string): void;
    removeListeners(count: number): void;
    getOrCreateDeviceKey(): Promise<Object>;
    /** dataB64u -> base64url(raw r||s) */
    sign(dataB64u: string): Promise<string>;
    deleteDeviceKey(): Promise<void>;
    storeGet(key: string, prompt: string | null): Promise<string | null>;
    storeSet(key: string, value: string, requireBiometric: boolean): Promise<void>;
    storeDelete(key: string): Promise<void>;
    biometricAvailable(): Promise<boolean>;
}
declare const _default: Spec | null;
export default _default;
