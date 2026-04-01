import * as b3 from "../../tree/b3"

export class B3GamePri extends b3.Composite {

    public tick(tick: b3.Tick): b3.Status {
        for(let i = 0; i < this.children.length; i++){
            let status = this.children[i]._execute(tick);
 
            if(status != b3.Status.FAILURE){
                return status;
            }
        }
        
        return b3.Status.FAILURE;
     }
}