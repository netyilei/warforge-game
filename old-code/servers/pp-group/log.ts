import { kdlog } from "kdweb-core/lib/log";
import { ServerValues } from "../pp-base-define/ServerConfig";


export namespace Log {
	export let oth = kdlog.getLogger("oth")
	if(!ServerValues.logInstance) {
		oth = <any>{
			info:()=>null,
			debug:()=>null,
			error:()=>null,
			warn:()=>null,
		}
	}
}