import FelineUnit from "./FelineUnit";
import UIController from "./UIController";
import UnlockPopup from "./UnlockPopup";
import GameModel from "./GameModel";
import LoadingScreen from "./LoadingScreen";
import ToolView from "./ToolView";
import WorkerCtrl from "./WorkerCtrl";
import iglaGuideCtrl from "./iglaGuideCtrl";
import FrameworkBridge from "./FrameworkBridge";

const { ccclass, property } = cc._decorator;
@ccclass
export default class GameViewController extends cc.Component {
    ////////////////////////////////////////////////静态常量
    /**行数 */
    static rowCount = 5;// 行数
    /**列数 */
    static columnCount = 5; // 列数
    /**方块的尺寸 */
    static cellSize = 120;// 方块的尺寸
    /**间隔 */
    static cellSpacing = 1; // 间隔
    /**边距 */
    static gridPadding = 4;// 边距
    /**是否正在运动 */
    static areCellsAnimating = false;
    /**是否点击加一按钮 */
    static isLevelingUp = false;
    /**是否点击点个消除 */
    static isDamaging = false;
    /**动画个数 */
    static animatingCellCount = 0;

    /**滑动方向 */
    static dirUp = 1; // 上
    static dirDown = 2// 下
    static dirLeft = 3 // 左
    static dirRight = 4 // 右

    ///////////////////////////////////////////////////配置
    /**权重随机 连击的东东 */
    static comboMultiplier = [
        { "arrList": [1, 3], "weightNum": 500 },
        { "arrList": [1, 5], "weightNum": 500 },
        { "arrList": [5, 10], "weightNum": 300 },
        { "arrList": [10, 20], "weightNum": 200 }
    ];
    //奖励 连击 1
    static primaryReward = 10;
    //奖励 连击 2
    static secondaryReward = 5;
    /**连击次数 * 这个值 就是这次 消除的 金币数 */
    static baseComboBonus = 5;
    /**最大封顶值 */
    static maxComboBonus = 100;

    
    //////////////////////变量使用
    static cellLocationGrid: cc.Vec3[][] = null;

    ////////////////////////////////////////////////静态常量

    static viewRoot: GameViewController = null;
    @property(cc.Prefab)
    catUnitPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    unlockPopup: cc.Prefab = null;
    @property(cc.Prefab)
    toolPanel: cc.Prefab = null;

    /**金币效果用的 */
    @property(cc.Node)
    goldTargetNode: cc.Node = null;
    /**升级效果 */
    @property(cc.Node)
    levelUpFx: cc.Node = null;

    /**模块预设放入的父节点 */
    @property(cc.Node)
    gameGridRoot: cc.Node = null;
    /**阻挡点击事件节点 */
    @property(cc.Node)
    inputBlocker: cc.Node = null;
    /**连击combo 效果 节点 */
    @property(cc.Node)
    comboFxRoot: cc.Node = null;
    /**效果节点 用于放置效果 */
    @property(cc.Node)
    generalFxRoot: cc.Node = null;

  


    @property(cc.Node)
    displayTutorialPointer: cc.Node = null;
    @property(cc.Node)
    displayDamageSelector: cc.Node = null;

    /**飞往目标 */
    @property(cc.Node)
    objectiveSprite: cc.Node = null;

    /**锤子目标 */
    @property(cc.Node)
    damageTargetSprite: cc.Node = null;

    @property(cc.SpriteFrame)
    spriteTextureArray: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spriteFrameArray: cc.SpriteFrame[] = [];


    /**类型表：二维数组，保存所有方块的类型，方便计算 */
    private gridData: number[][] = null;
    /**组件表：二维数组，保存所有方块 Tile 组件，方便读取 */
    cellNodeGrid: FelineUnit[][] = null;

    /**滑动开始位置 */
    private touchStartLocation: cc.Vec2 = null;
    /**连击次数 */
    private currentComboChain: number = 1;  // 连击
    /**这个玩意是用来计算玩家本地连击 的连击次数的 如果连击小过这个值的时候 就让下一次生成的所有模块都一样的意思*/
    private nextComboChain: number = 0;

    protected onLoad() {
        GameViewController.viewRoot = this;
        this.damageTargetSprite.parent.active = !FrameworkBridge.sdkLoadStatus;
        cc.director.on("iglaLoadEvent",(flag:boolean)=>{
            this.damageTargetSprite.parent.active = !flag;
        },this)
    }

    idleAnimTimer:number = 5;
    currentPulseState:number = 0;
    start() {
        // 默认如果记录数字地图为第一个位置为0,则默认为自动重新开始
        // if (CatModel.CatMessage.Map_Game.length == 0 || CatModel.CatMessage.Map_Game[0][0] == 0) {
        //     this.startANewGameNeed();
        // } else {
            // this.continueMyGame();
        // }

        this.initializeGameplay();

        //动画
        this.schedule(()=>{
            if(GameViewController.areCellsAnimating ||GameViewController.isLevelingUp||GameViewController.isDamaging){
                this.currentPulseState = 0;
                return;
            }

            this.currentPulseState += cc.director.getDeltaTime();
            if (this.currentPulseState >= this.idleAnimTimer) {
                cc.director.emit("breathTween");
                this.currentPulseState = -0.5;
            }
        }, 0)

        iglaGuideCtrl.instance.doGuide(1);
    }

