

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { serviceEntity } from "kdweb-core/lib/service/entity"
import { ProcessActionLooper } from "./entity/ProcessActionLooper"
import { UserActionLooper } from "./entity/UserActionLooper"

Rpc.init()
.then(()=>{
	// new ProcessActionLooper()
	// new UserActionLooper()
})