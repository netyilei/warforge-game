import { ReqUser } from '../../requests/ReqUser'
import { Config } from '../Config'
import { rcData } from './rcData'

const { ccclass, property } = cc._decorator

@ccclass
export default class UserUtils extends cc.Component {
	@property({ type: cc.SpriteFrame })
	defaultIcon: cc.SpriteFrame = null

	public static instance: UserUtils = null

	protected onLoad(): void {
		cc.game.addPersistRootNode(this.node)
		UserUtils.instance = this
	}

	map: Map<
		number,
		{
			userID: number
			nickName: string
			sex: number
			iconUrl: string
		}
	> = new Map()

	userIDs: number[] = []

	async getSpriteFrame(userID: number): Promise<cc.SpriteFrame> {
		let userInfo = await this.load(userID)
		if (!userInfo) return Config.defaultIconSpriteFrame
		if (!userInfo.iconUrl) {
			return Config.defaultIconSpriteFrame
		}
		let spriteFrame: cc.SpriteFrame = await kcore.display.loadWebTexture(
			userInfo.iconUrl
		)
		if (spriteFrame) {
			return spriteFrame
		}
		return Config.defaultIconSpriteFrame
	}

	async load(userID: number) {
		if (this.map.has(userID)) {
			return this.map.get(userID)
		} else {
			if (this.userIDs.findIndex((id) => id == userID) == -1) {
				this.userIDs.push(userID)
			}
			this.unscheduleAllCallbacks()
			this.scheduleOnce(() => {
				this.req(this.userIDs)
				this.userIDs = []
			}, 0.1)
			return await new Promise<{
				userID: number
				nickName: string
				sex: number
				iconUrl: string
			}>((resolve, reject) => {
				rcData.listen(
					`userInfo/${userID}`,
					this.node,
					(userInfo: {
						userID: number
						nickName: string
						sex: number
						iconUrl: string
					}) => {
						if (userInfo) {
							resolve(userInfo)
						} else {
							reject()
						}
					}
				)
			})
		}
	}

	async req(userIDs: number[]) {
		let res = await ReqUser.getUserBaseInfos({ userIDs })
		if (res.errCode) {
			return
		}
		if (!res.data) return
		res.data.forEach(
			(userInfo: {
				userID: number
				nickName: string
				sex: number
				iconUrl: string
			}) => {
				if (!this.map.has(userInfo.userID)) {
					this.map.set(userInfo.userID, userInfo)
					rcData.set(`userInfo/${userInfo.userID}`, userInfo)
				}
			}
		)
	}
}
