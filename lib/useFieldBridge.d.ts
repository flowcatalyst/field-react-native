import { type BridgeMessageEvent, type InjectTarget } from "./bridge";
export interface UseFieldBridgeOptions {
    allowedOrigins: string[];
    /** The app's own onMessage handler; gets every message that is not a bridge request. */
    onMessage?: (event: BridgeMessageEvent) => void;
}
/**
 * Spread the result on a react-native-webview <WebView>:
 *   <WebView source={{uri}} {...useFieldBridge({allowedOrigins: [origin]})} />
 */
export declare function useFieldBridge(options: UseFieldBridgeOptions): {
    ref: import("react").MutableRefObject<InjectTarget | null>;
    onMessage: (event: BridgeMessageEvent) => void;
    injectedJavaScriptBeforeContentLoaded: string;
};
