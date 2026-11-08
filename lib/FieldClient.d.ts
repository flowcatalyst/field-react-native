import { type FcFieldNative } from "./native";
export type DeviceMode = "PERSONAL" | "SHARED" | "UNENROLLED";
export interface Actor {
    id: string;
    type: "field_worker" | "principal" | (string & {});
    name: string;
}
/** All times are ms since the epoch on the device clock. */
export interface Session {
    worker: {
        id: string;
        workerCode: string;
        name: string;
    };
    actor: Actor | null;
    test: boolean;
    deviceMode: DeviceMode;
    deviceId: string | null;
    appCode: string;
    expiresAt: number;
    idleExpiresAt: number;
    refreshExpiresAt: number;
    pinChangeRequired: boolean;
}
export interface DeviceRecord {
    deviceId: string;
    mode: "PERSONAL" | "SHARED";
    clientId: string;
    appCodes: string[];
    platformUrl: string;
}
export interface DeviceInfo {
    platform?: string;
    model?: string;
}
export interface EnrolOptions {
    label?: string;
    deviceInfo?: DeviceInfo;
}
export type LoginCredentials = {
    workerCode: string;
    pin: string;
    badgeToken?: never;
    clientIdentifier?: string;
} | {
    badgeToken: string;
    pin?: string;
    workerCode?: never;
    clientIdentifier?: string;
};
export type ActAsTarget = {
    workerCode: string;
    workerId?: never;
    pin: string;
} | {
    workerId: string;
    workerCode?: never;
    pin: string;
};
export interface UnlockPolicy {
    /** Lock a restored session after a process start. */
    afterColdStart?: boolean;
    /** Lock after the app has been in the background this many ms. */
    afterBackgroundMs?: number;
}
export interface FieldClientConfig {
    platformUrl: string;
    appCode: string;
    clientIdentifier?: string;
    requireUnlock?: UnlockPolicy;
    /** Default [30 min, 10 min]. */
    expiryWarningsMs?: number[];
    /** keepAlive refreshes this long before the idle deadline. Default 2 min. */
    keepAliveLeadMs?: number;
}
export type FieldState = "SignedOut" | "SignedIn" | "Locked";
export interface RestoreResult {
    state: FieldState;
    session: Session | null;
    device: DeviceRecord | null;
}
export interface FieldEvents {
    /** `session` is null on sign-out. */
    SessionChanged: {
        session: Session | null;
    };
    /** `reason`: "logout", "invalid_token" or a platform code (INVALID_GRANT, SESSION_EXPIRED, DEVICE_REVOKED, ...). */
    SessionEnded: {
        reason: string;
    };
    PinChangeRequired: {
        session: Session;
    };
    ExpiryWarning: {
        remainingMs: number;
    };
    Locked: {
        session: Session;
    };
    /** `retryAfterSeconds` is absent for a hard lock. */
    WorkerLocked: {
        hard: boolean;
        retryAfterSeconds?: number;
    };
}
export type FieldEventName = keyof FieldEvents;
export declare const FIELD_EVENT_NAMES: readonly FieldEventName[];
/**
 * Every failure of a session method. `code` is the field-js code: a platform code (INVALID_CREDENTIALS,
 * INVALID_GRANT, SESSION_EXPIRED, DEVICE_REVOKED, ...), a lower-case DPoP code (invalid_token, use_dpop_nonce),
 * a key/biometric code (KEY_INVALIDATED, BIOMETRIC_UNAVAILABLE, BIOMETRIC_CANCELLED, ...), or the library's own
 * (NETWORK, NOT_ENROLLED, IMPERSONATING, NOT_CONFIGURED, NOT_SUPPORTED_ON_IOS_YET, INTERNAL). Never carries a PIN.
 */
export declare class FieldAuthError extends Error {
    readonly code: string;
    readonly status?: number;
    readonly retryAfterSeconds?: number;
    readonly violations: string[];
    constructor(code: string, message?: string, extra?: {
        status?: number;
        retryAfterSeconds?: number;
        violations?: string[];
    });
}
/** Native rejection -> FieldAuthError. The native `code` passes through; anything without one is INTERNAL. */
export declare function mapNativeError(e: unknown): FieldAuthError;
export interface NativeEventSource {
    addListener(eventName: string, listener: (payload: unknown) => void): {
        remove(): void;
    };
}
export interface FieldClientOptions {
    /** Defaults to the linked TurboModule. */
    native?: FcFieldNative;
    /** Defaults to `new NativeEventEmitter(native)`. */
    events?: NativeEventSource;
    /** Defaults to react-native's Platform.OS. */
    platform?: string;
    /** Defaults to globalThis.fetch. */
    fetch?: (url: string, init?: RequestInit) => Promise<Response>;
}
export type FieldHeaders = {
    Authorization: string;
    DPoP: string;
} & Record<string, string>;
export declare class FieldClient {
    private readonly config;
    private readonly opts;
    private configured;
    private current;
    private currentState;
    private readonly listeners;
    private subscriptions;
    constructor(config: FieldClientConfig, opts?: FieldClientOptions);
    /** The last session this client saw (null when signed out or before [restore]). */
    get session(): Session | null;
    get state(): FieldState;
    /** Loads the stored device and session; also configures the native owner on first use. */
    restore(): Promise<RestoreResult>;
    enrol(codeOrQr: string, opts?: EnrolOptions): Promise<DeviceRecord>;
    login(creds: LoginCredentials): Promise<Session>;
    redeemSignInCode(code: string): Promise<Session>;
    actAs(target: ActAsTarget): Promise<Session>;
    endImpersonation(): Promise<Session | null>;
    /** Changes the PIN, then refreshes (which drops a pinChangeRequired token). */
    changePin(pins: {
        currentPin: string;
        newPin: string;
    }): Promise<Session>;
    logout(opts?: {
        scope?: "session" | "device-all";
    }): Promise<void>;
    /** App unlock (biometric / device credential). Only when the state is "Locked". */
    unlock(prompt?: string): Promise<Session>;
    refresh(): Promise<Session>;
    /** Declare the worker busy (a trip / tracking is active): the owner refreshes before the idle deadline. */
    keepAlive(on: boolean): Promise<void>;
    /** Authorization + DPoP for one request; refreshes first if needed. Sign when sending, never ahead of time. */
    headersFor(method: string, url: string): Promise<FieldHeaders>;
    /** Sign again after a `401 use_dpop_nonce` (pass the response's `DPoP-Nonce`). */
    headersForRetry(method: string, url: string, nonce: string): Promise<FieldHeaders>;
    /** Feed back a `DPoP-Nonce` seen on any response for this origin. */
    noteNonce(url: string, nonce: string): Promise<void>;
    /**
     * `fetch` with `Authorization: DPoP` and a proof. Retries once on `401 use_dpop_nonce` with the response's
     * `DPoP-Nonce`, and remembers every `DPoP-Nonce` it sees. Network failures reject with code NETWORK.
     */
    fetch(url: string | URL, init?: RequestInit): Promise<Response>;
    /** Subscribe to a native event. Returns the unsubscribe function. */
    on<E extends FieldEventName>(event: E, cb: (payload: FieldEvents[E]) => void): () => void;
    /** Drops all native subscriptions and listeners. */
    dispose(): void;
    private subscribe;
    private dispatch;
    private native;
    private call;
    private took;
    private track;
}
