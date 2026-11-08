// Shared interfaces: docs/field-mobile-libraries-spec.md §2 (copied exactly; field-js carries the same text).
export const FIELD_ERROR_CODES = [
    "KEY_INVALIDATED",
    "BIOMETRIC_UNAVAILABLE",
    "BIOMETRIC_CANCELLED",
    "NO_SECURE_LOCK_SCREEN",
    "INTERNAL",
];
/** Error thrown by providers and stores; `code` is one of FieldErrorCode. */
export class FieldError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "FieldError";
        this.code = code;
    }
}
