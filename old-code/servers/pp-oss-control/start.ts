
import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Config } from "./config"
import { Rpc } from "./rpc"
import { OSSManager } from "./oss/ossManager"


import { kdreq } from "kdweb-core/lib/service/req"
import { ServerValues } from "../pp-base-define/ServerConfig"
import { Log } from "./log"

Rpc.init()

// async function main() {
// 	let entity = OSSManager.getAdapter(Config.localConfig.defaultOSS)
// 	console.log(await entity.getAllKeys("wicon/"))
// }

// main()

// setTimeout(()=>{},10000)