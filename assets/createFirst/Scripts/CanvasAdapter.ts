const {ccclass, property} = cc._decorator;
@ccclass
export default class CanvasAdapter extends cc.Component {
    @property(cc.Canvas)
    gameCanvas: cc.Canvas = null;
    protected onLoad(): void {
        if (cc.winSize.height / cc.winSize.width < 1280 / 720) {
            this.gameCanvas.fitHeight = true;
            this.gameCanvas.fitWidth = false;
        }
        else {
            this.gameCanvas.fitHeight = false;
            this.gameCanvas.fitWidth = true;
        }
    }
}
