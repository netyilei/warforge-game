import _ from "underscore";
import * as b3 from "../../tree/b3"
export class B3RandomCheck extends b3.Condition {

    public tick(tick: b3.Tick): b3.Status {

        let _prop = this.properties || {};
        let _rand = _prop["randomRate"]
        if(_.random(0,100)< parseInt(_rand)){
            return b3.Status.SUCCESS;
        }
        return b3.Status.FAILURE;
    }
}