export declare class BehaviorTreeDefine {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly properties: any;
    readonly root: any;
    readonly debug: Object;
    readonly isOpenLog: boolean;
    B3Log(...args: any[]);
    recordPath(path:string);
}