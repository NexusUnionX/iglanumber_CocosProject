import UIController from "./UIController";
import GameModel from "./GameModel";
import GameViewController, { PosMsg } from "./GameViewController";
import WorkerCtrl from "./WorkerCtrl";

const { ccclass, property } = cc._decorator;
@ccclass
export default class FelineUnit extends cc.Component {
    //已修改
    @property(cc.Label)
    captionDisplay: cc.Label = null;
    @property(cc.Sprite)
    visualSprite: cc.Sprite = null;
    @property(cc.Node)
    selectionIndicator: cc.Node = null;
    @property(cc.Node)
    tierBackdrop: cc.Node = null;
    
    /**坐标 */
    public gridCoordinates: PosMsg = null;
    /**类型 */
    public felineVariant: number = null;
    /**移动路径; */
    public movementTrack: string[] = [];
    /**是否已经消除的意思？ */
    public isAnimating: boolean = false;
    /**是否在升级道具过程中 */
    public ascendAnimation: boolean = false;
    /**是否在锤子道具过程中 */
    public damageAnimation: boolean = false;

    onEnable() {
        this.selectionIndicator.active = false;
        this.node.angle = 0;
        this.isAnimating = false;
        this.ascendAnimation = false;
        this.damageAnimation = false;

        this.node.on(cc.Node.EventType.TOUCH_START, this.initiateButton, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.abortButton, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.terminateButton, this);

        cc.director.on("breathTween", this.pulseEffect, this);
    }

    protected onDisable(): void {
        /**解绑点击事件 */
        this.node.off(cc.Node.EventType.TOUCH_START, this.initiateButton, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.abortButton, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.terminateButton, this);

        cc.director.off("breathTween", this.pulseEffect, this);
    }

    /**初始化 */
    public isInitialRun() {
        this.felineVariant = null;
        if (!this.gridCoordinates) this.gridCoordinates = GameModel.retrievePositionInfo();
    }

    /**设置类型 */
    public sparkleType(num: number) {
        let colorList =["#538DC5","#538DC5","#538DC5","#538DC5","#538DC5","#538DC5"];

        this.felineVariant = num;
        this.captionDisplay.string = `${this.felineVariant}`;

        let yu = num % 6;

        // this.tierBackdrop.getComponent(cc.Sprite).spriteFrame = yu > 0 ? GameViewController.viewRoot.spriteFrameArray[yu - 1] : GameViewController.viewRoot.spriteFrameArray[5];

        let colorr = new cc.Color();
        this.captionDisplay.node.getComponent(cc.LabelOutline).color = colorr.fromHEX(yu > 0 ? colorList[yu - 1] : colorList[5]);

        this.selectionIndicator.children[0].active = false;
        this.selectionIndicator.children[1].active = false;
        this.selectionIndicator.children[2].active = false;
        this.selectionIndicator.children[3].active = false;

        let numIn = 1;
        let index = 0;
        if((num % 24) == 0 ){
            numIn = 24;
        }
        else{
            numIn = num % 24;
        }
        
        if (numIn % 6 == 0) {
            index = Math.floor(numIn / 6) - 1;
        }
        else{
            index = Math.floor(numIn / 6);
        }
        this.selectionIndicator.children[index].active = true;



        this.sparkleVisual();
    }

    /**设置坐标 */
    public updateCoordinates(x: number | PosMsg, y?: number) {
        if (!this.gridCoordinates) this.gridCoordinates = GameModel.retrievePositionInfo();
        this.gridCoordinates.updateData(x, y);
    }

    /**更新方块图片 */
    private sparkleVisual() {
        this.visualSprite.spriteFrame = GameViewController.viewRoot.spriteTextureArray[(this.felineVariant - 1) % 24];
    }

    private initiateButton(e: cc.Event.EventTouch) {
        if (GameViewController.areCellsAnimating) return;
        // 满进度播放操作 截胡
        if(WorkerCtrl.instance.isBlock == true){
            return;
        }

        this.node.setScale(cc.v2(1.1, 1.1));
        GameViewController.viewRoot.onCellTouchStart(this.gridCoordinates.cloneData(), e.getLocation());
    }

    private terminateButton() {
        this.node.setScale(cc.v2(1, 1));
        GameViewController.viewRoot.onCellTouchEnd();
    }

    private abortButton(e: cc.Event.EventTouch) {
        this.node.setScale(cc.v2(1, 1));
        GameViewController.viewRoot.onCellTouchCancel(this.gridCoordinates.cloneData(), e.getLocation());
    }

