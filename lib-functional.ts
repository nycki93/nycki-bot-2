import { Action, Mod } from "./lib";

type FnArgs = {
    action: Action;
    write: (text: string) => void;
};

type FnResult = (
    void
    | Action
    | Action[]
    | Promise<void | Action | Action[]>
);

export function createMod(fn: (args: FnArgs) => FnResult): () => Mod {
    function mod() {
        const incoming: Action[] = [];
        const outgoing: Action[] = [];
        let resolveIncoming: ((action: Action) => void) | undefined;
        let resolveOutgoing: ((action: Action) => void) | undefined;
        
        function send(action: Action) { 
            if (resolveIncoming) {
                resolveIncoming(action);
                resolveIncoming = undefined;
                return;
            }
            incoming.push(action);
        };
        
        async function receive() {
            if (incoming.length) {
                return incoming.shift()!;
            }
            return new Promise<Action>(r => resolveIncoming = r);
        }
        
        function emit(action: Action) {
            if (resolveOutgoing) {
                resolveOutgoing(action);
                resolveOutgoing = undefined;
                return;
            }
            outgoing.push(action);
        }
        
        async function peek(): Promise<Action> { 
            if (outgoing.length) return (outgoing[outgoing.length - 1]);
            const next = await new Promise<Action>(r => resolveOutgoing = r);
            outgoing.push(next);
            return next;
        };
        
        function next() { 
            outgoing.shift();
        };
        
        function write(text: string) {
            emit({ type: Action.WRITE, text });
        }
        
        async function start() {
            while(true) {
                const action = await receive();
                await fn({ action, write });
            }
        }
        
        // intentionally not awaited; we want this to run separately!
        start();

        return { send, peek, next };
    }
    
    return mod;
}