    initializeGameplay() {

        // 重新开始游戏
        // for (let i = 0; i < CatModel.CatMessage.Map_Game.length; i++) {
        //     for (let k = 0; k < CatModel.CatMessage.Map_Game[i].length; k++) {
        //         if (!CatModel.CatMessage.Map_Game[i][k] || CatModel.CatMessage.Map_Game[i][k] == null) {
        //             this.reBuildGameDO();
        //             return;
        //         }
        //     }
        // }

        GameModel.dispatchModelEvent.Map_Game.forEach((v)=>{
            v.forEach((v2)=>{
                if (!v2 || v2 == null) {
                    this.regenerateGrid();
                    return;
                }
            })
        })
        GameViewController.cellLocationGrid = GameModel.isInitialAction();
        this.continueGridPopulation();
   
    }

    regenerateGrid() {
        GameModel.dispatchModelEvent.current_Big_Num = 5;
        GameViewController.cellLocationGrid = GameModel.isInitialAction();
        this.generateInitialGrid();
        this.populateCellNodes();

        this.generateRandomChain(); // 计算连击次数
    }

    /** 生成初始的类型表*/
    private generateInitialGrid() {
        this.gridData = GameModel.generateArray();
        if (!GameModel.hasPossibleMerge(this.gridData)) {
            this.generateInitialGrid();
        }
    }

    /**根据类型表生成方块11*/
    private populateCellNodes() {
        let f = () => {
            this.cellNodeGrid = [];
            for (let c = 0; c < GameViewController.columnCount; c++) {
                let colTileSet: FelineUnit[] = [];
                for (let r = 0; r < GameViewController.rowCount; r++) {
                    colTileSet.push(GameModel.spawnCatUnit(c, r, this.gridData[c][r]));
                }
                this.cellNodeGrid.push(colTileSet);
            }
        }
        f();
        GameModel.dispatchModelEvent.Map_Game = this.gridData;
    }

    /*根据权重返回数组里面的元素，要求arr1和arr2数组长度一样 a1 产生随机结果的数组 a2 控制权重的数组，要求arr2元素个数和arr1元素个数对应*/
    private getRandomType(arr1: any[], arr2: any[]){
        if (arr1.length != arr2.length) {
            // console.warn("random2: arr1.length != arr2.length");
            return null;
        }
        let sum = 0;
        let factor = 0;
        let random = Math.random();
        for (let i = arr2.length - 1; i >= 0; i--) {
            sum += arr2[i]; // 统计概率总和
        };
        random *= sum; // 生成概率随机数
        for (let i = arr2.length - 1; i >= 0; i--) {
            factor += arr2[i];
            if (random <= factor)
                return arr1[i];
        };
        return null;
    }

    // 连击数计算方法， 写出来的目标是让玩家玩起来觉得很爽很爽
    generateRandomChain() {
        let ComboWeights = [];
        let ComboArrs = [];
        let data = GameViewController.comboMultiplier;
        data.forEach(m => {
            ComboWeights.push(m.weightNum);
            ComboArrs.push(m.arrList);
        })
        let type = this.getRandomType(ComboArrs, ComboWeights);
        this.nextComboChain = GameModel.generateRandomInt(type[0], type[1]);
    }

    /**生成并初始化方块*/
    private spawnCellAt(x: number, y: number, num: number): FelineUnit {
        let node = cc.instantiate(this.catUnitPrefab);
        let fun = (node: cc.Node) => {
            node.setParent(this.gameGridRoot);
            node.setPosition(GameModel.fetchCoordinates(x, y));
            let gemItem = node.getComponent(FelineUnit);
            gemItem.isInitialRun();
            gemItem.updateCoordinates(x, y);
            gemItem.sparkleType(num);
            return gemItem;
        }
        return fun(node);
    }

    /**继续游戏初始化 */
    private continueGridPopulation() {
        let f = () => {
            this.gridData = GameModel.dispatchModelEvent.Map_Game;
            this.cellNodeGrid = [];
            for (let c = 0; c < GameViewController.columnCount; c++) {
                let colTileSet: FelineUnit[] = [];
                for (let r = 0; r < GameViewController.rowCount; r++) {
                    colTileSet.push(this.spawnCellAt(c, r, this.gridData[c][r]));
                }
                this.cellNodeGrid.push(colTileSet);
            }
        }
        f();
    }

    /**触摸开始 */
    onCellTouchStart(coord: PosMsg, pos: cc.Vec2) {
        if (GameViewController.areCellsAnimating) return;
        
        for (let r = 0; r < GameViewController.rowCount; r++) {
            for (let c = 0; c < GameViewController.columnCount; c++) {
                if (GameViewController.areCellsAnimating || !this.cellNodeGrid[c][r]) {
                    return;
                }
                this.cellNodeGrid[c][r].isAnimating = false;
            }
        }

        let fun= ()=>{
            //升星按钮
            if (GameViewController.isLevelingUp) {
                this.onLevelUpButton(coord);
            }
            //锤子按钮
            else if (GameViewController.isDamaging) {
                this.onDamageButton(coord);
            }
            else {
                GameViewController.areCellsAnimating = true;
                this.touchStartLocation = pos;
            }
        }

        fun();
    }

    onLevelUpButton(coord: PosMsg) {
        let _numTile = this.getCatUnitType(coord);
        let gemItem = this.getCatUnitComponent(coord);

        if (_numTile >= GameModel.dispatchModelEvent.current_Big_Num || _numTile == -1) {
            LoadingScreen.loadingViewRoot.displayNotification("You cannot choose the maximum");
            LoadingScreen.playSfx("errorSfx");
            return;
        }

        let f1 = ()=>{
            this.upgradeCatUnit.displayTierIcon(false);
            gemItem.displayTierIcon(true);
            this.upgradeCatUnit = gemItem;

            let pos = GameModel.fetchCoordinates(gemItem.gridCoordinates);
            this.displayTutorialPointer.position = cc.v3(pos.x+10, pos.y - 40);
        }
        let f2 = ()=>{
            LoadingScreen.playSfx("levelUpSfx");


            let _newNum = _numTile + 1;

            this.upgradeCatUnit.displayTierIcon(false);
            this.upgradeCatUnit = null;
            this.displayTutorialPointer.active = false;

            this.setCatUnitType(coord, _newNum);
            gemItem.sparkleType(_newNum);
            GameModel.dispatchModelEvent.upTool -= 1;
            // GameModel.GridPosition(404, GameModel.dispatchModelEvent.upTool + "");

            GameViewController.isLevelingUp = false;

            UIController.uiRootNode.toolQuantity();

            this.inputBlocker.active = true;

            this.checkForPossibleMoves();
        }

        if (gemItem && !gemItem.ascendAnimation) {
            f1();
        } 
        else if (gemItem && gemItem.ascendAnimation) {
            f2();
        }
    }

