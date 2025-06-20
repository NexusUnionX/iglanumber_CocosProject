import LoadingScreen from "./LoadingScreen";
import GameViewController, { PosMsg } from "./GameViewController";
import GameModel from "./GameModel";
import AnimationEffect from "./AnimationEffect";
import WorkerCtrl from "./WorkerCtrl";
import { dredeData } from "../../Dredge/Script/DredgeData";
import HarmEff from "./HarmEff";
import iglaGuideCtrl from "./iglaGuideCtrl";

const { ccclass, property } = cc._decorator;
@ccclass
export default class UIController extends cc.Component {
    //已修改
    public static uiRootNode: UIController = null;
    @property(cc.Label)
    marqueeLabel: cc.Label = null;
    @property(cc.Sprite)
    displayTexture: cc.Sprite = null;

    @property(cc.Node)
    handleLevelUpClick: cc.Node = null;
    @property(cc.Node)
    handleDamageClick: cc.Node = null;
    @property(cc.Node)
    handleToolClick: cc.Node = null;

    @property(cc.Prefab)
    optionsPanel: cc.Prefab = null;
    @property(cc.Prefab)
    prizesPanel: cc.Prefab = null;
    @property(cc.Prefab)
    coinFx: cc.Prefab = null;
    @property(cc.Prefab)
    HarmEff: cc.Prefab = null;

    @property(cc.Prefab)
    mergeFx: cc.Prefab = null;

    @property(cc.Prefab)
    puzzle: cc.Prefab = null;

    @property(cc.Prefab)
    boom:cc.Prefab = null;
    @property(cc.Prefab)
    wind:cc.Prefab = null;
    public renderScoreValue: number = 0;

    protected onLoad(): void {
        UIController.uiRootNode = this;

        cc.director.on("setShow", this.revealOptionsPanel, this);

        //初始化 冰块游戏
        dredeData.init({
            get coin() {
                return GameModel.dispatchModelEvent.gold;
            },
            set coin(v) {
                GameModel.increaseGold(v - GameModel.dispatchModelEvent.gold);
            },
            get isSound() {
                return GameModel.dispatchModelEvent.eff_On;
            }
        });
        

    }

    protected onEnable(): void {
        this.marqueeLabel.string = `${GameModel.dispatchModelEvent.scorePlayer}`;
        this.toolSprite();
        this.toolQuantity();

        this.schedule(()=>{
            if (this.renderScoreValue < GameModel.dispatchModelEvent.scorePlayer) {
                let score = Math.floor((GameModel.dispatchModelEvent.scorePlayer - this.renderScoreValue) / 2);
                if (score < 1) {
                    score = 0;
                    this.renderScoreValue = GameModel.dispatchModelEvent.scorePlayer;
                }
                this.renderScoreValue += score;

                this.marqueeLabel.string = `${this.renderScoreValue}`;
            }
            else {
                this.marqueeLabel.string = `${GameModel.dispatchModelEvent.scorePlayer}`;
            }
        },0.05)

        this.updateBackdrop();
    }

    updateBackdrop(){
        // this.backdropImage.getComponent(cc.Sprite).spriteFrame = this.backdropLibrary[GameModel.dispatchModelEvent.bgIndex];
    }

    toolQuantity() {
        // let need = PropView.costGold;
        let upbtnCount = this.handleLevelUpClick.getChildByName("bg").getChildByName("count");
        upbtnCount.getChildByName("Label").getComponent(cc.Label).string = GameModel.dispatchModelEvent.upTool + "";
        let add = this.handleLevelUpClick.getChildByName("bg").getChildByName("count").getChildByName("add");
        let lab = this.handleLevelUpClick.getChildByName("bg").getChildByName("count").getChildByName("Label");
        if (GameModel.dispatchModelEvent.upTool <= 0) {
            add.active = true;
            lab.active = false;
        }
        else{
            add.active = false;
            lab.active = true;
        }
        ///////////////////////////
        let harmbtnCount = this.handleDamageClick.getChildByName("bg").getChildByName("count");
        harmbtnCount.getChildByName("Label").getComponent(cc.Label).string = GameModel.dispatchModelEvent.harmTool + "";
        let add2 = this.handleDamageClick.getChildByName("bg").getChildByName("count").getChildByName("add");
        let lab2 = this.handleDamageClick.getChildByName("bg").getChildByName("count").getChildByName("Label");
        if (GameModel.dispatchModelEvent.harmTool <= 0) {
            add2.active = true;
            lab2.active = false;
        }
        else{
            add2.active = false;
            lab2.active = true;
        }
        //////////////////////////
        let resetbtnCount = this.handleToolClick.getChildByName("bg").getChildByName("count");
        resetbtnCount.getChildByName("Label").getComponent(cc.Label).string = GameModel.dispatchModelEvent.flashTool + "";
        let add3 = this.handleToolClick.getChildByName("bg").getChildByName("count").getChildByName("add");
        let lab3 = this.handleToolClick.getChildByName("bg").getChildByName("count").getChildByName("Label");
        if (GameModel.dispatchModelEvent.flashTool <= 0) {
            add3.active = true;
            lab3.active = false;
        }
        else{
            add3.active = false;
            lab3.active = true;
        }
    }

