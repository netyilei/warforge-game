


const { ccclass, property, menu } = cc._decorator


@ccclass
export default class ProgressBlock extends cc.Component {
	@property(cc.ProgressBar)
	bar:cc.ProgressBar = null
	@property(cc.Node)
	nodeBlock:cc.Node = null
	@property(cc.Node)
	nodeTouch:cc.Node = null
	@property({tooltip:"是否纵向/横向进度条"})
	verOrHor:boolean = false

	private barSize_:cc.Size 
	private touchSize_:cc.Size
	private worldTouchBox_:cc.Rect
	private touchConfirm_:boolean
	private funcChanged_:Function = null
	get funcChanged() {
		return this.funcChanged_
	}
	set funcChanged(v) {
		this.funcChanged_ = v
	}

	private prevValue_ = 0
	onLoad() {
		this.barSize_ = this.bar.node.getContentSize()
		this.touchSize_ = this.nodeTouch.getContentSize()
		let ap = this.nodeTouch.getAnchorPoint()
		let leftBottom = this.nodeTouch.convertToWorldSpaceAR(cc.v2(-this.touchSize_.width * ap.x,-this.touchSize_.height * ap.y))
		let rightTop = this.nodeTouch.convertToWorldSpaceAR(cc.v2(this.touchSize_.width * (1 - ap.x),this.touchSize_.height * (1 - ap.y)))
		this.worldTouchBox_ = cc.rect(
			leftBottom.x,
			leftBottom.y,
			rightTop.x - leftBottom.x,
			rightTop.y - leftBottom.y,
		)

		let funcTouch = (event:cc.Event.EventTouch)=>{
			if(!this.touchConfirm_) {
				return
			}
			let per = 0
			let loc = event.getLocation()
			if(this.verOrHor) {
				let relativeY = loc.y - this.worldTouchBox_.y
				per = relativeY / this.worldTouchBox_.height
			} else {
				let relativeX = loc.x - this.worldTouchBox_.x
				per = relativeX / this.worldTouchBox_.width
			}
			this.bar.progress = cc.misc.clampf(per,0,1)
		}
		this.nodeTouch.on(cc.Node.EventType.TOUCH_START,(event:cc.Event.EventTouch)=>{
			let loc = this.nodeTouch.parent.convertToNodeSpaceAR(event.getLocation())
			let box = this.nodeTouch.getBoundingBox()
			if(box.contains(loc)) {
				this.touchConfirm_ = true
				funcTouch(event)
			} else {
				this.touchConfirm_ = false 
			}
		},this)
		this.nodeTouch.on(cc.Node.EventType.TOUCH_MOVE,funcTouch,this)
		this.nodeTouch.on(cc.Node.EventType.TOUCH_END,(event:cc.Event.EventTouch)=>{
			funcTouch(event)
			this.touchConfirm_ = false 
		},this)
		this.nodeTouch.on(cc.Node.EventType.TOUCH_CANCEL,(event:cc.Event.EventTouch)=>{
			funcTouch(event)
			this.touchConfirm_ = false 
		},this)
	}

	protected update(dt: number): void {
		let per = this.bar.progress
		let ap = this.bar.node.getAnchorPoint()
		if(this.verOrHor) {
			this.nodeBlock.y = - this.barSize_.height * ap.y + this.barSize_.height * per
		} else {
			this.nodeBlock.x = - this.barSize_.width * ap.x + this.barSize_.width * per
		}
		if(this.prevValue_ != this.bar.progress) {
			this.prevValue_ = this.bar.progress
			if(this.funcChanged) {
				this.funcChanged()
			}
		}
	}
}