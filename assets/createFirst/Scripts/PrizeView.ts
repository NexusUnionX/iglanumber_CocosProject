import GameModel from "./GameModel";
import UIController from "./UIController";
import LoadingScreen from "./LoadingScreen";
import iglaGuideCtrl from "./iglaGuideCtrl";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PrizeView extends cc.Component {
    @property(cc.Node)
    rewardPanelRoot: cc.Node = null;
    @property(cc.Node)
    interactionLock: cc.Node = null;

    @property(sp.Skeleton)
    sp1:sp.Skeleton = null;
    @property(sp.Skeleton)
    sp2:sp.Skeleton = null;

    @property(cc.Label)
    amountLabel: cc.Label = null;

    static rewardAmount: number = 200;
    protected onEnable(): void {
        this.interactionLock.active = true;
        this.present(this.rewardPanelRoot, () => {
            this.interactionLock.active = false;
        })

        this.amountLabel.string = "+" + PrizeView.rewardAmount;

        // GameModel.GridPosition(409, PrizeView.rewardAmount + "");


        this.runSpin(this.sp1, "play", () => {
            this.sp1.setAnimation(0, "loop", true);
        });
        this.runSpin(this.sp2, "play", () => {
            this.sp2.setAnimation(0, "loop", true);
        });
    }

        /**封装一个 执行 带回调的 sp 动画播放 */
    runSpin(sp1: sp.Skeleton, name: string, cb: Function) {
        let a: sp.spine.TrackEntry = sp1.setAnimation(0, name, false);
        sp1.setTrackCompleteListener(a, (entry: sp.spine.TrackEntry, loopCount: number) => {
            if (cb) {
                cb();
            }
        })
    }

    onDismiss() {
        this.interactionLock.active = true;
        this.dismiss(this.rewardPanelRoot, () => {

            iglaGuideCtrl.instance.doGuide(4);
            this.node.destroy();
        })
    }
    /**打开页面动画 */
    present(node: cc.Node, cb: Function) {
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
    dismiss(node: cc.Node, cb: Function) {
        node.scale = 1;
        node.opacity = 255;
        cc.tween(node)
            .to(0.2, { scale: 0, opacity: 0 }, { easing: "backIn" })
            .call(() => {
                cb();
            })
            .start();
    }

    handleCloseButton() {
        LoadingScreen.onButtonPress();
        this.onDismiss();
    }

    handleClaimButton(){
        LoadingScreen.onButtonPress();

        if (this.interactionLock.active == true) {
            return;
        }

        this.interactionLock.active = true;

        GameModel.triggerVideoAd(
            ()=>{
                UIController.uiRootNode.triggerCoinFx(()=>{
                    GameModel.increaseGold(PrizeView.rewardAmount);
                })
                this.onDismiss();
            },
            ()=>{
                this.interactionLock.active = false;
            }
        )
    }
}
