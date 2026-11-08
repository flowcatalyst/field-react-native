import { FIELD_ERROR_CODES, FieldError } from "./types";
let override;
/** Test hook / manual wiring. */
export function setNativeModule(m) {
    override = m;
}
export function getNativeModule() {
    if (override)
        return override;
    // Lazy require so this file can be loaded outside React Native (tests, tooling).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require("react-native");
    const m = rn.TurboModuleRegistry.get("FcField");
    if (!m) {
        throw new FieldError("INTERNAL", "FcField native module is not linked (rebuild the app after installing @flowcatalyst/field-react-native)");
    }
    return m;
}
/** Normalise a native rejection into a FieldError. Never includes payloads. */
export function toFieldError(e) {
    if (e instanceof FieldError)
        return e;
    const err = e;
    const code = typeof err?.code === "string" ? err.code : "";
    const known = FIELD_ERROR_CODES.includes(code) ? code : "INTERNAL";
    const message = typeof err?.message === "string" ? err.message : "native error";
    return new FieldError(known, message);
}
