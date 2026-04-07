declare module '@toast-ui/editor' {
  interface EditorOptions {
    el: HTMLElement;
    height?: string;
    initialEditType?: 'markdown' | 'wysiwyg';
    previewStyle?: 'tab' | 'vertical';
    initialValue?: string;
    placeholder?: string;
    usageStatistics?: boolean;
    hideModeSwitch?: boolean;
    hooks?: {
      addImageBlobHook?: (blob: Blob | File, callback: (url: string, altText: string) => void) => void;
    };
  }

  class Editor {
    constructor(options: EditorOptions);
    on(event: string, callback: () => void): void;
    off(event: string): void;
    getMarkdown(): string;
    getHTML(): string;
    setMarkdown(markdown: string, cursorToEnd?: boolean): void;
    setHTML(html: string, cursorToEnd?: boolean): void;
    changeMode(mode: 'markdown' | 'wysiwyg'): void;
    focus(): void;
    destroy(): void;
  }

  export default Editor;
}

declare module '@toast-ui/editor/dist/toastui-editor.css' {
  const css: string;
  export default css;
}
