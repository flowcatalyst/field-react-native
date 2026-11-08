import { useMemo, useRef } from "react";
import { INJECTED_BEFORE_CONTENT_LOADED, createBridgeHost, } from "./bridge";
import { getNativeModule } from "./native";
/**
 * Spread the result on a react-native-webview <WebView>:
 *   <WebView source={{uri}} {...useFieldBridge({allowedOrigins: [origin]})} />
 */
export function useFieldBridge(options) {
    const ref = useRef(null);
    const optsRef = useRef(options);
    optsRef.current = options;
    const originsKey = options.allowedOrigins.join("\n");
    const host = useMemo(() => createBridgeHost({
        allowedOrigins: originsKey.split("\n").filter((s) => s.length > 0),
        native: getNativeModule,
        getTarget: () => ref.current,
        onMessage: (e) => optsRef.current.onMessage?.(e),
    }), [originsKey]);
    return {
        ref,
        onMessage: host.onMessage,
        injectedJavaScriptBeforeContentLoaded: INJECTED_BEFORE_CONTENT_LOADED,
    };
}
