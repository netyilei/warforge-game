import * as b3 from "../b3constant"
import {BaseNode} from "./BaseNode"

export abstract class Decorator extends BaseNode{
    public child : BaseNode = null!;
    
    constructor( params : any){
        super(params)
        this.category = b3.Category.DECORATOR;
        this.child = params.child || null;
    }
}