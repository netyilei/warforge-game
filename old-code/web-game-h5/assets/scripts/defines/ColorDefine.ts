import { RoomDefine } from '../ServerDefines/RoomDefine'

export namespace ColorDefine {
	/**
	 * 获取成员颜色
	 * @param idx [0 身份文字的颜色,1 昵称的颜色]
	 * @returns
	 */
	export let Normal = function (idx: number = 0) {
		let colors = [new cc.Color(255, 255, 255), new cc.Color(155, 155, 155)]
		return colors[idx]
	}

	export let Admin = function (idx: number = 0) {
		let colors = [new cc.Color(255, 255, 0), new cc.Color(155, 155, 0)]
		return colors[idx]
	}

	export let SuperAdmin = function (idx: number = 0) {
		let colors = [new cc.Color(0, 255, 0), new cc.Color(0, 155, 0)]
		return colors[idx]
	}

	export let Boss = function (idx: number = 0) {
		let colors = [new cc.Color(0, 0, 255), new cc.Color(0, 0, 155)]
		return colors[idx]
	}

	export let RoomStatus = function (status: RoomDefine.RoomStatus) {
		switch (status) {
			case RoomDefine.RoomStatus.None:
				return new cc.Color(255, 255, 255)
			case RoomDefine.RoomStatus.Wait:
				return new cc.Color(0, 0, 255)
			case RoomDefine.RoomStatus.Start:
				return new cc.Color(0, 255, 0)
			case RoomDefine.RoomStatus.End:
				return new cc.Color(255, 0, 0)
			default:
				return new cc.Color(155, 155, 155)
		}
	}

	export let Win = function () {
		return new cc.Color(0, 200, 0)
	}

	export let Lose = function () {
		return new cc.Color(200, 0, 0)
	}

	export let Countdown = function (type: CountdownType) {
		switch (type) {
			case CountdownType.Start:
				return new cc.Color(0, 255, 0, 255)

			case CountdownType.NearFinished:
				return new cc.Color(200, 0, 0, 255)

			case CountdownType.Finished:
				return new cc.Color(155, 155, 155, 255)

			default:
				return new cc.Color(255, 255, 255)
		}
	}
	export enum CountdownType {
		Start,
		NearFinished,
		Finished
	};
}
