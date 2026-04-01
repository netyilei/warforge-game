import UIManager from "../core/ui/UIManager";

const { ccclass, property, menu, requireComponent } = cc._decorator;

@ccclass
@menu("widget/Dropdown")
export default class Dropdown extends cc.Button {
  @property({ type: cc.Label, visible: false })
  label: cc.Label = null;
  @property({ type: cc.Node })
  private active: cc.Node = null;
  @property({ type: cc.Node })
  private item: cc.Node = null;

  protected list: DropdownItemData[] = null;
  protected call: (index: number) => void = null
  public setList(strs: string[] | string, call: (index: number) => void) {
    if (this.list) {
      this.list = [];
      this.active.destroyAllChildren()
    };
    this.call = call
    let arr: string[] = Array.isArray(strs) ? strs : [strs];

    this.list = [];
    arr.forEach((str: string, index: number) => {
      let obj: DropdownItemData = {
        id: index,
        content: str,
        value: null,
      };
      this.list.push(obj);
    });
    this.list.forEach((did: DropdownItemData) => {
      let node: cc.Node = cc.instantiate(this.item);
      node.parent = this.active;
      node.childComponent(cc.Label, "label").string = did.content;
      node.childNode("icon").active = false;
      node.active = true;
      console.log(node);
      node.button.clickEvents[0].customEventData = did.id.toString();
    });
    this.setSelect(0);
  }

  protected onClickItem(_, data: string) {
    let id: number = parseInt(data);
    if (isNaN(id)) {
      return;
    }
    this.setSelect(id);
  }

  protected setValue(id: number) {
    this.call && this.call(id)
    let find = this.list.find((v) => v.id == id);
    if (!find) {
      return;
    }
    this.label.string = find.content;
  }

  protected setSelect(id: number) {
    this.active.children.forEach((node: cc.Node, index: number) => {
      node.childNode("icon").active = index == id;
    });
    this.setValue(id);
    this.close();
  }

  protected onLoad(): void {
    // this.setActiveIndex();
  }

  /**
   * 设置active的层级
   * 防止因为层级问题导致active显示异常
   */
  protected setActiveIndex() {
    let position: cc.Vec2 = this.active.convertToWorldSpaceAR(cc.Vec2.ZERO);
    let p = UIManager.instance.dropdown.convertToNodeSpaceAR(position);
    this.active.parent = UIManager.instance.dropdown;
    this.active.setPosition(p);
  }

  protected status: boolean = false; //默认关闭

  onClick() {
    if (this.status) this.close();
    else this.open();
  }

  open() {
    this.status = true;
    console.log(this.active)
    this.active.scaleY = 0;
    this.active.active = true;
    cc.tween(this.active)
      .to(0.2, { scaleY: 1 }, { easing: "smooth" })
      .call(() => { })
      .start();
  }

  close() {
    this.status = false;
    this.active.scaleY = 1;
    cc.tween(this.active)
      .to(0.2, { scaleY: 0 }, { easing: "smooth" })
      .call(() => {
        this.active.active = false;
      })
      .start();
  }

  protected onDestroy(): void {
    UIManager.instance.dropdown;
  }
}

export type DropdownItemData = {
  id: number;
  content: string;
  value: any;
};
