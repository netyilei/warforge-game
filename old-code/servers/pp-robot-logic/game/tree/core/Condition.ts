import * as b3 from "../b3constant"
import {BaseNode} from "./BaseNode"
import { Tick } from "./Tick";

export abstract class Condition extends BaseNode{
    constructor(params : any){
        super(params);
        this.category = b3.Category.CONDITION;
    }
    public enter(tick: Tick): void {
        
    }
    public open(tick: Tick): void {
        
    }
    public close(tick: Tick): void {
        
    }
    public exit(tick: Tick): void {
        
    }

    public tick(tick: Tick): b3.Status {
        // 实现检查是否准备退出逻辑
        return b3.Status.SUCCESS;
    }
}