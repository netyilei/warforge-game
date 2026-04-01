

import { kdlog } from "kdweb-core/lib/log"
import { Log } from "./log"
import { Rpc } from "./rpc"
console.log("init sub process")

let startArgs = JSON.parse(process.env.child_start)
kdlog.init(process.argv[3],"sub-" + startArgs.args[0])

Rpc.initSub(async ()=>{
})

process.on("exit",()=>{
	console.log("exit")
})