import UIController from "./UIController";
import LoadingScreen from "./LoadingScreen";
import GameViewController from "./GameViewController";
import GameModel from "./GameModel";
import { dredeData } from "../../Dredge/Script/DredgeData";
import iglaGuideCtrl from "./iglaGuideCtrl";
import FrameworkBridge from "./FrameworkBridge";

const {ccclass, property} = cc._decorator;
@ccclass
export default class UnlockPopup extends cc.Component {
    //已修改
    @property(cc.Node)
    backdropNode: cc.Node = null;
    @property(cc.Sprite)
    itemSprite: cc.Sprite = null;
    @property(cc.Label)
    tierLabel: cc.Label = null;

    @property(cc.Node)
    tierLabelBackdrop: cc.Node = null;

    @property(sp.Skeleton)
    sp1:sp.Skeleton = null;

    onEnable() {
        this.backdropNode.opacity = 254.99;
        this.itemSprite.node.parent.scale = 1.799;
        this.itemSprite.node.parent.position = cc.v3(0, -24.99);

        LoadingScreen.playSfx("unlockSfx");

        this.runSpin(this.sp1, "play", () => {
            this.sp1.setAnimation(0, "loop", true);
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

    isInitialDisplay(level: number) {
        let target = null;

        // GameModel.GridPosition(408, level + "");


        target = UIController.uiRootNode.displayTexture.node;
        this.itemSprite.spriteFrame = GameViewController.viewRoot.spriteTextureArray[(level - 1) % 24]; 

        // let yu = level % 6;
        // this.tierLabelBackdrop.getComponent(cc.Sprite).spriteFrame = yu > 0 ? GameViewController.viewRoot.spriteFrameArray[yu - 1] : GameViewController.viewRoot.spriteFrameArray[5];
        // let colorList =["#347D12","#0974B7","#CA580D","#C117BC","#D1630A","#BF1E1F"];
        // let colorr = new cc.Color();
        // this.tierLabel.node.getComponent(cc.LabelOutline).color =colorr.fromHEX(yu > 0 ? colorList[yu - 1] : colorList[5]);

        this.tierLabel.string = level + "";

        // this.scheduleOnce(()=>{
        //     this.playIntroAnimation();
        // },0.1)

        iglaGuideCtrl.instance.doGuide(3);
    }

    playIntroAnimation(){

        //TODO 这边需要处理AB 面的执行逻辑 B面不需要锤子

        if(FrameworkBridge.sdkLoadStatus){
            UIController.revealUnlockPopup();
        }else{
            UIController.uiRootNode.harmeffDo(() => {
            dredeData.savedData.chisel += 1;
            UIController.revealUnlockPopup();
        })
        }
        this.node.destroy();
        


    }

}
