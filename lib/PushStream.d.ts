import { type DeniedTopic, type PushError, type PushMessage, type PushStreamOptions, type PushStreamState, type ResetDetail, type SubscribedDetail } from "./push-core";
export interface PushStreamEvents {
    subscribed: SubscribedDetail;
    reset: ResetDetail;
    denied: DeniedTopic[];
    error: PushError;
    state: PushStreamState;
}
export type PushStreamEventName = keyof PushStreamEvents;
type Handler = (push: PushMessage) => void;
export declare class PushStream {
    private readonly core;
    private readonly listeners;
    constructor(opts: PushStreamOptions);
    /** The id of the last push delivered (or reset seen); persist it and pass it back after a restart. */
    get lastEventId(): string | undefined;
    get state(): PushStreamState;
    get topics(): readonly string[];
    /** Listens for `subscribed`, `reset` (reload your state), `denied`, `error` or `state`. Returns `{ remove() }`. */
    addListener<E extends PushStreamEventName>(event: E, fn: (payload: PushStreamEvents[E]) => void): {
        remove(): void;
    };
    /** Listens for pushes on a topic or pattern (`*` one segment, final `**` the rest). Returns an unsubscribe function. */
    on(pattern: string, fn: Handler): () => void;
    /** Listens for every push. Returns an unsubscribe function. */
    onAny(fn: Handler): () => void;
    start(): void;
    stop(): void;
    /** Subscribes again with a new topic set; the last id is kept. */
    setTopics(topics: string[]): void;
    private dispatch;
}
export {};
