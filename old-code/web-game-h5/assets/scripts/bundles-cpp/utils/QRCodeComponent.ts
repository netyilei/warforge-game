const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu("utils/QRCodeComponent")
export default class QRCodeComponent extends cc.Component {
	@property({
		tooltip: "二维码内容"
	})
	content: string = "";
	
	@property()
	fillColor = cc.Color.BLACK;

	@property(cc.Graphics)
	graphics:cc.Graphics = null

	protected onLoad(): void {
		if(this.content) {
			this.setContent(this.content);
		}
	}
	setContent(value: string) {
		console.log(value)
		this.content = value;
		let QRCode = require("qrcode");
		var qrcode = new QRCode(-1, 2);
		qrcode.addData(this.content);
		qrcode.make();

		let size = this.node.width;
		let num = qrcode.getModuleCount();
		var ctx = this.graphics || this.node.graphics;
		if (!ctx)
			ctx = this.node.addComponent(cc.Graphics);
		ctx.clear();
		ctx.fillColor = this.fillColor;
		// compute tileW/tileH based on node width and height
		var tileW = size / num;
		var tileH = size / num;

		let ap = ctx.node.getAnchorPoint();
		let offsetX = -size * ap.x;
		let offsetY = -size * ap.y;
		// draw in the Graphics
		for (var row = 0; row < num; row++) {
			for (var col = 0; col < num; col++) {
				if (qrcode.isDark(row, col)) {
					// cc.log(row, col)
					// ctx.fillColor = cc.Color.BLACK;
					var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
					var h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
					ctx.rect(Math.round(col * tileW) + offsetX, size - tileH - Math.round(row * tileH) + offsetY, w, h);
					ctx.fill();
				} else {
					// ctx.fillColor = cc.Color.WHITE;
				}
				// var w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
				// var h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
				// ctx.rect(Math.round(col * tileW), Math.round(row * tileH), w, h);
				// ctx.fill();
			}
		}
	}
}