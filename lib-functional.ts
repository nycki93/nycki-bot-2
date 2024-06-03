import { Event } from "./lib/event";
import { AsyncQueue } from "./lib/async-queue";

type ModArgs = {
    action: Event;
    write: (text: string) => void;
}

export function createMod<T>(initialState: T, fn: (args: ModArgs) => void) {
    function mod() {
        let state = initialState;
        const incoming = new AsyncQueue<Event>();
        const outgoing = new AsyncQueue<Event>();
        let nextAction: Event | undefined;
        
        function _send(action: Event) { 
            incoming.push(action);
        }
        
        function emit(action: Event) {
            outgoing.push(action);
        }
        
        async function _peek(): Promise<Event> { 
            if (!nextAction) {
                nextAction = await outgoing.shift();
            }
            return nextAction;
        }
        
        function _next() { 
            nextAction = undefined;
        }
        
        function write(text: string) {
            emit(Event.write('modname', text));
        }

        function setState(newState: T) {
            state = newState;
        }
        
        async function start() {
            while(true) {
                const action = await incoming.shift();
                fn({ action, write });
            }
        }
        
        // intentionally not awaited; we want this to run separately!
        start();

        return { _send, _peek, _next };
    }

    return mod;
}
