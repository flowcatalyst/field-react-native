import { toBase64Url } from "./base64url";
import { type KeyStoreNative } from "./native";
export interface BridgeMessageEvent {
    nativeEvent: {
        data: string;
        url?: string;
    };
}
export interface InjectTarget {
    injectJavaScript(script: string): void;
}
export interface BridgeHostOptions {
    allowedOrigins: string[];
    native: () => KeyStoreNative;
    getTarget: () => InjectTarget | null | undefined;
    /** The app's own onMessage handler; receives every message that is not a bridge request. */
    onMessage?: (event: BridgeMessageEvent) => void;
    warn?: (msg: string) => void;
}
/** Installed before content loads; makes bridgeAvailable() true on the page. */
export declare const INJECTED_BEFORE_CONTENT_LOADED: string;
export declare function originOf(url: string | undefined): string | null;
/** Escape a JSON string so it is safe inside a JS string literal passed to injectJavaScript. */
export declare function jsStringLiteral(s: string): string;
export interface BridgeHost {
    /** Pass as <WebView onMessage>. */
    onMessage(event: BridgeMessageEvent): void;
    /** Resolves when any in-flight response for this message has been injected (for tests). */
    handle(event: BridgeMessageEvent): Promise<void>;
}
export declare function createBridgeHost(opts: BridgeHostOptions): BridgeHost;
export { toBase64Url };
