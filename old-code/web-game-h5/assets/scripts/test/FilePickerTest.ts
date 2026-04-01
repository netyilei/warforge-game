import { FileUtils } from "../core/utils/FileUtils";

const { ccclass, property } = cc._decorator;

/**
 * 文件选择功能测试组件
 * 使用方法：
 * 1. 创建一个新节点
 * 2. 添加此组件
 * 3. 在场景中添加按钮，绑定对应的测试方法
 */
@ccclass
export default class FilePickerTest extends cc.Component {

    @property(cc.Label)
    resultLabel: cc.Label = null;

    @property(cc.Sprite)
    previewSprite: cc.Sprite = null;

    onLoad() {
        this.log("FilePickerTest 组件已加载");
        this.log(`平台: ${this.getPlatformName()}`);
    }

    /**
     * 测试1：选择任意文件
     */
    async testSelectAnyFile() {
        this.log("======== 测试：选择任意文件 ========");
        try {
            const result = await FileUtils.selectLocalFile(this.node, "*/*");
            
            if (!result) {
                this.log("用户取消了选择");
                return;
            }

            this.log(`✓ 文件选择成功`);
            this.log(`  文件名: ${result.fileName || '未知'}`);
            this.log(`  扩展名: ${result.ext}`);
            this.log(`  文件路径: ${result.filePath || result.uri}`);
            this.log(`  Blob大小: ${result.blob.size} 字节`);
            
        } catch (error) {
            this.logError("选择文件失败:", error);
        }
    }

    /**
     * 测试2：选择图片文件
     */
    async testSelectImage() {
        this.log("======== 测试：选择图片 ========");
        try {
            const result = await FileUtils.selectLocalFile(this.node, "image/*");
            
            if (!result) {
                this.log("用户取消了选择");
                return;
            }

            this.log(`✓ 图片选择成功`);
            this.log(`  文件名: ${result.fileName || '未知'}`);
            this.log(`  扩展名: ${result.ext}`);
            this.log(`  大小: ${(result.blob.size / 1024).toFixed(2)} KB`);

            // 尝试显示图片预览
            await this.showImagePreview(result);
            
        } catch (error) {
            this.logError("选择图片失败:", error);
        }
    }

    /**
     * 测试3：选择图片并转Base64
     */
    async testSelectImageBase64() {
        this.log("======== 测试：选择图片并转Base64 ========");
        try {
            const result = await FileUtils.selectLocalFileBase64(this.node, "image/*");
            
            if (!result) {
                this.log("用户取消了选择");
                return;
            }

            this.log(`✓ Base64转换成功`);
            this.log(`  扩展名: ${result.ext}`);
            this.log(`  Base64长度: ${result.base64.length} 字符`);
            this.log(`  Base64前50字符: ${result.base64.substring(0, 50)}...`);
            
        } catch (error) {
            this.logError("转换Base64失败:", error);
        }
    }

