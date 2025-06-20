import LoadingScreen from "./LoadingScreen";

const {ccclass, property} = cc._decorator;
@ccclass
export default class VideoTipView extends cc.Component {
    @property(cc.Node)
    promptRoot: cc.Node = null;
    @property(cc.Node)
    promptLock: cc.Node = null;

    static priceDisplayLabel: number = 2000;

    protected onEnable(): void {
        this.promptLock.active = true;
        this.displayPrompt(this.promptRoot, () => {
            this.promptLock.active = false;
        })
    }

    onPromptClose() {
        this.promptLock.active = true;
        this.concealPrompt(this.promptRoot, () => {
            this.node.destroy();
        })
    }
    /**打开页面动画 */
    displayPrompt(node: cc.Node, cb: Function) {
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
    concealPrompt(node: cc.Node, cb: Function) {
        node.scale = 1;
        node.opacity = 255;
        cc.tween(node)
            .to(0.2, { scale: 0, opacity: 0 }, { easing: "backIn" })
            .call(() => {
                cb();
            })
            .start();
    }

    onCancelButton() {
        LoadingScreen.onButtonPress();


        if (this.cancelCallback) { 
            this.cancelCallback(); 
            this.cancelCallback = null ;
        }


        this.onPromptClose();
    }

    onConfirmButton(){
        LoadingScreen.onButtonPress();
        if (this.confirmCallback) { 
            this.confirmCallback(); 
            this.confirmCallback = null ;
        }
        this.onPromptClose();
    }

    confirmCallback: Function = null;
    cancelCallback: Function = null;
    initializeCallbacks(getCB: Function, giveupCB: Function) {
        this.confirmCallback = getCB;
        this.cancelCallback = giveupCB;
    }


    
}
