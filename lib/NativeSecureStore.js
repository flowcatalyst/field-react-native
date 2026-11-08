import { getNativeModule, toFieldError } from "./native";
export class NativeSecureStore {
    constructor(native) {
        this.native = native ? () => native : getNativeModule;
    }
    async get(key, opts) {
        try {
            return await this.native().storeGet(key, opts?.prompt ?? null);
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
    async set(key, value, opts) {
        try {
            await this.native().storeSet(key, value, opts?.requireBiometric === true);
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
    async delete(key) {
        try {
            await this.native().storeDelete(key);
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
    async biometricAvailable() {
        try {
            return await this.native().biometricAvailable();
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
}
