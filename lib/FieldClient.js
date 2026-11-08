// FieldClient: the React Native face of the Android FieldSession (field-js FieldAuth method names, Session shape).
// No EventTarget, no DOM, no crypto.subtle: it runs on Hermes and only talks to the native module.
import { getNativeModule } from "./native";
export const FIELD_EVENT_NAMES = [
    "SessionChanged",
    "SessionEnded",
    "PinChangeRequired",
    "ExpiryWarning",
    "Locked",
    "WorkerLocked",
];
// ── errors ───────────────────────────────────────────────────────────────
/**
 * Every failure of a session method. `code` is the field-js code: a platform code (INVALID_CREDENTIALS,
 * INVALID_GRANT, SESSION_EXPIRED, DEVICE_REVOKED, ...), a lower-case DPoP code (invalid_token, use_dpop_nonce),
 * a key/biometric code (KEY_INVALIDATED, BIOMETRIC_UNAVAILABLE, BIOMETRIC_CANCELLED, ...), or the library's own
 * (NETWORK, NOT_ENROLLED, IMPERSONATING, NOT_CONFIGURED, NOT_SUPPORTED_ON_IOS_YET, INTERNAL). Never carries a PIN.
 */
export class FieldAuthError extends Error {
    constructor(code, message, extra = {}) {
        super(message ?? code);
        this.name = "FieldAuthError";
        this.code = code;
        if (extra.status !== undefined)
            this.status = extra.status;
        if (extra.retryAfterSeconds !== undefined)
            this.retryAfterSeconds = extra.retryAfterSeconds;
        this.violations = extra.violations ?? [];
    }
}
/** Native rejection -> FieldAuthError. The native `code` passes through; anything without one is INTERNAL. */
export function mapNativeError(e) {
    if (e instanceof FieldAuthError)
        return e;
    const err = e;
    const code = typeof err?.code === "string" && err.code !== "" ? err.code : "INTERNAL";
    const message = typeof err?.message === "string" ? err.message : "native error";
    const ui = (err?.userInfo ?? {});
    const extra = {};
    if (typeof ui.status === "number")
        extra.status = ui.status;
    if (typeof ui.retryAfterSeconds === "number")
        extra.retryAfterSeconds = ui.retryAfterSeconds;
    if (Array.isArray(ui.violations))
        extra.violations = ui.violations.filter((v) => typeof v === "string");
    return new FieldAuthError(code, message, extra);
}
function defaultPlatform() {
    const rn = require("react-native");
    return rn.Platform.OS;
}
function defaultEvents(native) {
    const rn = require("react-native");
    return new rn.NativeEventEmitter(native);
}
function headersToRecord(h) {
    const out = {};
    if (!h)
        return out;
    if (Array.isArray(h)) {
        for (const [k, v] of h)
            if (k !== undefined && v !== undefined)
                out[k] = v;
    }
    else if (typeof h.forEach === "function") {
        h.forEach((v, k) => {
            out[k] = v;
        });
    }
    else {
        Object.assign(out, h);
    }
    return out;
}
function dropKey(h, name) {
    const lower = name.toLowerCase();
    for (const k of Object.keys(h))
        if (k.toLowerCase() === lower)
            delete h[k];
}
export class FieldClient {
    constructor(config, opts = {}) {
        this.configured = null;
        this.current = null;
        this.currentState = "SignedOut";
        this.listeners = new Map();
        this.subscriptions = [];
        this.config = config;
        this.opts = opts;
    }
    /** The last session this client saw (null when signed out or before [restore]). */
    get session() {
        return this.current;
    }
    get state() {
        return this.currentState;
    }
    // ── lifecycle ────────────────────────────────────────────────────────
    /** Loads the stored device and session; also configures the native owner on first use. */
    async restore() {
        const n = await this.native();
        return this.call(async () => this.track((await n.restore())));
    }
    async enrol(codeOrQr, opts = {}) {
        const n = await this.native();
        const info = { ...opts.deviceInfo };
        if (opts.label !== undefined)
            info["label"] = opts.label;
        return this.call(async () => (await n.enrol(codeOrQr, info)));
    }
    async login(creds) {
        const n = await this.native();
        return this.call(async () => this.took((await n.login({ ...creds }))));
    }
    async redeemSignInCode(code) {
        const n = await this.native();
        return this.call(async () => this.took((await n.redeemSignInCode(code))));
    }
    async actAs(target) {
        const n = await this.native();
        return this.call(async () => this.took((await n.actAs({ ...target }))));
    }
    async endImpersonation() {
        const n = await this.native();
        return this.call(async () => {
            const r = (await n.endImpersonation());
            const s = r.session ?? null;
            this.current = s;
            return s;
        });
    }
    /** Changes the PIN, then refreshes (which drops a pinChangeRequired token). */
    async changePin(pins) {
        const n = await this.native();
        return this.call(async () => {
            await n.changePin(pins.currentPin, pins.newPin);
            return this.took((await n.refresh()));
        });
    }
    async logout(opts = {}) {
        const n = await this.native();
        return this.call(async () => {
            await n.logout(opts.scope ?? "session");
            this.current = null;
            this.currentState = "SignedOut";
        });
    }
    /** App unlock (biometric / device credential). Only when the state is "Locked". */
    async unlock(prompt = "Unlock") {
        const n = await this.native();
        return this.call(async () => {
            const s = this.took((await n.unlock(prompt)));
            this.currentState = "SignedIn";
            return s;
        });
    }
    async refresh() {
        const n = await this.native();
        return this.call(async () => this.took((await n.refresh())));
    }
    /** Declare the worker busy (a trip / tracking is active): the owner refreshes before the idle deadline. */
    async keepAlive(on) {
        const n = await this.native();
        return this.call(async () => n.keepAlive(on));
    }
    // ── proofs for other code ────────────────────────────────────────────
    /** Authorization + DPoP for one request; refreshes first if needed. Sign when sending, never ahead of time. */
    async headersFor(method, url) {
        const n = await this.native();
        return this.call(async () => (await n.headersFor(method.toUpperCase(), url)));
    }
    /** Sign again after a `401 use_dpop_nonce` (pass the response's `DPoP-Nonce`). */
    async headersForRetry(method, url, nonce) {
        const n = await this.native();
        return this.call(async () => (await n.headersForRetry(method.toUpperCase(), url, nonce)));
    }
    /** Feed back a `DPoP-Nonce` seen on any response for this origin. */
    async noteNonce(url, nonce) {
        const n = await this.native();
        return this.call(async () => n.noteNonce(url, nonce));
    }
    /**
     * `fetch` with `Authorization: DPoP` and a proof. Retries once on `401 use_dpop_nonce` with the response's
     * `DPoP-Nonce`, and remembers every `DPoP-Nonce` it sees. Network failures reject with code NETWORK.
     */
    async fetch(url, init = {}) {
        const target = String(url);
        const method = (init.method ?? "GET").toUpperCase();
        const doFetch = this.opts.fetch ?? ((u, i) => globalThis.fetch(u, i));
        const send = async (signed) => {
            const headers = headersToRecord(init.headers);
            dropKey(headers, "Authorization");
            dropKey(headers, "DPoP");
            Object.assign(headers, signed);
            try {
                return await doFetch(target, { ...init, headers });
            }
            catch {
                throw new FieldAuthError("NETWORK", "the request could not be sent");
            }
        };
        let res = await send(await this.headersFor(method, target));
        const nonce = res.headers.get("DPoP-Nonce");
        if (nonce)
            await this.noteNonce(target, nonce);
        if (res.status === 401 && nonce && /use_dpop_nonce/.test(res.headers.get("WWW-Authenticate") ?? "")) {
            res = await send(await this.headersForRetry(method, target, nonce));
            const n2 = res.headers.get("DPoP-Nonce");
            if (n2)
                await this.noteNonce(target, n2);
        }
        return res;
    }
    // ── events ───────────────────────────────────────────────────────────
    /** Subscribe to a native event. Returns the unsubscribe function. */
    on(event, cb) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        const entry = cb;
        set.add(entry);
        // Configures the native owner (and subscribes to its events); failures surface on the next method call.
        this.native().then((n) => this.subscribe(n), () => { });
        return () => {
            set.delete(entry);
        };
    }
    /** Drops all native subscriptions and listeners. */
    dispose() {
        for (const s of this.subscriptions)
            s.remove();
        this.subscriptions = [];
        this.listeners.clear();
    }
    // ── internals ────────────────────────────────────────────────────────
    subscribe(n) {
        if (this.subscriptions.length > 0)
            return;
        const src = this.opts.events ?? defaultEvents(n);
        for (const name of FIELD_EVENT_NAMES) {
            this.subscriptions.push(src.addListener(name, (p) => this.dispatch(name, p)));
        }
    }
    dispatch(name, payload) {
        const p = (payload ?? {});
        if (name === "SessionChanged")
            this.current = p["session"] ?? null;
        if (name === "SessionEnded") {
            this.current = null;
            this.currentState = "SignedOut";
        }
        if (name === "Locked")
            this.currentState = "Locked";
        const set = this.listeners.get(name);
        if (!set)
            return;
        for (const cb of [...set]) {
            try {
                cb(payload);
            }
            catch {
                // a listener must not break delivery to the others
            }
        }
    }
    native() {
        if (!this.configured) {
            this.configured = (async () => {
                const platform = this.opts.platform ?? defaultPlatform();
                if (platform === "ios") {
                    throw new FieldAuthError("NOT_SUPPORTED_ON_IOS_YET", "FieldClient sessions are Android-only for now; the Swift session owner is not built yet");
                }
                const n = this.opts.native ?? getNativeModule();
                await n.configure({ ...this.config });
                this.subscribe(n);
                return n;
            })();
            this.configured.catch(() => {
                this.configured = null; // retry on the next call
            });
        }
        return this.configured.catch((e) => {
            throw mapNativeError(e);
        });
    }
    async call(fn) {
        try {
            return await fn();
        }
        catch (e) {
            throw mapNativeError(e);
        }
    }
    took(s) {
        this.current = s;
        if (this.currentState === "SignedOut")
            this.currentState = "SignedIn";
        return s;
    }
    track(r) {
        this.current = r.session ?? null;
        this.currentState = r.state;
        return r;
    }
}