    onDamageButton(coord: PosMsg) {
        let tile = this.getCatUnitComponent(coord);
        if (this.getCatUnitType(coord) >= GameModel.dispatchModelEvent.current_Big_Num || this.getCatUnitType(coord) == -1) {
           
            LoadingScreen.loadingViewRoot.displayNotification("You cannot choose the maximum");

            LoadingScreen.playSfx("errorSfx");
            return;
        }

        let f1 = ()=>{
            let newPos = GameModel.fetchCoordinates(coord)

            this.displayDamageSelector.position = cc.v3(newPos.x , newPos.y );

            this.damageCatUnit.displayHitIcon(false);
            tile.displayHitIcon(true);
            this.damageCatUnit = tile;
        }
        let f2 = ()=>{
            // if (_tile.box) {
            //   this.removeBox(coord.x, coord.y);
            // }

            this.displayDamageSelector.active = false;
            LoadingScreen.playSfx("damageSfx");

            UIController.uiRootNode.boomEff(coord, ()=>{
                this.updateCatUnitVisuals(coord, null);
                this.setCatUnitType(coord, null);
    
                this.inputBlocker.active = true;
    
                // GlabolPool.put(_tile.node);
                tile.node.parent = null;
                this.dropCells();
                GameModel.dispatchModelEvent.harmTool -= 1;
                // GameModel.GridPosition(407, GameModel.dispatchModelEvent.harmTool + "");
                GameModel.GridPosition(410);
    
                GameViewController.isDamaging = false;
                UIController.uiRootNode.toolQuantity();
            });


        }

        if (tile && !tile.damageAnimation) {
            f1();
        } 
        else if (tile && tile.damageAnimation) {
            f2();
        }
    }

    /**触摸结束 */
    onCellTouchEnd() {
        this.touchStartLocation = null;
        GameViewController.areCellsAnimating = false;
    }

    /**触摸被打断 */
    onCellTouchCancel(coord: PosMsg, cancelPos: cc.Vec2) {
        if (this.touchStartLocation == null) return;

        this.swapCells(coord, this.getSwapDirection(this.touchStartLocation, cancelPos));
        this.touchStartLocation = null;
    }

    /**尝试滑动交换方块*/
    private swapCells(coord: PosMsg, direction: number) {
        let targetCoord = this.determineDirection(coord, direction);
        if (targetCoord) {
            this.inputBlocker.active = true;
            this.attemptSwap(coord, targetCoord);
        } 
        else {
            GameViewController.areCellsAnimating = false;
            this.inputBlocker.active = false;
        }
    }

    /**获取滑动的方向 */
    public getSwapDirection(startPos: cc.Vec2, endPos: cc.Vec2): number {
        let offsetX = endPos.x - startPos.x; // x 偏移
        let offsetY = endPos.y - startPos.y; // y 偏移

        let result = Math.abs(offsetX) < Math.abs(offsetY)
        if (result) {
            if (offsetY > 0) {
                return GameViewController.dirUp;
            }
            else {
                return GameViewController.dirDown;
            }
            // return offsetY > 0 ? MoveDirToItem.UpDir : MoveDirToItem.DownDir
        } else {
            if (offsetX > 0) {
                return GameViewController.dirRight;
            }
            else {
                return GameViewController.dirLeft;
            }
            // return offsetX > 0 ? MoveDirToItem.RightDir : MoveDirToItem.LeftDir;
        }
    }
    /**获取指定方向的坐标*/
    public determineDirection(pos: PosMsg, direction: number) {
        if (direction == GameViewController.dirUp) {
            if (pos.yCoord === GameViewController.rowCount - 1) {
                return null;
            }
            else {
                return GameModel.retrievePositionInfo(pos.xCoord, pos.yCoord + 1);
            }
        }
        else if (direction == GameViewController.dirDown) {
            if (pos.yCoord === 0) {
                return null;
            }
            else {
                return GameModel.retrievePositionInfo(pos.xCoord, pos.yCoord - 1);
            }
        }
        else if (direction == GameViewController.dirLeft) {
            if (pos.xCoord === 0) {
                return null;
            }
            else {
                return GameModel.retrievePositionInfo(pos.xCoord - 1, pos.yCoord)
            }
        }
        else if (direction == GameViewController.dirRight) {
            if (pos.xCoord === GameViewController.columnCount - 1) {
                return null;
            }
            else {
                return GameModel.retrievePositionInfo(pos.xCoord + 1, pos.yCoord);
            }
        }
    }

    /**尝试交换方块*/
    private attemptSwap(coord1: PosMsg, coord2: PosMsg) {
        // 交换方块
        this.executeSwap(coord1, coord2);

        this.revertSwap(coord1, coord2);
    }

