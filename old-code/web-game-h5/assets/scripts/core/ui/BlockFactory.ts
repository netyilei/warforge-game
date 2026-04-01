import { Blocker } from "./BlockLayer"


class _Internal_BlockFactory implements kcore.IBlockFactory {
	create(content?:string,node?:cc.Node):kcore.IBlocker {
		return new Blocker(content,node)
	}
}
export const BlockFactory = new _Internal_BlockFactory