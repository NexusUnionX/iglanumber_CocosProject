const {ccclass, property} = cc._decorator;
@ccclass
export default class HeaderSettings extends cc.Component {
    protected onLoad(): void {
        let preced = cc.winSize.width / cc.winSize.height;
        let limit =  0.56;
        let widget = this.node.getComponent(cc.Widget);
        if (preced < limit) {
            if (widget) {
                widget.top += 65;
                widget.updateAlignment();
            } 
            else {
                this.node.y -= 65;
            }
        }
    }
}
