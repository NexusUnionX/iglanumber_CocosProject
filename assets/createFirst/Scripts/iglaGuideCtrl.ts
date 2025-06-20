import FrameworkBridge from "./FrameworkBridge";
import GameModel from "./GameModel";
import LoadingScreen from "./LoadingScreen";
import UIController from "./UIController";

const {ccclass, property} = cc._decorator;
@ccclass
export default class iglaGuideCtrl extends cc.Component {
    @property(cc.Node)
    guide1: cc.Node = null;
    @property(cc.Node)
    guide2: cc.Node = null;
    @property(cc.Node)
    guide3: cc.Node = null;
    @property(cc.Node)
    guide4: cc.Node = null;
    @property(cc.Node)
    guide5: cc.Node = null;
    @property(cc.Node)
    guide6: cc.Node = null;

    @property(cc.Node)
    block: cc.Node = null;

    @property(sp.Skeleton)
    spinaa: sp.Skeleton = null;

    static instance: iglaGuideCtrl = null;
    onLoad() {
        iglaGuideCtrl.instance = this;
        this.block.active = false;
        this.closeAll();

        let ev: cc.Component.EventHandler = new cc.Component.EventHandler();
        ev.target = this.node;
        ev.component = "iglaGuideCtrl";
        ev.handler = "doFinish";
        this.guide1.getComponent(cc.Button).clickEvents = [ev];
        this.guide2.getComponent(cc.Button).clickEvents = [ev];
        this.guide3.getComponent(cc.Button).clickEvents = [ev];
        this.guide4.getComponent(cc.Button).clickEvents = [ev];
        this.guide5.getComponent(cc.Button).clickEvents = [ev];
        this.guide6.getComponent(cc.Button).clickEvents = [ev];
        cc.director.on("guide2",this.doGuide2,this)
    }

    closeAll(){
        this.guide1.active = false;
        this.guide2.active = false;
        this.guide3.active = false;
        this.guide4.active = false;
        this.guide5.active = false;
        this.guide6.active = false;
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
    doGuide(num: number) {
        //TODO这边操作 AB
        if(FrameworkBridge.sdkLoadStatus)return;
        if(GameModel.dispatchModelEvent.guideNum != num){
            return;
        }
        if(num == 1){
            this.guide1.active = true;
            this.block.active = true
            this.runSpin(this.spinaa, "story", () => {
                this.block.active = false;
            })
        }
        else if(num == 2){
            this.guide2.active = true;
        }
        else if(num == 3){
            this.guide3.active = true;
        }
        else if(num == 4){
            this.guide4.active = true;
        }
        else if(num == 5){
            this.guide5.active = true;
        }
        else if(num == 6){
            this.guide6.active = true;
        }

        GameModel.GridPosition(402, num + "");
        
        if(num != 1){
            this.block.active = true
            this.scheduleOnce(() => {
                this.block.active = false;
            }, 1)
        }
    }

     doGuide2(num: number) {
        //TODO这边操作 B面引导完了发射事件打开游戏操作引导
        GameModel.dispatchModelEvent.guideNum = 2
       if(num == 2){
            this.guide2.active = true;
        }
        GameModel.GridPosition(402, num + "");
        
        if(num != 1){
            this.block.active = true
            this.scheduleOnce(() => {
                this.block.active = false;
            }, 1)
        }
    }

    /**完成本阶段执行 */
    doFinish(){
        LoadingScreen.onButtonPress();
        
        GameModel.dispatchModelEvent.guideNum++;
        LoadingScreen.saveGameData();

        this.closeAll();

        //这个比较特殊需要再任务一 后执行任务2
        if (GameModel.dispatchModelEvent.guideNum == 2) {
            iglaGuideCtrl.instance.doGuide(2);
        }
        //第四部 需要强制进入 副玩法页面
        if(GameModel.dispatchModelEvent.guideNum == 5){
            UIController.uiRootNode.openPuzzle();
        }

        //这个比较特殊需要再任务5 后执行任务6
        if (GameModel.dispatchModelEvent.guideNum == 6) {
            iglaGuideCtrl.instance.doGuide(6);
        }

    }
}
