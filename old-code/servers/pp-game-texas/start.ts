

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { GameServerBase } from "../pp-game-base/gameServerBase"
import { TexasRoom } from "./TexasRoom"

GameServerBase.roomClazz = TexasRoom

new GameServerBase()