    /**目标点开始检测要合并的方块，生成路线 */
    public executeTravelAnim(arr: number[][], tileMap: Array<Array<FelineUnit>>) {
        this.commenceAction([], arr, tileMap);

    }
    /**设置节点移动时路径 */
    public commenceAction(path, arr: number[][], tileMap: Array<Array<FelineUnit>>) {
        // 检测过的方块不在检测
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.movementTrack = path;

        let f1 = (pos, arr) => {
            let str = pos[0] + "-" + pos[1];
            if (arr.indexOf(str) == -1) return false;
            return true
        }

        let ff = (path, arr: number[][], tileMap: Array<Array<FelineUnit>>) => {
            // 往上找
            if (f1([this.gridCoordinates.xCoord, this.gridCoordinates.yCoord + 1], arr)) {
                let newPath = JSON.parse(JSON.stringify(path));
                newPath.push(this.gridCoordinates.xCoord + "-" + this.gridCoordinates.yCoord);
                tileMap[this.gridCoordinates.xCoord][this.gridCoordinates.yCoord + 1].commenceAction(newPath, arr, tileMap);
            }
            // 往下找
            if (f1([this.gridCoordinates.xCoord, this.gridCoordinates.yCoord - 1], arr)) {
                let newPath = JSON.parse(JSON.stringify(path));
                newPath.push(this.gridCoordinates.xCoord + "-" + this.gridCoordinates.yCoord);
                tileMap[this.gridCoordinates.xCoord][this.gridCoordinates.yCoord - 1].commenceAction(newPath, arr, tileMap);
            }
            // 往左找
            if (f1([this.gridCoordinates.xCoord - 1, this.gridCoordinates.yCoord], arr)) {
                let newPath = JSON.parse(JSON.stringify(path));
                newPath.push(this.gridCoordinates.xCoord + "-" + this.gridCoordinates.yCoord);
                tileMap[this.gridCoordinates.xCoord - 1][this.gridCoordinates.yCoord].commenceAction(newPath, arr, tileMap);
            }
            // 往右找
            if (f1([this.gridCoordinates.xCoord + 1, this.gridCoordinates.yCoord], arr)) {
                let newPath = JSON.parse(JSON.stringify(path));
                newPath.push(this.gridCoordinates.xCoord + "-" + this.gridCoordinates.yCoord);
                tileMap[this.gridCoordinates.xCoord + 1][this.gridCoordinates.yCoord].commenceAction(newPath, arr, tileMap);
            }
        }

        let ff2 = (arr) => {
            if (!this.movementTrack.length) return;
            let _path = [];
            this.movementTrack.push(this.gridCoordinates.xCoord + "-" + this.gridCoordinates.yCoord);
            for (let i = this.movementTrack.length - 1; i >= 0; i--) {
                let row = parseInt(this.movementTrack[i].split("-")[0]);
                let col = parseInt(this.movementTrack[i].split("-")[1]);
                _path.push(GameModel.fetchCoordinates(row, col));
            }

            //  分数动效
            if (this.felineVariant > 0) {
                UIController.uiRootNode.increaseScore(this.felineVariant);
            }

            this.node.stopAllActions();
            let cb = () => {
                this.isAnimating = false;
                GameViewController.viewRoot.updateMatchedCellsData(this.gridCoordinates.xCoord, this.gridCoordinates.yCoord);

                GameViewController.animatingCellCount += 1;
                if (GameViewController.animatingCellCount === arr.length - 1) {
                    GameViewController.animatingCellCount = 0;
                    GameViewController.viewRoot.onFallAnimationComplete();
                }
                
                if(GameViewController.animatingCellCount == 1){
                    let aa = parseInt( this.movementTrack[0].split("-")[0]);
                    let bb = parseInt( this.movementTrack[0].split("-")[1]);

                    UIController.uiRootNode.triggerMergeFx(aa,bb);
                }


                this.node.destroy();
            }
            cc.tween(this.node)
                .then(cc.cardinalSplineTo(_path.length * 0.08, _path, 1))
                .call(() => {
                    cb();
                })
                .start()
        }

        ff(path, arr, tileMap);
        ff2(arr);
    }

    /**数字加一提示 */
    public displayTierIcon(flag: boolean) {
        this.selectionIndicator.active = flag;
        this.ascendAnimation = flag;
        this.damageAnimation = false;
    }

    public displayHitIcon(flag: boolean) {
        this.selectionIndicator.active = flag;
        this.damageAnimation = flag;
        this.ascendAnimation = false;
    }

    public pulseEffect(){
        cc.tween(this.visualSprite.node)
            .delay(this.gridCoordinates.xCoord * 0.1)
            .to(0.2, { scale: 1.1 })
            .to(0.2, { scale: 1 })
            .to(0.2, { scale: 1.1 })
            .to(0.2, { scale: 1 })
            .start()
    }



}
