

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { IDUtils } from "../src/IDUtils"
import { LeaderHelper } from "../src/LeaderHelper"
import { EmailService } from "./entity/EmailService"
import { RpcEmail } from "./rpc/email"

Rpc.init()

IDUtils.checkOrInit()
LeaderHelper.initTagDB()
