import { fromBase64Url, toBase64Url } from "./base64url";
import { getNativeModule, toFieldError } from "./native";
export class NativeKeyProvider {
    constructor(native) {
        this.native = native ? () => native : getNativeModule;
    }
    async getOrCreateDeviceKey() {
        try {
            return (await this.native().getOrCreateDeviceKey());
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
    async sign(data) {
        try {
            return fromBase64Url(await this.native().sign(toBase64Url(data)));
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
    async deleteDeviceKey() {
        try {
            await this.native().deleteDeviceKey();
        }
        catch (e) {
            throw toFieldError(e);
        }
    }
}
