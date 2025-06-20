import FelineUnit from "./FelineUnit";
import LoadingScreen from "./LoadingScreen";
import GameViewController, { PosMsg } from "./GameViewController";
import FrameworkBridge from "./FrameworkBridge";
// import FrameworkBridge from "./FrameworkBridge";

export default class GameModel {
    static dispatchModelEvent = {
        eff_On: true,
        music_On: true,
        shake_On: true,
  
        /**金币数量 */
        gold: 0,

        /**道具升级数量 */
        upTool: 1,   
        /**刷新道具数量 */ 
        flashTool: 1,
        /**锤子道具数量 */
        harmTool: 1, 

        /**玩家数据分数 */
        scorePlayer: 0,
        /**解锁数字 */
        unlockCount: 5,
        /**本局最高数字 */
        current_Big_Num: 5,   
        /**这个存储的是 盘面 存在的所有类型的意思 */
        ListType: [1, 2, 3, 4, 5],// 继续用户当前数组
        /**棋盘数组 */
        Map_Game: [
            [1, 5, 5, 5, 1],
            [5, 3, 4, 3, 5],
            [5, 4, 2, 4, 5],
            [5, 3, 4, 3, 5],
            [1, 5, 5, 5, 1],
        ], 

        /**当前使用下标 */
        bgIndex: 0,
        /**当前拥有下标 */
        bgList: [1, 0, 0, 0],
        
        /**引导变量0开始 要做的 */
        haveGuide: false,
        /**引导步数 */
        guideNum: 1,

        eventMsg:{},

     
    }

    /**加减游戏货币 */
    static increaseGold(change: number = 0) {
        GameModel.dispatchModelEvent.gold += change;
        cc.director.emit("goldAdd", change);
        LoadingScreen.saveGameData();
    }

    // 返回坐标
    public static fetchCoordinates(x: number | PosMsg, y?: number): cc.Vec3 {
        if (typeof x === 'number') {
            return GameViewController.cellLocationGrid[x][y];
        }
        else {
            return GameViewController.cellLocationGrid[x.xCoord][x.yCoord];
        }
    }

    /** 初始化 */
    public static isInitialAction() {
        /**生成位置表 */
        let padding = GameViewController.gridPadding;
        let size = GameViewController.cellSize;
        let col = GameViewController.columnCount;
        let row = GameViewController.rowCount;
        let deltaWidth = GameViewController.cellSpacing;

        // 计算宽高
        let totalWidth = (padding * 2) + (size * col) + (deltaWidth * (col - 1));
        let totalHeight = (padding * 2) + (size * row) + (deltaWidth * (row - 1));

        // 以左下角为原点，计算第一个方块的位置
        let startXPos = -(totalWidth / 2) + padding + (size / 2);
        let startPosY = -(totalHeight / 2) + padding + (size / 2);

        // 计算所有方块的位置
        // 从左到右计算每一列方块的位置
        let positionMapArray = [];
        for (let c = 0; c < col; c++) {
            let colSet = [];
            let x = startXPos + c * (size + deltaWidth);
            // 从下到上计算该列的每一个方块的位置
            for (let r = 0; r < row; r++) {
                let y = startPosY + r * (size + deltaWidth);
                colSet.push(cc.v2(x, y));
            }
            positionMapArray.push(colSet);
        }

        return positionMapArray;
    }

    /**返回出去一个数字（可以组成消除组合） */
    public static getDifferentNumber(exclude: number[] = []) {
        let arr = GameModel.dispatchModelEvent.ListType;
        let nums = arr.concat();
        for (let i = 0; i < exclude.length; i++) {
            nums.splice(nums.indexOf(exclude[i]), 1);
        }
        return nums[Math.floor(nums.length * Math.random())];
    };

    public static retrievePositionInfo(x: number = 0, y: number = 0) {
        let a = new PosMsg(x, y);
        return a;
    }

