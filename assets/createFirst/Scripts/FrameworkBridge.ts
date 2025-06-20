import GameModel from "./GameModel";
import LoadingScreen from "./LoadingScreen";

export default class FrameworkBridge {
    /**flag 变量 */
    public static sdkLoadStatus: boolean = null;
    /**关闭广告变量 */
    public static isVideoConcealed: boolean = false;

    /**flag 事件发送 */
    public static triggerLoadEvent() {
        cc.director.emit("iglaLoadEvent", FrameworkBridge.sdkLoadStatus);
    }

    /**视频成功 事件 */
    public static emitVideoEvent() {
        cc.director.emit("videoEventSend");
    }

    public static setupSdk(cb: Function) {
        GameModel.performLogin(`cc.js.getClassByName('FrameworkBridge').addSdkObserver`);
        cb();
    }

    /**参数返回 suc fail */
    public static videoAdHandler: (result: string) => void = null;
    /**参数返回 suc fail */
    public static interstitialHandler: (result: string) => void = null;

    public static bannerAdHandler: (result: string) => void = null;

    public static isInterstitialCached(){
        //记得修改 虽然没用
        return 0;
    }

    /**插屏播放 */
    public static presentInterstitial(cb: (result: string) => void) {
        LoadingScreen.loadingViewRoot.displayLoadingSpinner();
        FrameworkBridge.interstitialHandler = cb;
        GameModel.executeVideoAd(1,`cc.js.getClassByName('FrameworkBridge').invokeInterstitialCallback`);
    }

    /**视频是否完成 */
    static handleVideoCompletion: boolean = false;
    /**参数返回 suc fail */
    public static presentVideoAd(cb: (result: string) => void) {
        LoadingScreen.loadingViewRoot.displayLoadingSpinner();
        FrameworkBridge.handleVideoCompletion = false;
        FrameworkBridge.videoAdHandler = cb;
        GameModel.executeVideoAd(0,`cc.js.getClassByName('FrameworkBridge').invokeVideoCallback`);
    }

    public static revealBannerAd(obj: { x: number, y: number, w: number, h: number }, cb: (result: string) => void = () => { }) {
        FrameworkBridge.bannerAdHandler = cb;
        GameModel.executeVideoAd(3, `cc.js.getClassByName('FrameworkBridge').invokeBannerCallback`, JSON.stringify(obj));
    }

    public static concealBannerAd(type:number = 3,value:string = ""){
        GameModel.dismissBannerAd(type, value);
    }

    public static triggerBannerClick(obj:{x:number,y:number},value:string = ""){
        GameModel.onBannerInteraction(JSON.stringify(obj), value);
    }

 
    static sdkSignalForward = {videoAdHandler:function () {},interAdHandler:function () {}};

    /**WWY事件上报 */
    public static trackGenericAction(eventName: string, properties: { [key: string]: any } = null) {
        GameModel.dispatchGenericEvent(eventName,JSON.stringify(properties));
    }



    //下面的是接入
    public static addSdkObserver(loginType: string) {
        if (Number(loginType) == 0) {
            FrameworkBridge.sdkLoadStatus = false;
            GameModel.emitPowerData(4);
        }
        if(Number(loginType) == 1){
            FrameworkBridge.sdkLoadStatus = true;
            GameModel.emitPowerData(3);
        }
        if(Number(loginType) == 2){
            FrameworkBridge.sdkLoadStatus = false;
            GameModel.emitPowerData(4);
        }
        FrameworkBridge.triggerLoadEvent();
    }

