

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { Log } from "./log"
import { lambdaAsyncService } from "kdweb-core/lib/service/base"
import { Group_Master } from "./entity/Group_Master"

Rpc.init()
