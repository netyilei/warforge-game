export namespace WebUtils {

    /**
     * 设置剪贴板内容
     * @param content 要复制的文本
     */
    export async function copyToClipboard(content: string): Promise<boolean> {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                // 现代浏览器使用Clipboard API
                await navigator.clipboard.writeText(content);
                return true;
            } else {
                // 旧浏览器fallback方案
                const textArea = document.createElement("textarea");
                textArea.value = content;
                textArea.style.position = "fixed";
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error("copyToClipboard error:", error);
            return false;
        }
    }

    /**
     * 获取剪贴板内容
     * @returns 剪贴板中的文本
     */
    export async function getClipboard(): Promise<string> {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            } else {
                console.warn("Clipboard API not supported");
                return "";
            }
        } catch (error) {
            console.error("getClipboard error:", error);
            return "";
        }
    }

    /**
     * 清空剪贴板
     */
    export async function clearClipboard(): Promise<boolean> {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText("");
                return true;
            } else {
                // 旧浏览器fallback
                const textArea = document.createElement("textarea");
                textArea.value = "";
                textArea.style.position = "fixed";
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error("clearClipboard error:", error);
            return false;
        }
    }

};