    /**更新上端分数旁边的宝石图片 */
    toolSprite() {
        cc.tween(this.displayTexture.node)
            .to(0.2, { scale: 0.1*0.45 })
            .call(() => {
                this.displayTexture.spriteFrame = GameViewController.viewRoot.spriteTextureArray[(GameModel.dispatchModelEvent.current_Big_Num - 1) % 24];
            })
            .to(0.2, { scale: 1*0.45 })
            .call(() => {
                this.displayTexture.node.scale = 1 * 0.45;
            })
            .start()
    }

    /**升级模块后的爆炸金币事件 */
    ultimateEffect() {
        let allnum = 99;
        GameModel.initiateShake(50);
        LoadingScreen.playSfx("coinSfx");

        for (let i = 0; i < allnum; i++) {
            let coins: cc.Node = null;
            coins = cc.instantiate(GameViewController.viewRoot.goldTargetNode);
            coins.scale = 0.5;
            // coins.parent = CatViewCtrl.base.EffectRoot;
            coins.parent = LoadingScreen.loadingViewRoot.modalViewContainer;

            coins.setPosition(0, 0)
            coins.angle = -Math.random() * 359;
            coins.active = true;
            coins.children[0].active = false;

            let twn = (cb)=>{
                let x = (-(cc.winSize.width / 2) - 299) + Math.random() * (cc.winSize.width + 599);
                let time = Math.random() + 1.4 + 0.1;
                let scale = 0.4 + 0.1 + (((cc.winSize.width + 799) / 2) - Math.abs(x)) / (cc.winSize.width + 299);
                // let rotateMax = Math.random() * 180;
                return cc.sequence(
                    cc.spawn(
                        cc.jumpTo(time, x, (-cc.winSize.height / 2) - 199, Math.floor(Math.random() * 999), 1),
                        cc.scaleTo(time, scale, scale),
                        // cc.rotateBy(Math.random() * time,rotateMax)//金币本身已经有旋转动画了
                    ),
                    cc.callFunc(function () {
                        cb();
                    }.bind(this))
                )
            }

            cc.tween(coins)
                .then(twn(() => {
                    coins.destroy();
                }))
                .start()
        }
    }

    /**分数增加 */
    increaseScore(num: number) {
        let newScore = num * 10;
        GameModel.dispatchModelEvent.scorePlayer += newScore;
    }
    
    executeRestart() {
        // this.scheduleOnce(() => {
        //     if (this.node.active) {
        //         this.replayPanel.getChildByName("spine").active = false;
        //         this.initiateReadySequence();
        //     }
        // }, 2)


        GameViewController.viewRoot.inputBlocker.active = true;
        // this.replayPanel.getChildByName("spine").active = true;
        // this.replayPanel.getChildByName("spine").getComponent(sp.Skeleton).setAnimation(0, "guocang", false);
        
        this.replayPanel.getChildByName("Go").active = true;
        this.replayPanel.getChildByName("Go").width = 481;
        this.replayPanel.getChildByName("Go").height = 391;
        cc.tween(this.replayPanel.getChildByName("Go"))
            .to(0.25, { width: 0, height: 0 })
            .call(()=>{
                
            })
            .to(0.5, { width: 481 * 3, height: 391 * 3 })
            .call(()=>{
                if (this.node.active) {
                    this.replayPanel.getChildByName("Go").active = false;
                    this.initiateReadySequence();
                    WorkerCtrl.instance.clearAll();
                }
            })
            .start()

        cc.audioEngine.stopMusic();
    }

