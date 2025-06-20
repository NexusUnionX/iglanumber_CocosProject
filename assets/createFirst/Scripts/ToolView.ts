import GameModel from "./GameModel";
import UIController from "./UIController";
import LoadingScreen from "./LoadingScreen";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ToolView extends cc.Component {
    @property(cc.Node)
    panelRoot: cc.Node = null;
    @property(cc.Node)
    overlayLock: cc.Node = null;

    @property(cc.Label)
    quantityLabel: cc.Label = null;

    @property(cc.Label)
    descriptionLabel: cc.Label = null;
    @property(cc.Node)
    upgradeTexture: cc.Node = null;
    @property(cc.Node)
    specialTexture: cc.Node = null;
    @property(cc.Node)
    damageTexture: cc.Node = null;

    toolType: number = 1;

    static priceInGold: number = 2000;

    protected onEnable(): void {
        this.overlayLock.active = true;
        this.displayPanel(this.panelRoot, () => {
            this.overlayLock.active = false;
        })
    }

    onCloseCallback() {
        this.overlayLock.active = true;
        this.concealPanel(this.panelRoot, () => {
            this.node.destroy();
        })
    }
    /**打开页面动画 */
    displayPanel(node: cc.Node, cb: Function) {
        node.scale = 0.9;
        node.opacity = 0;
        cc.tween(node)
            .to(0.2, { scale: 1, opacity: 255 }, { easing: "backOut" })
            .call(() => {
                cb();
            })
            .start();
    }
    /**关闭页面动画 */
    concealPanel(node: cc.Node, cb: Function) {
        node.scale = 1;
        node.opacity = 255;
        cc.tween(node)
            .to(0.2, { scale: 0, opacity: 0 }, { easing: "backIn" })
            .call(() => {
                cb();
            })
            .start();
    }

    onCloseButton() {
        LoadingScreen.onButtonPress();
        this.onCloseCallback();
    }



    refreshDisplay(type: number) {
        this.toolType = type;
        this.quantityLabel.string = ToolView.priceInGold + "";

        this.upgradeTexture.active = false;
        this.specialTexture.active = false;
        this.damageTexture.active = false;

        switch (type) {
            case 1:
                // CatModel.CatMessage.upTool
                this.upgradeTexture.active = true;
                this.descriptionLabel.string = `Increase the number of any gem by 1`;
                break;
            case 2:
                // CatModel.CatMessage.flashTool
                this.specialTexture.active = true;
                this.descriptionLabel.string = `Rearrange all gems according to numbers`;
                break;
            case 3:
                // CatModel.CatMessage.harmTool
                this.damageTexture.active = true;
                this.descriptionLabel.string =  `Use the bomb prop to destroy any gem grid`;
                break;
        }
    }

    onPurchaseWithGold(){
        LoadingScreen.onButtonPress();

        if (GameModel.dispatchModelEvent.gold < ToolView.priceInGold) {
            LoadingScreen.loadingViewRoot.displayNotification("Not enough coins");
            
            return;
        }

        GameModel.increaseGold(-ToolView.priceInGold);

        switch (this.toolType) {
            case 1:
                // CatModel.CatMessage.upTool
                GameModel.dispatchModelEvent.upTool += 1;
                LoadingScreen.saveGameData();
                break;
            case 2:
                // CatModel.CatMessage.flashTool
                GameModel.dispatchModelEvent.flashTool += 1;
                LoadingScreen.saveGameData();
                break;
            case 3:
                // CatModel.CatMessage.harmTool
                GameModel.dispatchModelEvent.harmTool += 1;
                LoadingScreen.saveGameData();
                break;
        }

        UIController.uiRootNode.toolQuantity();

        this.onCloseCallback();
    }

    onWatchAdForReward(){
        LoadingScreen.onButtonPress();
        if (this.overlayLock.active == true) {
            return;
        }
        this.overlayLock.active = true;
        
        GameModel.triggerVideoAd(
            () => {
                switch (this.toolType) {
                    case 1:
                        // CatModel.CatMessage.upTool
                        GameModel.dispatchModelEvent.upTool += 1;
                        LoadingScreen.saveGameData();
                        break;
                    case 2:
                        // CatModel.CatMessage.flashTool
                        GameModel.dispatchModelEvent.flashTool += 1;
                        LoadingScreen.saveGameData();
                        break;
                    case 3:
                        // CatModel.CatMessage.harmTool
                        GameModel.dispatchModelEvent.harmTool += 1;
                        LoadingScreen.saveGameData();
                        break;
                }
                UIController.uiRootNode.toolQuantity();
                this.onCloseCallback();
            },
            () => {
                this.overlayLock.active = false;
            }
        )

    }

}