    /**交换方块*/
    private executeSwap(coord1: PosMsg, coord2: PosMsg) {
        LoadingScreen.playSfx("levelUpSfx");

        // 保存变量
        let tile1 = this.getCatUnitComponent(coord1);
        let tile2 = this.getCatUnitComponent(coord2);
        let tile1Num = this.getCatUnitType(coord1);
        let tile2Num = this.getCatUnitType(coord2);
        // 交换数据
        tile1.updateCoordinates(coord2);
        tile2.updateCoordinates(coord1);
        this.setCatUnitType(coord1, tile2Num);
        this.setCatUnitType(coord2, tile1Num);
        this.updateCatUnitVisuals(coord1, tile2);
        this.updateCatUnitVisuals(coord2, tile1);
        // 交换方块动画
        cc.tween(tile1.node).to(0.1, { position: GameModel.fetchCoordinates(coord2) }).start();
        cc.tween(tile2.node).to(0.1, { position: GameModel.fetchCoordinates(coord1) }).start();
    }

    private revertSwap(coord1: PosMsg, coord2: PosMsg) {
        // 查找是否拥有合并
        var arr1 = new Array();
        var arr2 = new Array();
        var scanArr1 = new Array();
        var scanArr2 = new Array();
        this.checkNeighborsForMatch(coord2.xCoord, coord2.yCoord, -1, -1, this.gridData[coord2.xCoord][coord2.yCoord], arr1, scanArr1);
        this.checkNeighborsForMatch(coord1.xCoord, coord1.yCoord, -1, -1, this.gridData[coord1.xCoord][coord1.yCoord], arr2, scanArr2);
        // 合并 如果第一个可以合并，则先第一个做合并;
        if (arr1.length > 2) {
            this.processMatches(arr1, coord2);
        } else if (arr2.length > 2) {
            this.processMatches(arr2, coord1);
        } else {
            GameViewController.areCellsAnimating = false;
            this.inputBlocker.active = false;
        }
    }

    /** 核心扫描逻辑
    * @param row 指定行
    * @param col 指定列
    * @param lastRow 上次扫描的行
    * @param lastCol 上次扫描的列
    * @param num 扫描要比对的数字
    * @param arr 记录数字相同且彼此相邻的数组
    * @param scanArr 记录扫描过的点的数组
*/
    private checkNeighborsForMatch(row, col, lastRow, lastCol, num, arr, scanArr) {
        if (!this.cellNodeGrid[row][col]) {
            return;
        }
        let isClear = false;
        if (scanArr == undefined) {
            scanArr = new Array();
        }
        // 扫描过的节点不再扫描
        if (scanArr.indexOf(row + "-" + col) == -1) {
            scanArr.push(row + "-" + col);
        } 
        else {
            return;
        }

        let ff = () => {
            if (arr.indexOf(row + "-" + col) == -1) {
                arr.push(row + "-" + col);
            }
        }
        let isSame = (a, b) => {
            if (a == b) {
                return true;
            }
            else {
                return false;
            }
        }
        let fUP = ()=>{
            // 扫描上
            if (col < 4 && (lastRow != row || lastCol != (col + 1)) && this.cellNodeGrid[row][col + 1] != null) {
                let nextNum = this.cellNodeGrid[row][col + 1].felineVariant;
                if (isSame(nextNum, num)) {
                    ff();
                    this.checkNeighborsForMatch(row, col + 1, row, col, num, arr, scanArr);
                    isClear = true;
                }
            }
        }
        let fDown = ()=>{
            // 扫描下
            if (col > 0 && (lastRow != row || lastCol != (col - 1)) && this.cellNodeGrid[row][col - 1] != null) {
                let nextNum = this.cellNodeGrid[row][col - 1].felineVariant;
                if (isSame(nextNum, num)) {
                    ff();
                    this.checkNeighborsForMatch(row, col - 1, row, col, num, arr, scanArr);
                    isClear = true;
                }
            }
        }
        let fLeft = ()=>{
            // 扫描左
            if (row > 0 && (lastRow != (row - 1) || lastCol != col) && this.cellNodeGrid[row - 1][col] != null) {
                let nextNum = this.cellNodeGrid[row - 1][col].felineVariant;
                if (isSame(nextNum, num)) {
                    ff();
                    this.checkNeighborsForMatch(row - 1, col, row, col, num, arr, scanArr);
                    isClear = true;
                }
            }
        }
        let fRight= ()=>{
            // 扫描右
            if (row < 4 && (lastRow != (row + 1) || lastCol != col) && this.cellNodeGrid[row + 1][col] != null) {
                let nextNum = this.cellNodeGrid[row + 1][col].felineVariant;
                if (isSame(nextNum, num)) {
                    ff();
                    this.checkNeighborsForMatch(row + 1, col, row, col, num, arr, scanArr);
                    isClear = true;
                }
            }
        }
        let fAll = () => {
            // 四周都不通，但不是出发遍历点，并且数字相同，也加入到数组
            if (!isClear && (lastRow != -1 && lastCol != -1)) {
                let curNum = this.cellNodeGrid[row][col].felineVariant;
                if (isSame(curNum, num)) {
                    ff();
                }
            }
        }

        fUP();
        fDown();
        fLeft();
        fRight();
        fAll();
    }
    /**获取组件*/
    private getCatUnitComponent(x: number | PosMsg, y?: number): FelineUnit {
        return typeof x === 'number' ? this.cellNodeGrid[x][y] : this.cellNodeGrid[x.xCoord][x.yCoord];
    }
    /**设置类型表*/
    private getCatUnitType(x: number | PosMsg, y?: number): number {
        return typeof x === 'number' ? this.gridData[x][y] : this.gridData[x.xCoord][x.yCoord];
    }
    /**获取类型*/
    private setCatUnitType(x: number | PosMsg, y: number | number, type?: number) {
        if (typeof x === 'number') this.gridData[x][y] = type;
        else this.gridData[x.xCoord][x.yCoord] = <number>y;
    }
    /**设置组件表*/
    private updateCatUnitVisuals(x: number | PosMsg, y: number | FelineUnit, gemItem?: FelineUnit) {
        if (typeof x === 'number') this.cellNodeGrid[x][<number>y] = gemItem;
        else this.cellNodeGrid[x.xCoord][x.yCoord] = <FelineUnit>y;
    }