    /**
     * 测试4：选择文本文件并读取内容
     */
    async testSelectTextFile() {
        this.log("======== 测试：选择文本文件 ========");
        try {
            const result = await FileUtils.selectLocalFile(this.node, "text/*");
            
            if (!result) {
                this.log("用户取消了选择");
                return;
            }

            this.log(`✓ 文本文件选择成功`);
            this.log(`  文件名: ${result.fileName || '未知'}`);

            // 读取文本内容
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result as string;
                this.log(`  文件内容（前200字符）:`);
                this.log(`  ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            };
            reader.onerror = () => {
                this.logError("读取文件内容失败");
            };
            reader.readAsText(result.blob);
            
        } catch (error) {
            this.logError("选择文本文件失败:", error);
        }
    }

    /**
     * 测试5：选择PNG图片
     */
    async testSelectPNG() {
        this.log("======== 测试：仅选择PNG图片 ========");
        try {
            const result = await FileUtils.selectLocalFile(this.node, "image/png");
            
            if (!result) {
                this.log("用户取消了选择");
                return;
            }

            this.log(`✓ PNG图片选择成功`);
            this.log(`  文件名: ${result.fileName || '未知'}`);
            this.log(`  扩展名: ${result.ext}`);
            this.log(`  大小: ${(result.blob.size / 1024).toFixed(2)} KB`);

            await this.showImagePreview(result);
            
        } catch (error) {
            this.logError("选择PNG图片失败:", error);
        }
    }

    /**
     * 显示图片预览
     */
    private async showImagePreview(result: FileUtils.SelectLocalFileRet) {
        if (!this.previewSprite) {
            this.log("  ⚠ 未设置预览Sprite，跳过图片显示");
            return;
        }

        try {
            // Web平台
            if (!cc.sys.isNative && result.uri) {
                this.log("  正在加载图片预览（Web）...");
                const spriteFrame = await FileUtils.loadTextureByUri(result.uri);
                if (spriteFrame) {
                    this.previewSprite.spriteFrame = spriteFrame;
                    this.log("  ✓ 图片预览显示成功");
                } else {
                    this.log("  ✗ 加载图片失败");
                }
            }
            
            // Native平台
            else if (cc.sys.isNative && result.filePath) {
                this.log("  正在加载图片预览（Native）...");
                cc.loader.load(result.filePath, (err, texture) => {
                    if (!err && texture) {
                        const spriteFrame = new cc.SpriteFrame(texture);
                        this.previewSprite.spriteFrame = spriteFrame;
                        this.log("  ✓ 图片预览显示成功");
                    } else {
                        this.logError("  ✗ 加载图片失败:", err);
                    }
                });
            }
            
            // 通用方法：使用Blob URL
            else if (result.blob) {
                this.log("  正在加载图片预览（Blob）...");
                const blobUrl = URL.createObjectURL(result.blob);
                const spriteFrame = await FileUtils.loadTextureByUri(blobUrl);
                if (spriteFrame) {
                    this.previewSprite.spriteFrame = spriteFrame;
                    this.log("  ✓ 图片预览显示成功");
                } else {
                    this.log("  ✗ 加载图片失败");
                }
            }
        } catch (error) {
            this.logError("  显示图片预览失败:", error);
        }
    }

    /**
     * 清除日志
     */
    clearLog() {
        if (this.resultLabel) {
            this.resultLabel.string = "日志已清除\n";
        }
        console.log("[FilePickerTest] 日志已清除");
    }

    /**
     * 获取平台名称
     */
    private getPlatformName(): string {
        if (cc.sys.isNative) {
            if (cc.sys.os === cc.sys.OS_ANDROID) {
                return "Android Native";
            } else if (cc.sys.os === cc.sys.OS_IOS) {
                return "iOS Native";
            }
            return "Native (Unknown)";
        }
        return "Web Browser";
    }

    /**
     * 输出日志
     */
    private log(message: string) {
        console.log(`[FilePickerTest] ${message}`);
        if (this.resultLabel) {
            this.resultLabel.string += message + "\n";
        }
    }

    /**
     * 输出错误日志
     */
    private logError(message: string, error?: any) {
        const errorMsg = error ? `${message} ${error.message || error}` : message;
        console.error(`[FilePickerTest] ${errorMsg}`);
        if (this.resultLabel) {
            this.resultLabel.string += `❌ ${errorMsg}\n`;
        }
    }

    /**
     * 测试平台检测
     */
    testPlatformDetection() {
        this.log("======== 测试：平台检测 ========");
        this.log(`  cc.sys.isNative: ${cc.sys.isNative}`);
        this.log(`  cc.sys.os: ${cc.sys.os}`);
        this.log(`  cc.sys.OS_ANDROID: ${cc.sys.OS_ANDROID}`);
        this.log(`  cc.sys.OS_IOS: ${cc.sys.OS_IOS}`);
        this.log(`  当前平台: ${this.getPlatformName()}`);
        
        if (typeof jsb !== 'undefined') {
            this.log(`  JSB可用: true`);
            this.log(`  jsb.reflection: ${typeof jsb.reflection}`);
            this.log(`  jsb.fileUtils: ${typeof jsb.fileUtils}`);
        } else {
            this.log(`  JSB可用: false`);
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        this.log("======== 文件选择功能测试帮助 ========");
        this.log("可用的测试方法：");
        this.log("1. testSelectAnyFile() - 选择任意文件");
        this.log("2. testSelectImage() - 选择图片");
        this.log("3. testSelectImageBase64() - 选择图片转Base64");
        this.log("4. testSelectTextFile() - 选择文本文件");
        this.log("5. testSelectPNG() - 仅选择PNG图片");
        this.log("6. testPlatformDetection() - 平台检测");
        this.log("7. clearLog() - 清除日志");
        this.log("");
        this.log("使用方法：");
        this.log("- 在场景中创建按钮");
        this.log("- 绑定按钮点击事件到对应方法");
        this.log("- 点击按钮进行测试");
    }
}

