import Decimal from 'decimal.js';
import { ItemDefine, ItemID } from '../../ServerDefines/ItemDefine';
import { Datar } from './Datar';
import { ReqLobby } from '../../requests/ReqLobby';
import { GSUserMsg } from '../../ServerDefines/GSUserMsg';
import { SrsDCN } from '../../ServerDefines/SrsUserMsg';
import { CsvUtils } from './CsvUtils';
const { ccclass, property } = cc._decorator
@ccclass
export default class ItemUtils extends cc.Component {


	private static needRemoteVersion: boolean = false;
	protected onLoad(): void {
		cc.game.addPersistRootNode(this.node);


		kcore.dcn.listen(SrsDCN.itemConfigChanged(), this.node, (res) => {
			if (!res) return
			ItemUtils.needRemoteVersion = true;
		})
	}

	private static itemConfigs: ItemDefine.tConfig[] = null;
	private static async getItemConfigs() {
		if (!this.itemConfigs || this.needRemoteVersion) {
			let res = await ReqLobby.getItemConfigs({});
			if (res.errCode) {
				kcore.tip.push("提示", res.errMsg || "获取配置信息失败");
				return
			}
			this.needRemoteVersion = false;
			this.setItemConfigs(res.items);
		}
		return this.itemConfigs;

	}

	public static setItemConfigs(content: string) {
		this.itemConfigs = new CsvUtils().convert(content);
	}




	// 静态属性
	private static iconMap: Map<string, cc.Texture2D> = new Map();
	private static itemsBundle: cc.AssetManager.Bundle = null;

	// 检查物品数量是否足够
	public static check(item: { id: string; count: string }): boolean {
		const bag: { id: string; count: string }[] = Datar.get("user/items");
		const find = bag.find((v) => v.id === item.id);

		if (!find) {
			return false;
		}

		const dec = new Decimal(find.count);
		if (dec.lessThan(item.count)) {
			return false;
		}

		return true;
	}


	public static async getItemConfig(itemID: string) {
		let itemConfigs: ItemDefine.tConfig[] = await this.getItemConfigs();
		return itemConfigs.find((v) => v.id == itemID)
	}

	public static getItemConfigSync(itemID: string): ItemDefine.tConfig {
		return this.itemConfigs?.find((v) => v.id == itemID)
	}

	// 获取物品名称
	public static async getName(itemID: string) {
		console.log("getName", itemID);
		let itemConfig = await this.getItemConfig(itemID)
		if (itemConfig) {
			return itemConfig.name
		} else {
			return `未知道具:${itemID}`
		}
	}

	// 获取物品精灵帧
	public static async getSpriteFrame(itemID: string): Promise<cc.SpriteFrame> {
		let t2d: cc.Texture2D;

		if (this.iconMap.has(itemID)) {
			t2d = this.iconMap.get(itemID);
		} else {
			t2d = await this.loadItemIcon(itemID);
			this.iconMap.set(itemID, t2d); // 缓存加载的纹理
		}

		return new cc.SpriteFrame(t2d);
	}

	// 加载物品图标
	private static async loadItemIcon(itemID: string): Promise<cc.Texture2D> {
		const bundleName: string = 'items';
		const t2d: cc.Texture2D = await this.loadItem(`${itemID}`, cc.Texture2D, bundleName);
		return t2d;
	}

	// 加载资源
	private static async loadItem(name: string, type: any, bundleName?: string): Promise<any> {
		bundleName = bundleName || this.getBundleName(name);
		const bundle: cc.AssetManager.Bundle = await this.loadBundle(bundleName);

		return new Promise((resolve, reject) => {
			bundle.load(
				name,
				type,
				(finish: number, total: number, item: cc.AssetManager.RequestItem) => { },
				(err: Error, assets: any) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(assets);
				}
			);
		});
	}

	// 获取资源包名称（原代码中未定义，这里补充一个简单实现）
	private static getBundleName(name: string): string {
		// 根据物品ID逻辑判断应该使用的bundle名称
		// 这里使用默认值'items'作为示例
		return 'items';
	}

	// 加载资源包
	private static async loadBundle(bundleName: string): Promise<cc.AssetManager.Bundle> {
		if (!this.itemsBundle) {
			this.itemsBundle = await new Promise<cc.AssetManager.Bundle>((resolve, reject) => {
				cc.assetManager.loadBundle(
					bundleName,
					(err: Error, bundle: cc.AssetManager.Bundle) => {
						if (err) {
							reject(err);
							return;
						}
						resolve(bundle);
					}
				);
			});
		}
		return this.itemsBundle;
	}
}
