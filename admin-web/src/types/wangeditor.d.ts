declare module '@wangeditor/editor-for-vue' {
  import { DefineComponent } from 'vue';
  import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

  export const Editor: DefineComponent<{
    modelValue?: string;
    defaultValue?: string;
    defaultConfig?: Partial<IEditorConfig>;
    mode?: 'default' | 'simple';
    disabled?: boolean;
    onOnChange?: (editor: IDomEditor) => void;
    onOnBlur?: (editor: IDomEditor) => void;
    onOnFocus?: (editor: IDomEditor) => void;
    onOnCreated?: (editor: IDomEditor) => void;
    onOnDestroyed?: (editor: IDomEditor) => void;
    'onUpdate:modelValue'?: (value: string) => void;
  }>;

  export const Toolbar: DefineComponent<{
    editor?: IDomEditor;
    defaultConfig?: Partial<IToolbarConfig>;
    mode?: 'default' | 'simple';
  }>;
}