    @property(cc.Node)
    prepareIndicator: cc.Node = null;
    @property(cc.Node)
    startIndicator: cc.Node = null;
    @property(cc.Node)
    replayPanel: cc.Node = null;
    public initiateReadySequence() {
        LoadingScreen.playSfx("specialActionSfx");
        GameViewController.viewRoot.inputBlocker.active = true;
        this.prepareIndicator.active = true;
        this.startIndicator.active = false;
        this.startSequenceAnim(this.prepareIndicator, () => {
            this.prepareIndicator.active = false;
            this.startIndicator.active = true;
            this.startSequenceAnim(this.startIndicator, () => {
                this.startIndicator.active = false;
                GameViewController.viewRoot.inputBlocker.active = false;
                LoadingScreen.playBackgroundMusic();
            })
        });
    }

    /**弹出效果*/
    public startSequenceAnim(flagNode: cc.Node, cb: Function) {
        flagNode.scale = 0;
        cc.tween(flagNode)
            .to(1, { scale: 1.5 }, { easing: 'backOut' })
            .call(() => {
                if (cb) cb();
            })
            .start()
    }

    revealOptionsPanel(){
                        GameModel.GridPosition(412);

        LoadingScreen.onButtonPress();

        let n = cc.instantiate(this.optionsPanel);
        n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;

        // GameModel.GridPosition(402);
    }

    // showRewardView(){
    //     let n = cc.instantiate(this.RewardView);
    //     n.parent = LoadingVIew.base.popView;
    // }

    /**这个是进度产出 */
    static revealPrizesPanel(){
        let n = cc.instantiate(UIController.uiRootNode.prizesPanel);
        n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
    }

    /**这个是解锁用的奖励弹窗 */
    static revealUnlockPopup(){
        let n = cc.instantiate(UIController.uiRootNode.prizesPanel);
        n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
    }
    

    triggerCoinFx(cb:Function){
        let n = cc.instantiate(this.coinFx);
        n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
        n.getComponent(AnimationEffect).runPrimaryAction(cb);
    }

    harmeffDo(cb:Function){
        let n = cc.instantiate(this.HarmEff);
        n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
        n.getComponent(HarmEff).runPrimaryAction(cb);
    }

    /**播放合并动画 */
    public triggerMergeFx(r,c) {
        let f = (r, c) => {
            let star = cc.instantiate(this.mergeFx);
            star.position = GameModel.fetchCoordinates(r, c);
            star.y += GameViewController.viewRoot.gameGridRoot.y;

            star.scale = 1.5;
            star.parent = GameViewController.viewRoot.generalFxRoot;

            let spp = star.getComponent(sp.Skeleton);
            let sppT: sp.spine.TrackEntry = spp.setAnimation(0, "an", false);
            spp.setTrackCompleteListener(sppT, (entry: sp.spine.TrackEntry, loopCount: number) => {
                star.destroy();
            })
        }

        f(r,c);

    }

    /**打开冰块页面 */
    openPuzzle(){
                        GameModel.GridPosition(411);
        
        LoadingScreen.onButtonPress();

        let n = cc.instantiate(this.puzzle);
        n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;

        iglaGuideCtrl.instance.doGuide(5);
        
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

    boomEff(coord: PosMsg,cb:Function){
        let star = cc.instantiate(this.boom);
        let newPos = GameModel.fetchCoordinates(coord)
        star.position = cc.v3(newPos.x, newPos.y - 240);
        star.parent = GameViewController.viewRoot.generalFxRoot;

        let spp = star.getComponent(sp.Skeleton);
        this.runSpin(spp,"animation",()=>{
            star.destroy();
            if (cb) {
                cb();
            }
        })
    }

    windEff(cb:Function){
        let star = cc.instantiate(this.wind);
        star.position = cc.v3(0, 0 - 240 - 50);

        let spp = star.getComponent(sp.Skeleton);
        star.parent = GameViewController.viewRoot.generalFxRoot;

        let isDo = false;
        spp.timeScale = 2;
        spp.setEventListener((trackEntry: sp.spine.TrackEntry, event) => {
            console.log(event.data.name)
            if (event.data.name == "move") {
                LoadingScreen.playSfx("toolUseSfx");
                if (cb && isDo == false) { 
                    isDo = true;    
                    cb(); 
                }
            }
        })

        let a: sp.spine.TrackEntry = spp.setAnimation(0, "animation", false);
        spp.setTrackCompleteListener(a, (entry: sp.spine.TrackEntry, loopCount: number) => {
            star.destroy();
            if (cb && isDo == false) {
                isDo = true;
                cb();
            }
        })

      
    }
}