    private targetLocationData = null;
    /**合并方块*/
    public processMatches(arr: number[][], posMsgTarget: PosMsg) {

        // if(GameModel.dispatchModelEvent.unlockCount >= GameModel.dispatchModelEvent.current_Big_Num){
            //执行 加进度操作
              WorkerCtrl.instance.addProcess(1);
        // }
        GameModel.GridPosition(403);

        if (this.currentComboChain == 1) {
            LoadingScreen.playSfx("buttonSfx1");
        }

        this.targetLocationData = posMsgTarget;
        if (this.currentComboChain <= 10) {
            this.displayCoinFx(GameModel.fetchCoordinates(posMsgTarget), this.currentComboChain * GameViewController.baseComboBonus, this.currentComboChain);
        }
        else {
            this.displayCoinFx(GameModel.fetchCoordinates(posMsgTarget), this.currentComboChain * GameViewController.baseComboBonus, 10);
        }

        this.cellNodeGrid[posMsgTarget.xCoord][posMsgTarget.yCoord].executeTravelAnim(arr, this.cellNodeGrid);
    }
     
    // public static effShowGoldS(pos: cc.Vec3, tileNum: number, addNum: number){
    //     CatViewCtrl.base.effShowGold(pos, tileNum, addNum);
    // }

    /**金币产出(一个一个飞上去的效果)*/
    displayCoinFx(pos: cc.Vec3, tileNum: number, addNum: number) {
        tileNum = tileNum > GameViewController.maxComboBonus ? GameViewController.maxComboBonus : tileNum;
        let f = (pos) => {
            let creadit = cc.instantiate(GameViewController.viewRoot.goldTargetNode);
            creadit.position = this.node.convertToNodeSpaceAR(this.gameGridRoot.convertToWorldSpaceAR(pos));
            creadit.parent = this.generalFxRoot;
            creadit.scale = 0.8;
            return creadit;
        }
        let cb = (i)=>{
            this.scheduleOnce(() => {
                let creadit = f(pos);
                let targetPos = this.node.convertToNodeSpaceAR(this.objectiveSprite.convertToWorldSpaceAR(cc.Vec2.ZERO));
                cc.tween(creadit)
                    .delay(0.5)
                    .to(1, { position: cc.v3(targetPos.x, targetPos.y) })
                    .call(() => {
                        if (addNum - 1 == i) {
                            GameModel.increaseGold(tileNum)
                        }
                        LoadingScreen.playSfx("notificationSfx");
                        creadit.destroy();
                    })
                    .start()
            }, i * 0.1);
        }
        for (let i = 0; i < addNum; i++) {
            cb(i);
        }
    }

    /**设置空方块*/
    updateMatchedCellsData(row, col) {
        this.setCatUnitType(row, col, null);
        this.updateCatUnitVisuals(row, col, null);
    }

