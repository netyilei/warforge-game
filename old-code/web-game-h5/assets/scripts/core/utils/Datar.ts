import { ItemDefine } from '../../ServerDefines/ItemDefine'
import { LoginLobbyDefine } from '../../ServerDefines/LoginLobbyDefine'
import { SrsDCN } from '../../ServerDefines/SrsUserMsg'
import { UserDefine } from '../../ServerDefines/UserDefine'
import { rcData } from './rcData'

export namespace DatarKey {
	export const user_account = 'user/account'

	export const item_datas = 'item/datas'

	export const user_day = 'user/day'

	export const user_info = 'user/info'

	export const user_task = 'user/task'

	export const game_config = 'game/config'

	export const local_data = 'local/data'
}

export namespace Datar {
	export function get<T extends keyof DatarList>(key: T): DatarList[T] {
		let value: any = rcData.get(key)
		return value
	}
	export function set<T extends keyof DatarList>(
		key: T,
		value: DatarList[T]
	): void {
		rcData.set(key, value)
	}
	export function listen<T extends keyof DatarList>(
		key: T,
		node: cc.Node,
		call: (value: DatarList[T]) => void
	): void {
		rcData.listen(key, node, call)
	}
	export function listenget<T extends keyof DatarList>(
		key: T,
		dv: string,
		node: cc.Node,
		call: (value: DatarList[T]) => void
	): void {
		rcData.listenget(key, dv, node, call)
	}
	export function unlisten<T extends keyof DatarList>(
		key: T,
		node: cc.Node
	): void {
		rcData.unlisten(key, node)
	}
	export function unlistenall(node: cc.Node): void {
		rcData.unlistenall(node)
	}
}

export type DatarList = {

	'lobby/clubID': number,

	'hall/clublist/refresh': boolean,

	'listview/refresh': boolean
	'login/data': UserDefine.tLoginData
	"login/leaderTag": string
	'user/items': {
		id: string
		count: string
	}[]
	'local/data': any,

	'config/lottery': LoginLobbyDefine.tLotteryConfig
	'config/checkin': LoginLobbyDefine.tCheckin
	'config/tasks': LoginLobbyDefine.tTask[]


	'layer/item/call': any
}
