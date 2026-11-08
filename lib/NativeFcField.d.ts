import type { TurboModule } from "react-native";
export interface Spec extends TurboModule {
    /** FieldConfig as JSON-ish: platformUrl, appCode, clientIdentifier?, requireUnlock?, expiryWarningsMs?, keepAliveLeadMs?. */
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
