import { FieldError } from "./types";
import type { Spec } from "./NativeFcField";
/**
 * The native module surface (the codegen Spec: Android FcFieldModule / iOS FcField). Binary data crosses as
 * base64url strings. Native rejections carry `code`.
 */
export type FcFieldNative = Spec;
/** The key/store subset: what the WebView bridge and the key/store adapters use (also all iOS implements today). */
export type KeyStoreNative = Pick<Spec, "getOrCreateDeviceKey" | "sign" | "deleteDeviceKey" | "storeGet" | "storeSet" | "storeDelete" | "biometricAvailable">;
/** Test hook / manual wiring. */
export declare function setNativeModule(m: FcFieldNative | undefined): void;
export declare function getNativeModule(): FcFieldNative;
/** Normalise a native rejection into a FieldError. Never includes payloads. */
export declare function toFieldError(e: unknown): FieldError;