    //随机一个整数范围内 [3,5] -> 3、4、5
    public static generateRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**是否有可一步消除的组合 */
    public static hasPossibleMerge(map: number[][]) {
        for (let r = 0; r < GameViewController.rowCount; r++) {
            for (let c = 0; c < GameViewController.columnCount; c++) {
                if (c + 1 < GameViewController.columnCount) {
                    if (map[c][r] == map[c + 1][r]) {
                        if (map[c][r] == map[c][r + 1]) {
                            return false;
                        }
                    }

                    if (map[c][r] == map[c + 1][r]) {
                        if (map[c][r] == map[c + 1][r + 1]) {
                            return false;
                        }
                    }

                    if (r >= 1) {
                        if (map[c][r] == map[c + 1][r]) {
                            if (map[c][r] == map[c][r - 1]) {
                                return false;
                            }
                        }
                        if (map[c][r] == map[c + 1][r]) {
                            if (map[c][r] == map[c + 1][r - 1]) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
            return true;
    }

    /**获取初始化类型表 （数字） */
    public static generateArray(): number[][] {
        let numMap: number[][] = [];
        for (let c = 0; c < GameViewController.columnCount; c++) {
            let colSet: number[] = [];
            for (let r = 0; r < GameViewController.rowCount; r++) {
                let excludenums = [];

                // 水平检测前面 2 个相同类型
                let rownum: number = null;
                if (c > 1 && numMap[c - 1][r] === numMap[c - 2][r]) {
                    rownum = numMap[c - 1][r];
                }
                if (rownum) {
                    excludenums.push(rownum);
                }

                // 垂直检测下面 2 个相同类型
                let colnum: number = null;
                if (r > 1 && colSet[r - 1] === colSet[r - 2]) {
                    colnum = colSet[r - 1];
                }
                if (colnum) {
                    excludenums.push(colnum);
                }
                // 添加可用的随机类型
                colSet.push(GameModel.getDifferentNumber(excludenums));
            }
            numMap.push(colSet);
        }
        return numMap;
    }

    /**生成并初始化方块*/
    public static spawnCatUnit(x: number, y: number, num: number) {
        let node = cc.instantiate(GameViewController.viewRoot.catUnitPrefab);
        let gemItem = node.getComponent(FelineUnit);
        gemItem.isInitialRun();
        gemItem.updateCoordinates(x, y);
        gemItem.sparkleType(num);
        node.stopAllActions();
        node.scale = 1;
        node.setPosition(GameModel.fetchCoordinates(x, y));
        node.setParent(GameViewController.viewRoot.gameGridRoot);
        return gemItem;
    }

    //游戏重来 重置数据
    static resetGameplayState() {
        GameModel.dispatchModelEvent.ListType = [1, 2, 3, 4, 5];
        GameModel.dispatchModelEvent.current_Big_Num = 5;
        GameModel.dispatchModelEvent.Map_Game = [];
        GameModel.dispatchModelEvent.scorePlayer = 0;
        GameModel.dispatchModelEvent.unlockCount = 5;
    }


    // "into_game": "into_game",//进入游戏
    // "start_game": "start_game",//开始游戏
    // "first_ad": "first_ad",//看第一次广告【以show的回调为准】
    // static lifeEvent(type) {
    //     if (CatModel.CatMessage.eventMsg[type] == null) {
    //         CatModel.CatMessage.eventMsg[type] = type;
    //         let key1 = "game_life_key_node";
    //         CatFrameSDK.lifeEvent(key1, { "step": type });
    //         LoadingVIew.safeData();
    //     }
    // }

    /**只在A面使用的变量 用于UI设置（A面是否有视频的意思）*/
    static applyVideoBonus: boolean = true;

    public static triggerInterstitialAd(cb: Function) {
        if(GameModel.applyVideoBonus == false){
            cb();
            return;
        }
        if (!cc.sys.isNative || FrameworkBridge.isVideoConcealed || FrameworkBridge.sdkLoadStatus == null || FrameworkBridge.sdkLoadStatus == false ) {
            if (cb) {
                cb();
            }
            return;
        }
        FrameworkBridge.presentInterstitial((result) => {
            if (cb) {
                cb(result);
            }
        });
    }

    public static triggerVideoAd(suc: Function, fail: Function) {
        if (GameModel.applyVideoBonus == false ) {
            suc();
            return;
        }

        let all = () => {
            if (!cc.sys.isNative || FrameworkBridge.isVideoConcealed == true) {
                if (suc) {
                    suc();
                }
                return;
            }
            FrameworkBridge.presentVideoAd((result: string) => {
                if (result == "suc") {
                    if (suc) {
                        suc();
                    }
                } else {
                    if (fail) {
                        fail();
                    }
                }
            });
        };

        if (FrameworkBridge.sdkLoadStatus == true ) {
            all();
        } else {
            LoadingScreen.loadingViewRoot.displayVideoPrompt(all,fail);
        }
    }


    /**showBanner */
    public static triggerBannerAd() {
        let isPad = GameModel.isTabletLayout();
        let obj: { x: number, y: number, w: number, h: number } = { x: 0, y: 0, w: 0, h: 0 };
        if(isPad == true){
            obj.h = 90;
        }
        else{
            obj.h = 50;
        }
        obj.x = 0;
        obj.y = cc.view.getFrameSize().height - obj.h;
        obj.w = cc.view.getFrameSize().width;
        FrameworkBridge.revealBannerAd(obj);
    }


    //jsb
    static linkedObject = {
        IGLANUMBER_GCJU: "IGlanumberSpecies", //原方法是:      IGameCocosBridge
        GCJURendererNetmail: "iFunctionIglanumberPutIn", //原方法是:      func_igame_bridge_isDebugDevTestHost
        GCJURendererCreep: "iFunctionIglanumberActualize", //原方法是:      func_igame_bridge_isDebugDevBundleID
        GCJURendererSpam: "iFunctionIglanumberDie", //原方法是:      func_igame_bridge_isDebugDevEnvironment
        GCJURendererDecompress: "iFunctionIglanumberNotice:gcjuCrossLayerCull:", //原方法是:      func_igame_bridge_debugLogWithMsg:debugLogExtParam:
        GCJURendererSwank: "iFunctionIglanumberMark:gcjuCrossLayerStyle:", //原方法是:      func_igame_bridge_debugHudWithMsg:debugHudExtParam:
        GCJURendererEmail: "iFunctionIglanumberEncrust", //原方法是:      func_igame_bridge_isCurrentInVipMode
        GCJURendererMoon: "iFunctionIglanumberLineUp", //原方法是:      func_igame_bridge_language
        GCJURendererReconstruct: "iFunctionIglanumberFlaunt", //原方法是:      func_igame_bridge_version
        GCJURendererStag: "iFunctionIglanumberGuess", //原方法是:      func_igame_bridge_isIPad
        GCJURendererHoldup: "iFunctionIglanumberBarde:gcjuCrossLayerErect:", //原方法是:      func_igame_bridge_shakeWithMillisecond:shakeExtParam:
        GCJURendererEmail2: "iFunctionIglanumberRenovate:gcjuCrossLayerMusterup:", //原方法是:      func_igame_bridge_openURL:urlParamExtParam:
        GCJURendererProduce: "iFunctionIglanumberIdealize:gcjuCrossLayerTrim:", //原方法是:      func_igame_bridge_savePhotoWithPath:funcExtParam:
        GCJURendererReinstate: "iFunctionIglanumberIdealise:gcjuCrossLayerReckon:", //原方法是:      func_igame_bridge_copyTextToPasteboard:actionExtParam:
        GCJURendererSit: "iFunctionIglanumberTryOut:gcjuCrossLayerSet:", //原方法是:      func_igame_bridge_cocosInitConfig:initExtParam:
        GCJURendererNet: "iFunctionIglanumberWord:gcjuCrossLayerBetter:", //原方法是:      func_igame_bridge_cocosNewAppVersionConfig:appverExtParam:
        GCJURendererBrandish: "iFunctionIglanumberPickApart:gcjuCrossLayerSledge:", //原方法是:      func_igame_bridge_cocosNewAppVersionClickWithType:btnExtParam:
        GCJURendererShowoff: "iFunctionIglanumberBroider:gcjuCrossLayerDoctor:", //原方法是:      func_igame_bridge_sdyLogWithType:logExtParam:
        GCJURendererNetwork: "iFunctionIglanumberSearch", //原方法是:      func_igame_bridge_wwyInvitationCode
        GCJURendererPower: "iFunctionIglanumberRate:gcjuCrossLayerCampaign:", //原方法是:      func_igame_bridge_wwyAttributionReady:attributesExtParam:
        GCJURendererRehabilitate: "iFunctionIglanumberFigure:gcjuCrossLayerRelieve:gcjuCrossLayerAssay:", //原方法是:      func_igame_bridge_wwyShowADWithType:adJSFuncExtParam:bannerRectExtParam:
        GCJURendererFlaunt: "iFunctionIglanumberDream", //原方法是:      func_igame_bridge_screenTopBottomSafeSize
        GCJURendererPosture: "iFunctionIglanumberValue:gcjuCrossLayerConstruct:", //原方法是:      func_igame_bridge_wwyHideBannerADWithType:adExtParam:
        GCJURendererUncompress: "iFunctionIglanumberFoliate:gcjuCrossLayerLock:", //原方法是:      func_igame_bridge_adEvenClickWithPoint:adEvenExtParam:
        GCJURendererPussyfoot: "iFunctionIglanumberCustomize:gcjuCrossLayerStandardize:", //原方法是:      func_igame_wwyEventWithType:wwyLogExtParam:
        GCJURendererDocument: "iFunctionIglanumberSee:gcjuCrossLayerFume:", //原方法是:      func_igame_wwyCocosCommonuseEventWithEvenName:logJsonExtParam:
    }

    /**是否是ipad*/
    static isTabletLayout():boolean {
        let ispad = false;
        if (cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) {
            ispad = jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererStag);
        }
        return ispad;
    }

    static initiateShake(time) {
        if (GameModel.dispatchModelEvent.shake_On == false) {
            return;
        }
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererHoldup, time, "");
        }
    }
    //openUrl
    static presentWebLink(link: string) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererEmail2, link, "");
        }
        else {
            cc.sys.openURL(link);
        }
    }

    //埋点（轩）
    public static GridPosition(type, value = null) {
        // console.log(type+"      "+value);
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererShowoff, type, value);
        }
    }

    //life
    /**wwy事件 */
    public static dispatchGenericEvent(str, value = null) {
        // console.log(type+"      "+value);
        // CatModel.logShow(str);
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererDocument, str, value);
        }
    }
    ////////////////////////
    /**原 createCCC */
    static spawnCoreComponent(str: string) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererSit, str, "");
        }
    }

    /**IOS LOG 输出 */
    static recordDisplayEvent(msg: string) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererDecompress, msg, "");
            console.log(msg,"````````````````````");
        }
        else{
            console.log(msg,"````````````````````");
        }
    }

    static retrieveAppVersion() {
        let game_version = "1.0.0";
        if (cc.sys.os == cc.sys.OS_IOS) {
           
            game_version = jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererReconstruct);
        }
        if(game_version == null){
            game_version = "err";
        }
        LoadingScreen.APP_VERSION = game_version;
    }

    //SDK相关
    //邀请码
    static retrieveInviteCode(){
        if(cc.sys.os == cc.sys.OS_IOS){
           return jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererNetwork);
        }
        else {
            return "";
        }
    }

    //监听归因(传方法 返回的参数含义如下)
    ///   0：关闭
    ///   1：开启
    ///   2：获取失败（超过5s自动返回失败，cocos就当是默认”关闭“处理，不能进去B面）
    static performLogin(str: string){
        if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererPower, str, "");
        }
    }


    //展示视频(传方法 返回的参数含义如下)
    //cb 回调（回参）
    // typedef NS_ENUM(NSInteger,IGameADStstusType) {
    //     IGameADStstusType_NotInit             = 0, // sdk未初始化（cocos直接显示失败就好）
    //     IGameADStstusType_NotReady            = 1, // 广告正在“预加载”中，还没有结果，等有结果了，会再调用一次cocos方法
    //     IGameADStstusType_DidLoadAdFail       = 2, // 广告"预加载"失败，没有广告源（cocos直接显示失败就好）
    //     IGameADStstusType_DidLoadAdSuccess    = 3, // 广告"预加载"好了,可以随时展示
    //     IGameADStstusType_DidDisplayAd        = 4, // 展示广告-成功
    //     IGameADStstusType_DidFailToDisplayAd  = 5, // 展示广告-失败
    //     IGameADStstusType_DidClickAd          = 6, // 点击广告
    //     IGameADStstusType_DidHideAd           = 7, // 隐藏广告(相当于是广告结束)
    //     IGameADStstusType_DidRewardUserForAd  = 8, // 发放奖励（只有激励广告有）
    // };
    //videoType
    // typedef NS_ENUM(NSInteger,IGameADType) {
    //     IGameADType_Reward         = 0,        // 激励广告
    //     IGameADType_Interstitial   = 1,        // 插屏广告
    //     IGameADType_Open           = 2         // 开屏广告（暂时没接入）
    //     IGameADType_Banner         = 3         // Banner广告（暂时没接入）
    // };
    static executeVideoAd(videoType: number, cb: string,jsonString:string = "") {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererRehabilitate, videoType, cb,jsonString);
        }
    }
    /// 隐藏广告（只针对Banner）
    static dismissBannerAd(type:number = 3,value:string = ""){
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererPosture, type, value);
        }
    }

    /// 针对applovin广告的虚拟点击（Banner、插屏、激励）
    static onBannerInteraction(jsonString:string = "",value:string = ""){
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererUncompress, jsonString, value);
        }
    }

    //pp打点
    // typedef NS_ENUM(NSInteger,IGAMEActivitysType){
    //     IGAMEActivitysType_gameOn                   = 3,        // 【归因开关】游戏接收到“风险开关”-开启
    //     IGAMEActivitysType_gameOff                  = 4,        // 【归因开关】游戏接收到“风险开关”-关闭
    //     IGAMEActivitysType_stuff_homepage           = 5,        // pp卡卡槽展示（进入到游戏主页的时候打）
    //     IGAMEActivitysType_stuff_impression         = 6,        // pp卡弹窗展示
    //     IGAMEActivitysType_stuff_click              = 7,        // pp卡点击领取
    //     IGAMEActivitysType_stuff_getSuccess         = 8,        // pp卡领取成功
    //     IGAMEActivitysType_stuff_impressionFree     = 9,        // pp卡免费奖励展示
    //     IGAMEActivitysType_stuff_clickFree          = 10,        // pp卡免费奖励点击
    //     IGAMEActivitysType_stuff_getSuccessFree     = 11        // pp卡免费奖励领取成功
    // };
    static emitPowerData(num: number) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.GCJURendererPussyfoot, num, "");
        }
    }

  
    // kFunc_cocosNewAppVersionConfig: "funcIktmerge_cube:value:",
    // kFunc_cocosNewAppVersionClickWithType: "funcIktmerge_sift:value:",
    //预留借口
    // static versionSettings(des:string,value:string){
    //     if (cc.sys.os == cc.sys.OS_IOS) {
    //         jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.kFunc_cocosNewAppVersionConfig, des, value);
    //     }
    // }

    // static logVersionClick(type:number,value:string){
    //     if (cc.sys.os == cc.sys.OS_IOS) {
    //         jsb.reflection.callStaticMethod(GameModel.linkedObject.IGLANUMBER_GCJU, GameModel.linkedObject.kFunc_cocosNewAppVersionClickWithType, type, value);
    //     }
    // }

}
cc.js.setClassName("GameModel", GameModel);



