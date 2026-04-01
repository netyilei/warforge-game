

import { kdlog } from "kdweb-core/lib/log"
import { Log } from "./log"
import { Rpc } from "./rpc"
console.log("init sub process")

let startArgs = JSON.parse(process.env.child_start)
kdlog.init(process.argv[3],"sub-" + startArgs.idx + "-game-" + startArgs.args[0])

Rpc.initSub(async ()=>{
})

process.on("exit",()=>{
	Log.oth.error("exit")
})
process.on('uncaughtException', (err) => {
	Log.oth.error('Uncaught Exception:', err.message);
	Log.oth.error(err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
	Log.oth.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('multipleResolves', (type, promise, reason) => {
	Log.oth.error('Multiple Resolves:', type, promise, reason);
});