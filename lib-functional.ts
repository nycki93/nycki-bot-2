import { Action, AsyncQueue, Mod } from "./lib";

type ModArgs = {
    action: Action;
    write: (text: string) => void;
}

export function createMod<T>(initialState: T, fn: (args: ModArgs) => void) {
    function mod() {
        let state = initialState;
        const incoming = new AsyncQueue<Action>();
        const outgoing = new AsyncQueue<Action>();
        let nextAction: Action | undefined;
        
        function _send(action: Action) { 
            incoming.push(action);
        }
        
        function emit(action: Action) {
            outgoing.push(action);
        }
        
        async function _peek(): Promise<Action> { 
            if (!nextAction) {
                nextAction = await outgoing.shift();
            }
            return nextAction;
        }
        
        function _next() { 
            nextAction = undefined;
        }
        
        function write(text: string) {
            emit({ type: Action.WRITE, text });
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
