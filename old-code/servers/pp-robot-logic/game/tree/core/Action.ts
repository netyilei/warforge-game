
import { Category, Status } from "../b3constant";
import {BaseNode} from "./BaseNode"
import { Tick } from "./Tick";

export abstract class Action extends BaseNode{
    constructor( params : any){
        super(params);
        this.category = Category.ACTION;
    }
    public enter(tick: Tick): void {
        
    }
    public open(tick: Tick): void {
        
    }
    public close(tick: Tick): void {
        
    }
    public exit(tick: Tick): void {
        
    }

    public tick(tick: Tick): Status {
        // 实现检查是否准备退出逻辑
        return Status.SUCCESS;
    }
}