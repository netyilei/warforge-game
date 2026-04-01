import { ReqLobby } from '../../requests/ReqLobby'
import { ReqUser } from '../../requests/ReqUser'
import { MatchDefine } from '../../ServerDefines/MatchDefine'
import { SrsDCN, SrsUserMsg } from '../../ServerDefines/SrsUserMsg'
import { DCN } from '../web/DCN'
import { Datar } from './Datar'

const { ccclass, property } = cc._decorator


@ccclass 
export default class BagUtils extends cc.Component {

	private static instance_:BagUtils
	static get instance() {
		return BagUtils.instance_
	}
	protected onLoad() {
		BagUtils.instance_ = this 
	}
	private dcnInited_ = false 
	initDCN() {
		if(this.dcnInited_) {
			return 
		}
		DCN.unlisten(SrsDCN.bagChanged(),this.node)
		DCN.listen(SrsDCN.bagChanged(),this.node,()=>{
			this.onLogined()
		})
		DCN.unlisten(SrsDCN.UserRedDot,this.node)
		DCN.listen(SrsDCN.UserRedDot,this.node,()=>{
			this.onReddot()
		})
		
	}

	async onLogined() {
		this.initDCN()
		this.dcnInited_ = true
		let res = await ReqLobby.getBag({})
		if(res == null || res.errMsg) {
			return false 
		}
		BagUtils.set(res.bag?.items)
		return true 
	}

	async onReddot() {
		let res = await ReqUser.getRedDot({})
		if(res == null || res.errMsg) {
			return false 
		}
		kcore.data.set("mail/reddot",res.data)
	}

	static set(
		items: {
			id: string
			count: string
		}[]
	) {
		Datar.set('user/items', items)
	}

	static getCount(itemID: string) {
		let items = Datar.get('user/items')
		if (!items) items = []
		let item = items.find((item) => item.id == itemID)
		if (item) {
			return item.count
		}
		return "0"
	}

	static checkItem(
		items:
			| {
					id: string
					count: string
			  }
			| {
					id: string
					count: string
			  }[]
	) {
		items = Array.isArray(items) ? items : [items]
		for (let item of items) {
			if (BagUtils.getCount(item.id) < item.count) {
				return false
			}
		}
		return true
	}
}
