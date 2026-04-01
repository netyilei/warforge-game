import * as b3 from "../b3constant"
import { Status } from "../b3constant";
import {BaseNode} from "./BaseNode"
import { Tick } from "./Tick";

export abstract class Composite extends BaseNode{
    public children : BaseNode[] = [];

    constructor( params : any){
        super(params);
        this.category = b3.Category.COMPOSITE;
        this.children = (params.children || []).slice(0);
    }
    public enter(tick: Tick): void {
        
    }
    public open(tick: Tick): void {
        
    }
    public tick(tick: Tick): Status {
        for(let i = 0; i < this.children.length; i++){
            let status = this.children[i]._execute(tick);
 
            if(status != Status.SUCCESS){
                return status;
            }
        }
 
        return Status.SUCCESS;
    }
    public close(tick: Tick): void {
        
    }
    public exit(tick: Tick): void {
        
    }
}