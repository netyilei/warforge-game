

export namespace MutexDefine {
	export function Bag(userID:number) {
		return "Bag|UserID=" + userID
	}
	export function Srs_UserEnter(userID:number) {
		return "SrsUserEnter|UserID=" + userID
	}
	export function Srs_ImplementRoom(roomID:number) {
		return "RoomCreate|RoomID=" + roomID
	}

	export let ID_Normal = null 
	export let ID_Club = 90
	export let ID_Room = 99
	export let ID_Match = 100
}