    /**最后一个 升级操作 */
    onFallAnimationComplete() {
        let f = ()=>{
            let gemItem = this.getCatUnitComponent(this.targetLocationData);
            let tileNum = this.getCatUnitType(this.targetLocationData);
            //当前消除 的值 
            let _numMax = tileNum + 1;
            gemItem.sparkleType(_numMax);
            this.setCatUnitType(this.targetLocationData, _numMax);
    
            if (GameModel.dispatchModelEvent.current_Big_Num < _numMax) {
                GameModel.dispatchModelEvent.current_Big_Num = _numMax;
                UIController.uiRootNode.toolSprite();
            }
    
            let numArr = GameModel.dispatchModelEvent.ListType;
    
            //看不懂什么意思
            if (tileNum > numArr[numArr.length - 1]) {
                if (_numMax - 5 >= 2) {
                    // this.getNumMapMinNum();
                    // 移除数组第一个元素
                    numArr.shift();
                }
                numArr.push(tileNum);
                GameModel.dispatchModelEvent.ListType = numArr;
            }
    
            gemItem.isAnimating = false;
            this.targetLocationData = null;
        }

        f();

        this.dropCells();
    }
    /**方块下落 */
    dropCells() {
        let f: Function[] = [];
        let fun = (f: Function[] = [])=>{
            for (let c = 0; c < GameViewController.columnCount; c++) {
                for (let r = 0; r < GameViewController.rowCount; r++) {
                    // 找到空位
                    if (!this.getCatUnitType(c, r)) {
                        // 往上找方块
                        for (let nr = r + 1; nr < GameViewController.rowCount; nr++) {
                            // 找到可以用的方块
                            if (this.getCatUnitType(c, nr)) {
                                // 转移数据
                                this.setCatUnitType(c, r, this.getCatUnitType(c, nr));
                                this.updateCatUnitVisuals(c, r, this.getCatUnitComponent(c, nr));
                                this.getCatUnitComponent(c, r).updateCoordinates(c, r);
                                // 置空
                                this.updateCatUnitVisuals(c, nr, null);
                                this.setCatUnitType(c, nr, null);
    
                                // 下落
                                let fallPos = GameModel.fetchCoordinates(c, r);
                                let fallTime = (nr - r) * 0.04;
    
                                f.push((a) => {
                                    this.getCatUnitComponent(c, r).node.stopAllActions();
                                    cc.tween(this.getCatUnitComponent(c, r).node)
                                        .to(fallTime, { position: fallPos })
                                        .call(() => {
                                            a();
                                        })
                                        .start();
                                })
    
    
                                break;
                            }
                        }
                    }
                }
            }
        }

        fun(f);

        let cur = 0;
        let total = f.length;
        if (total == 0) {
            this.populateEmptyCells();
        }
        else {
            for (let i = 0; i < f.length; i++) {
                f[i](() => {
                    cur++;
                    if (cur == total) {
                        this.populateEmptyCells();
                    }
                });
            }
        }
    }
    /**填充空位 */
    populateEmptyCells() {
        let comboNum = this.findCreationPoints();
        if (!comboNum) comboNum = GameModel.getDifferentNumber();
        let arr = [];
        let f = (c,r)=>{
            // 找到空位
            if (!this.getCatUnitType(c, r)) {
                arr.push([c, r]);
            }
        }
        for (let c = 0; c < GameViewController.columnCount; c++) {
            for (let r = 0; r < GameViewController.rowCount; r++) {
                f(c,r);
            }
        }

        this.postPopulationCheck(arr, comboNum);

    }
    postPopulationCheck(arr, comboNum) {
        let f = (i)=>{
            let col = arr[i][0];
            let row = arr[i][1];
            let num = 0;
            num = GameModel.getDifferentNumber();
            //疯狂连击设置 
            if (this.currentComboChain < this.nextComboChain && i <= 5) {
                num = comboNum;
            }
            let gemItem = GameModel.spawnCatUnit(col, row, num);
            this.updateCatUnitVisuals(col, row, gemItem)
            this.setCatUnitType(col, row, num);
            gemItem.node.setPosition(gemItem.node.x, 400);
            gemItem.node.stopAllActions();

            cc.tween(gemItem.node)
                .to(0.08, { position: GameModel.fetchCoordinates(col, row) })
                .call(() => {
                    if (arr.length - 1 === i) {
                        this.checkForPossibleMoves();
                        this.upgradeAllBasicUnits();
                    }
                })
                .start()
        }

        for (let i = 0; i < arr.length; i++) {
            f(i);
        }
    }
    /**这个方法 大概是用于 设置 疯狂连击 时候 需要设置的 值的 确定一个类型 然后填充 进列表的意思 */
    findCreationPoints(): number {
        let ran = ()=>{
            // 搜索上方颜色方块
            let arr: number[] = [];
            for (let i = 0; i < GameViewController.columnCount; i++) {
                if (this.cellNodeGrid[i][this.cellNodeGrid[i].length - 1]) continue;
                for (let k = this.cellNodeGrid[i].length; k > 0; k--) {
                    if (this.cellNodeGrid[i][k]) {
                        let num = this.cellNodeGrid[i][k].felineVariant;
                        if (num <= 5) {
                            arr.push(num);
                        }
                        break;
                    }
                }
            }
            return arr;
        }

        let arr: number[] = ran();
        /**随机返回数组里面的一个元素*/
        let ranAr = (arr: any[]) => {
            let n = Math.floor(Math.random() * arr.length + 1) - 1;
            return arr[n];
        }
        return arr.length == 0 ? GameModel.getDifferentNumber() : ranAr(arr);
    }
    
    /**检查可消除组合直到没有可以消除的组合 */
    private checkForPossibleMoves() {

        let cb = (arr, coord)=>{
            this.animateComboDisplay();
            this.processMatches(arr, coord);

        }

        for (let c = 0; c < GameViewController.columnCount; c++) {
            for (let r = 0; r < GameViewController.rowCount; r++) {
                let arr = new Array();
                let scanArr = new Array();
                let coord = this.cellNodeGrid[r][c].gridCoordinates;
                this.checkNeighborsForMatch(coord.xCoord, coord.yCoord, -1, -1, this.gridData[coord.xCoord][coord.yCoord], arr, scanArr);

                if (arr.length > 2) {
                    cb(arr, coord);
                    return;
                }
            }
        }

        this.handleNoMoves();
    }

    /**连击方法 */
    animateComboDisplay() {
        this.currentComboChain += 1;

        let f = () => {
            // 调整游戏进度
            if (this.currentComboChain == 5) {
                cc.director.getScheduler().setTimeScale(1.5);
            }
            if (this.currentComboChain == 10) {
                cc.director.getScheduler().setTimeScale(2);
            }

            if (this.currentComboChain < 9) {
                LoadingScreen.playSfx(`buttonSfx${this.currentComboChain}`);
            } else {
                LoadingScreen.playSfx(`buttonSfx9`);
            }

            if (this.comboFxRoot.getNumberOfRunningActions() > 0) {
                this.comboFxRoot.active = false;
                this.comboFxRoot.stopAllActions();
            }

            this.comboFxRoot.getChildByName("3").getComponent(cc.Label).string = `x${this.currentComboChain}`;
            this.comboFxRoot.scale = 0;
            this.comboFxRoot.active = true;
            this.comboFxRoot.stopAllActions();
            this.comboFxRoot.stopAllActions();

            cc.tween(this.comboFxRoot)
                .to(0.5, { scale: 1 }, { easing: 'backOut' })
                .delay(1)
                .call(() => {
                    this.comboFxRoot.active = false;
                })
                .start()
        }

        f();

      
    }

