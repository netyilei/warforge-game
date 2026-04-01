


const {ccclass, property, executeInEditMode, menu} = cc._decorator;

enum FollowSizeType {
	FullSize,
	WidthOnly,
	HeightOnly,
}

enum FollowSizeOffsetType {
	None,
	Record,
	Fixed,
}

@ccclass
@executeInEditMode
@menu("kcore/FollowSize")
export default class FollowSize extends cc.Component {
	@property(cc.Node)
	nodeTarget:cc.Node = null
	@property({type:cc.Enum(FollowSizeType)})
	followType:FollowSizeType = FollowSizeType.FullSize
	@property({type:cc.Enum(FollowSizeOffsetType)})
	offsetType:FollowSizeOffsetType = FollowSizeOffsetType.None
	@property()
	fixedOffset = cc.size(0,0)


	private offset_:cc.Size
	protected onLoad(): void {
		switch(this.offsetType) {
			case FollowSizeOffsetType.None: {
				this.offset_ = cc.size(0,0)
			} break;
			case FollowSizeOffsetType.Fixed: {
				this.offset_ = this.fixedOffset
			} break;
		}
		this.updateSize()
	}

	private selfOriginSize_:cc.Size
	protected start(): void {
		this.selfOriginSize_ = this.node.getContentSize()
		switch(this.offsetType) {
			case FollowSizeOffsetType.Record: {
				let targetSize = this.nodeTarget ? this.nodeTarget.getContentSize() : cc.size(0,0)
				let thisSize = this.node.getContentSize()
				this.offset_ = cc.size(thisSize.width - targetSize.width, thisSize.height - targetSize.height)
			} break;
		}
		this.updateSize()
	}

	recalcOffset() {
		switch(this.offsetType) {
			case FollowSizeOffsetType.None: {
				this.offset_ = cc.size(0,0)
			} break;
			case FollowSizeOffsetType.Fixed: {
				this.offset_ = this.fixedOffset
			} break;
			case FollowSizeOffsetType.Record: {
				let targetSize = this.nodeTarget ? this.nodeTarget.getContentSize() : cc.size(0,0)
				let thisSize = this.node.getContentSize()
				this.offset_ = cc.size(thisSize.width - targetSize.width, thisSize.height - targetSize.height)
			} break;
		}
	}

	updateSize() {
		if(!this.nodeTarget) {
			return 
		}
		if(!this.offset_) {
			return
		}
		let targetSize = this.nodeTarget.getContentSize()
		targetSize.width += this.offset_.width
		targetSize.height += this.offset_.height
		switch(this.followType) {
			case FollowSizeType.FullSize: {
				this.node.setContentSize(targetSize)
			} break;
			case FollowSizeType.WidthOnly: {
				this.node.width = targetSize.width
			} break;
			case FollowSizeType.HeightOnly: {
				this.node.height = targetSize.height
			} break;
		}
	}

	private prevNode_:cc.Node
	protected update(dt: number): void {
		if(this.nodeTarget != this.prevNode_) {
			this.prevNode_ = this.nodeTarget
			if(this.nodeTarget) {
				this.recalcOffset()
			}
		}
		this.updateSize()
	}
}