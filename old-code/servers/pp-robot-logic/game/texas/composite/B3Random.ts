import * as b3 from "../../tree/b3"

export class B3Random extends b3.Composite {

    public tick(tick: b3.Tick): b3.Status {
        // 实现随机选择子节点执行的逻辑
        if(!this.children.length){
            return b3.Status.FAILURE;
        }
        let childIndex = Math.floor(Math.random() * this.children.length);
        let child = this.children[childIndex];
        let status = child.tick(tick);
        return status;
    }
}