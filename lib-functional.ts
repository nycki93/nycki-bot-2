import { Action, AsyncQueue, Mod } from "./lib";

export function createMod<T>(fn: (modArgs: {
    action: Action;
    setState: (newState: T) => void;
    state: T | undefined;
    write: (text: string) => void;
}) => void) {
    function mod() {
        let state: T | undefined;
        const incoming = new AsyncQueue<Action>();
        const outgoing = new AsyncQueue<Action>();
        let nextAction: Action | undefined;
        
        function send(action: Action) { 
            incoming.push(action);
        }
        
        function emit(action: Action) {
            outgoing.push(action);
        }
        
        async function peek(): Promise<Action> { 
            if (!nextAction) {
                nextAction = await outgoing.shift();
            }
            return nextAction;
        }
        
        function next() { 
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
                fn({ action, state, setState, write });
            }
        }
        
        // intentionally not awaited; we want this to run separately!
        start();

        return { send, peek, next };
    }

    return mod;
}