    handleNoMoves() {
        let createUnlockView = () => {
            let n = cc.instantiate(this.unlockPopup);
            n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
            n.setSiblingIndex(this.generalFxRoot.getSiblingIndex() - 1);
            n.getComponent(UnlockPopup).isInitialDisplay(GameModel.dispatchModelEvent.current_Big_Num);
        }
        // createUnlockView();
        // return;

        if (GameModel.dispatchModelEvent.unlockCount < GameModel.dispatchModelEvent.current_Big_Num) {
            GameModel.dispatchModelEvent.unlockCount = GameModel.dispatchModelEvent.current_Big_Num;
            createUnlockView();
        }
        else {
            //这个是猫罐头 执行逻辑（移除了）
            // this.completeAnimationAndReward();

            // 新增结算需要操作！！！！！
            WorkerCtrl.instance.endClac();
        }


        if (this.currentComboChain >= 10) {
            UIController.uiRootNode.ultimateEffect();
        }

        this.currentComboChain = 1;
        cc.director.getScheduler().setTimeScale(1);
        // 计算下一轮连击数
        this.generateRandomChain();
        // tips
        GameViewController.areCellsAnimating = false;
        this.inputBlocker.active = false;
    }

    /**获取全场最小的数字做+1处理  */
    public upgradeAllBasicUnits() {
        let _min = GameModel.dispatchModelEvent.ListType[0];
        let _temp = _min;


        let f = (r, c, _temp)=>{
            let star = cc.instantiate(this.levelUpFx);
            star.position = GameModel.fetchCoordinates(r, c);
            star.y += this.gameGridRoot.y;
    
            star.scale = 1.5;
            star.parent = this.generalFxRoot;
    
            let spp = star.getComponent(sp.Skeleton);
            let sppT: sp.spine.TrackEntry = spp.setAnimation(0, "up", false);
            spp.setTrackCompleteListener(sppT, (entry: sp.spine.TrackEntry, loopCount: number) => {
                star.destroy();
            })
    
            this.setCatUnitType(r, c, _temp);
            this.cellNodeGrid[r][c].sparkleType(_temp);
        }


        for (let r = 0; r < GameViewController.rowCount; r++) {
            for (let c = 0; c < GameViewController.columnCount; c++) {
                let num = this.gridData[r][c];
                if (num == _min - 1) {
                    f(r, c, _temp);
                }
            }
        }
    }


    static spawnSpecialUnit = [6, 8];
    // 连击奖励
    completeAnimationAndReward() {
        // console.log("comboX", this.playerComboSet, "Award");
        
        let random = GameModel.generateRandomInt(GameViewController.spawnSpecialUnit[0],GameViewController.spawnSpecialUnit[1]);
        if (this.currentComboChain >= random) {
            this.scheduleOnce(() => {
                //TODO
                // ConveyorController.mainAnchor.enqueueElement();
            }, 0.5)
            return;
        }
        

        // if (this.nowComboCount >= CatViewCtrl.rewardFirst) {
        //     this.scheduleOnce(() => {
        //         CatCtrl.base.add();
        //     }, 0.5)
        //     return;
        // }

        // if (this.nowComboCount >= CatViewCtrl.rewardSecond) {
        //     this.scheduleOnce(() => {
        //         CatCtrl.base.add();
        //     }, 0.5)
        // }
    }

    ///////////////////////道具在下面
    private upgradeCatUnit: FelineUnit = null;

    /**数字加1 按钮使用 重新绑定 */
    handleLevelUpAction() {
        LoadingScreen.onButtonPress();

        // GameModel.GridPosition(403, GameModel.dispatchModelEvent.upTool + "");

        if (GameViewController.areCellsAnimating) return;
        if (GameViewController.isLevelingUp) {
            this.executeLevelUp();
        }
        else {
            this.startLevelUpSequence();
        }
    }

    executeLevelUp() {
        GameViewController.isLevelingUp = false;
        this.upgradeCatUnit.displayTierIcon(false);
        this.upgradeCatUnit = null;
        this.displayTutorialPointer.active = false;
        if (this.damageCatUnit) {
            GameViewController.isDamaging = false;
            this.damageCatUnit.displayHitIcon(false);
            this.displayDamageSelector.active = false;
            this.damageCatUnit = null;
        }
    }

    startLevelUpSequence() {
        let f1=()=>{
            GameViewController.areCellsAnimating = true;
            if (this.damageCatUnit) {
                GameViewController.isDamaging = false;
                this.damageCatUnit.displayHitIcon(false);
                this.displayDamageSelector.active = false;
                this.damageCatUnit = null;
            }

            // 随机一个方块
            let c = GameModel.generateRandomInt(0, 4);
            let r = GameModel.generateRandomInt(0, 4);

            let gemItem: FelineUnit = this.cellNodeGrid[c][r];
            gemItem.displayTierIcon(true);
            this.upgradeCatUnit = gemItem;

            let pos = GameModel.fetchCoordinates(gemItem.gridCoordinates);
            this.displayTutorialPointer.position = cc.v3(pos.x + 10, pos.y - 40);
            this.displayTutorialPointer.active = true;

            GameViewController.isLevelingUp = true;
            GameViewController.isDamaging = false;
        }

        let f2 =()=>{
            let n = cc.instantiate(this.toolPanel);
            n.getComponent(ToolView).refreshDisplay(1);
            n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
        }

        GameModel.GridPosition(409);

        if (GameModel.dispatchModelEvent.upTool > 0) {
            f1();
        }
        else {
            f2();
        }
    }