    //     IGameADStstusType_NotInit             = 0, // sdk未初始化（cocos直接显示失败就好）
    //     IGameADStstusType_NotReady            = 1, // 广告正在“预加载”中，还没有结果，等有结果了，会再调用一次cocos方法
    //     IGameADStstusType_DidLoadAdFail       = 2, // 广告"预加载"失败，没有广告源（cocos直接显示失败就好）
    //     IGameADStstusType_DidLoadAdSuccess    = 3, // 广告"预加载"好了,可以随时展示
    //     IGameADStstusType_DidDisplayAd        = 4, // 展示广告-成功
    //     IGameADStstusType_DidFailToDisplayAd  = 5, // 展示广告-失败
    //     IGameADStstusType_DidClickAd          = 6, // 点击广告
    //     IGameADStstusType_DidHideAd           = 7, // 隐藏广告(相当于是广告结束)
    // //     IGameADStstusType_DidRewardUserForAd  = 8, // 发放奖励（只有激励广告有）
    public static invokeVideoCallback(type:number){

        GameModel.recordDisplayEvent("vcb:   " + type);
        let failRun = ()=>{
            cc.audioEngine.setMusicVolume(1);
            cc.audioEngine.setEffectsVolume(1);
            LoadingScreen.loadingViewRoot.concealLoadingSpinner();
            LoadingScreen.loadingViewRoot.displayNotification("Advertisement load failed, please wait");
            if(FrameworkBridge.videoAdHandler){
                FrameworkBridge.videoAdHandler('fail');
                FrameworkBridge.videoAdHandler = null;
            }
        }
        let sucRun = ()=>{
            cc.audioEngine.setMusicVolume(1);
            cc.audioEngine.setEffectsVolume(1);
            LoadingScreen.loadingViewRoot.concealLoadingSpinner();
            if(FrameworkBridge.videoAdHandler){
                FrameworkBridge.videoAdHandler('suc');
                FrameworkBridge.videoAdHandler = null;
            }
        }

        if(Number(type) == 0){
            //失败回调
            failRun();
        }
        if(Number(type) == 1){
            //等待不处理
        }
        if(Number(type) == 2){
            //失败回调
            failRun();
        }
        if(Number(type) == 3){
            //等待不处理
        }
        if(Number(type) == 4){

            FrameworkBridge.sdkSignalForward.videoAdHandler();
            //等待 处理音效（事件first_ad?）
            cc.audioEngine.setMusicVolume(0);
            cc.audioEngine.setEffectsVolume(0);
            // CatModel.lifeEvent("first_ad");
        }
        if(Number(type) == 5){
            failRun();
        }
        if(Number(type) == 6){
            //点击不用处理
        }
        if(Number(type) == 7){
            //关闭 广告情况（声音 回调）
            if(FrameworkBridge.handleVideoCompletion){
                sucRun();
            }
            else{
                failRun();
            }
        }
        if(Number(type) == 8){
            FrameworkBridge.handleVideoCompletion = true;
            sucRun();
        }
    }

    public static invokeInterstitialCallback(type:number){
        GameModel.recordDisplayEvent("icb:   " + type);

        let failRun = ()=>{
            cc.audioEngine.setMusicVolume(1);
            cc.audioEngine.setEffectsVolume(1);
            LoadingScreen.loadingViewRoot.concealLoadingSpinner();
            // InitializationCtrl.instance.showLogicTip("Advertisement load failed, please wait");
            if(FrameworkBridge.interstitialHandler){
                FrameworkBridge.interstitialHandler('fail');
                FrameworkBridge.interstitialHandler = null;
            }
        }
        let sucRun = ()=>{
            cc.audioEngine.setMusicVolume(1);
            cc.audioEngine.setEffectsVolume(1);
            LoadingScreen.loadingViewRoot.concealLoadingSpinner();
            if(FrameworkBridge.interstitialHandler){
                FrameworkBridge.interstitialHandler('suc');
                FrameworkBridge.interstitialHandler = null;
            }
        }

        if(Number(type) == 0){
           failRun();
        }
        if(Number(type) == 1){
            //等待不处理
        }
        if(Number(type) == 2){
            failRun();
        }
        if(Number(type) == 3){
            //等待不处理
        }
        if(Number(type) == 4){
            FrameworkBridge.sdkSignalForward.interAdHandler();

            //等待 处理音效（事件first_ad?）
            cc.audioEngine.setMusicVolume(0);
            cc.audioEngine.setEffectsVolume(0);
        }
        if(Number(type) == 5){
            failRun();
        }
        if(Number(type) == 6){
            //点击不用处理
        }
        if(Number(type) == 7){
            //关闭 广告情况（声音 回调）
            sucRun();
        }
    }

    public static invokeBannerCallback(type:number){
        GameModel.recordDisplayEvent("Bancb:   " + type);

        let failRun = ()=>{
            if(FrameworkBridge.bannerAdHandler){
                FrameworkBridge.bannerAdHandler('fail');
                FrameworkBridge.bannerAdHandler = null;
            }
        }
        let sucRun = ()=>{
            if(FrameworkBridge.bannerAdHandler){
                FrameworkBridge.bannerAdHandler('suc');
                FrameworkBridge.bannerAdHandler = null;
            }
        }

        if(Number(type) == 0){
           failRun();
        }
        if(Number(type) == 1){
            //等待不处理
        }
        if(Number(type) == 2){
            failRun();
        }
        if(Number(type) == 3){
            //等待不处理
        }
        if(Number(type) == 4){
        }
        if(Number(type) == 5){
            failRun();
        }
        if(Number(type) == 6){
            //点击不用处理
        }
        if(Number(type) == 7){
            //关闭 广告情况（声音 回调）
            sucRun();
        }
    }
}
cc.js.setClassName("FrameworkBridge", FrameworkBridge);
