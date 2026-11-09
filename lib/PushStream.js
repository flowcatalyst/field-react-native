// PushStream: the push reader (docs/contracts/push.md) for Hermes. Same behaviour and options as field-js's
// PushStream, over the shared push-core.ts; events use addListener (FieldClient style), not EventTarget.
import { PushCore, } from "./push-core";
export class PushStream {
    constructor(opts) {
        this.listeners = new Map();
        this.core = new PushCore(opts, (type, detail) => this.dispatch(type, detail));
    }
    /** The id of the last push delivered (or reset seen); persist it and pass it back after a restart. */
    get lastEventId() {
        return this.core.lastEventId;
    }
    get state() {
        return this.core.state;
    }
    get topics() {
        return this.core.topics;
    }
    /** Listens for `subscribed`, `reset` (reload your state), `denied`, `error` or `state`. Returns `{ remove() }`. */
    addListener(event, fn) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        const entry = fn;
        set.add(entry);
        return {
            remove: () => {
                set.delete(entry);
            },
        };
    }
    /** Listens for pushes on a topic or pattern (`*` one segment, final `**` the rest). Returns an unsubscribe function. */
    on(pattern, fn) {
        return this.core.on(pattern, fn);
    }
    /** Listens for every push. Returns an unsubscribe function. */
    onAny(fn) {
        return this.core.onAny(fn);
    }
    start() {
        this.core.start();
    }
    stop() {
        this.core.stop();
    }
    /** Subscribes again with a new topic set; the last id is kept. */
    setTopics(topics) {
        this.core.setTopics(topics);
    }
    dispatch(type, detail) {
        const set = this.listeners.get(type);
        if (!set)
            return;
        for (const cb of [...set]) {
            try {
                cb(detail);
            }
            catch {
                // a listener must not break delivery to the others
            }
        }
    }
}
