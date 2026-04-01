
import { kdutils } from "kdweb-core/lib/utils"
import { kdasync } from "kdweb-core/lib/tools/async"

export let RpcStatusGroup = {
	getTime:async function() {
		return kdutils.getMillionSecond()
	}
}