    private damageCatUnit: FelineUnit = null;
    /**消除单个 按钮使用 重新绑定*/
    handleDamageAction() {
        LoadingScreen.onButtonPress();
        // GameModel.GridPosition(406,GameModel.dispatchModelEvent.harmTool + "");

        if (GameViewController.areCellsAnimating) return;
        if (GameViewController.isDamaging) {
            this.executeDamage();
        }
        else {
            this.startDamageSequence();
        }
    }
    executeDamage() {
        GameViewController.isDamaging = false;
        this.damageCatUnit.displayHitIcon(false);
        this.damageCatUnit = null;
        this.displayDamageSelector.active = false;

        if (this.upgradeCatUnit) {
            GameViewController.isLevelingUp = false;
            this.upgradeCatUnit.displayTierIcon(false);
            this.upgradeCatUnit = null;
            this.displayTutorialPointer.active = false;
        }
    }
    startDamageSequence() {
        let f1 = ()=>{
            GameViewController.areCellsAnimating = true;
            if (this.upgradeCatUnit) {
                GameViewController.isLevelingUp = false;
                this.upgradeCatUnit.displayTierIcon(false);
                this.upgradeCatUnit = null;
                this.displayTutorialPointer.active = false;
            }
            // 随机一个方块
            let c = GameModel.generateRandomInt(0, 4);
            let r = GameModel.generateRandomInt(0, 4);

            let gemItem: FelineUnit = this.cellNodeGrid[c][r];
            gemItem.displayHitIcon(true);
            this.damageCatUnit = gemItem;

            let pos = GameModel.fetchCoordinates(gemItem.gridCoordinates);
            this.displayDamageSelector.position = cc.v3(pos.x, pos.y);
            this.displayDamageSelector.active = true;

            GameViewController.isDamaging = true;
        }

        let f2 = ()=>{
            let n = cc.instantiate(this.toolPanel);
            n.getComponent(ToolView).refreshDisplay(3);
            n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
        }

        if (GameModel.dispatchModelEvent.harmTool > 0) {
            f1();
        }
        else {
            f2();
        }
    }

    /**交换 按钮使用 重新绑定*/
    handleFlashTool() {
        // GameModel.GridPosition(405);

        LoadingScreen.onButtonPress();

        GameModel.GridPosition(407);
        
        let f1 = () => {
            GameViewController.areCellsAnimating = true;
            if (this.upgradeCatUnit) {
                GameViewController.isLevelingUp = false;
                this.upgradeCatUnit.displayTierIcon(false);
                this.upgradeCatUnit = null;
                this.displayTutorialPointer.active = false;
            }

            if (this.damageCatUnit) {
                GameViewController.isDamaging = false;
                this.damageCatUnit.displayHitIcon(false);
                this.displayDamageSelector.active = false;
                this.damageCatUnit = null;
            }
            GameModel.dispatchModelEvent.flashTool -= 1;
            UIController.uiRootNode.toolQuantity();

            let _arr = this.cellNodeGrid[0].concat(this.cellNodeGrid[1]).concat(this.cellNodeGrid[2]).concat(this.cellNodeGrid[3]).concat(this.cellNodeGrid[4]);

            /*数组随机排列*/
            let rlist = (arr: any[]) => {
                let i = arr.length;
                while (i) {
                    let j = Math.floor(Math.random() * i--);
                    [arr[j], arr[i]] = [arr[i], arr[j]];
                };
            }

            rlist(_arr);

            let i = 0;
            this.cellNodeGrid = [];
            this.gridData = [];

            // LoadingScreen.playSfx("toolUseSfx");
            for (let r = 0; r < GameViewController.rowCount; r++) {
                let colTileSet: FelineUnit[] = [];
                let numSet: number[] = [];
                for (let c = 0; c < GameViewController.rowCount; c++) {
                    colTileSet.push(_arr[i]);
                    numSet.push(_arr[i].felineVariant);

                    _arr[i].updateCoordinates(r, c);
                    _arr[i].node.stopAllActions();
                    cc.tween(_arr[i].node)
                        .to(0.2, { position: GameModel.fetchCoordinates(r, c) })
                        .start();
                    i++;
                }
                this.cellNodeGrid.push(colTileSet);
                this.gridData.push(numSet);
            }
            GameModel.dispatchModelEvent.Map_Game = this.gridData;

            this.inputBlocker.active = true;
            this.checkForPossibleMoves();
        }

        let f2 = () => {
            let n = cc.instantiate(this.toolPanel);
            n.getComponent(ToolView).refreshDisplay(2);
            n.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
        }

        if (GameViewController.areCellsAnimating) return;
        if (GameModel.dispatchModelEvent.flashTool > 0) {
            UIController.uiRootNode.windEff(() => { f1() })
        GameModel.GridPosition(408);

            // f1();
            // GameModel.GridPosition(405, (GameModel.dispatchModelEvent.flashTool - 1) + "");
        }
        else {
            f2();
        }
    }

 
}

/**坐标 */
export class PosMsg {
    //已修改
    /**横坐标 */
    public xCoord: number;
    /**纵坐标 */
    public yCoord: number;
    /**构造函数 */
    constructor(x: number = 0, y: number = 0) {
        this.xCoord = x;
        this.yCoord = y;
    }
    /**更新赋值 */
    public updateData(x: number | PosMsg, y?: number) {
        if (typeof x === 'number') {
            this.xCoord = x;
            this.yCoord = y;
        } else {
            this.xCoord = x.xCoord;
            this.yCoord = x.yCoord;
        }
    }
    /**复制 */
    public cloneData(): PosMsg {
        let a = new PosMsg(this.xCoord, this.yCoord);
        return a;
    }
    /**对比 */
    public isEqualTo(x: number | PosMsg, y?: number): boolean {
        if (typeof x === 'number') {
            if (this.xCoord === x && this.yCoord === y) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            if (this.xCoord === x.xCoord && this.yCoord === x.yCoord) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    /**是否相邻 */
    public isAdjacent(coord: PosMsg): boolean {
        if (this.xCoord === coord.xCoord) {
            if (this.yCoord === coord.yCoord + 1 || this.yCoord === coord.yCoord - 1) {
                return true;
            }
            else {
                return false;
            }
        }
        else if (this.yCoord === coord.yCoord) {
            if (this.xCoord === coord.xCoord + 1 || this.xCoord === coord.xCoord - 1) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
}
