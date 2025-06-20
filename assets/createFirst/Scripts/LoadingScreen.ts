import FrameworkBridge from "./FrameworkBridge";
import SessionManager from "./SessionManager";
import GameModel from "./GameModel";
import VideoTipView from "./VideoTipView";

const {ccclass, property} = cc._decorator;
@ccclass
export default class LoadingScreen extends cc.Component {
    //已修改
    @property(cc.Sprite)
    progressBar: cc.Sprite = null;
    @property(cc.Prefab)
    mainScenePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    loadingUiPrefab:cc.Prefab = null;
    @property(cc.Prefab)
    notificationPrefab:cc.Prefab = null;

    @property(cc.Prefab)
    videoPromptPrefab: cc.Prefab = null;
    
    @property(cc.Label)
    buildNumberLabel: cc.Label = null;
    @property(cc.Node)
    appIconSprite: cc.Node = null;
    @property(cc.Label)
    statusLabel: cc.Label = null;
    @property(cc.Node)
    gameRootNode: cc.Node = null;
    @property(cc.Node)
    modalViewContainer: cc.Node = null;

    //backgroundMusic
    @property(cc.AudioClip)
    musicAudioClip: cc.AudioClip = null;
    //btn
    @property(cc.AudioClip)
    buttonSfx: cc.AudioClip = null;
    //goldShake
    @property(cc.AudioClip)
    coinSfx: cc.AudioClip = null;
    //errorBtn
    @property(cc.AudioClip)
    errorSfx: cc.AudioClip = null;
    //upEff
    @property(cc.AudioClip)
    levelUpSfx: cc.AudioClip = null;
    //harm
    @property(cc.AudioClip)
    damageSfx: cc.AudioClip = null;
    //ding
    @property(cc.AudioClip)
    notificationSfx: cc.AudioClip = null;
    //unlockView
    @property(cc.AudioClip)
    unlockSfx: cc.AudioClip = null;
    //flashTool
    @property(cc.AudioClip)
    toolUseSfx: cc.AudioClip = null;
    //redGo
    @property(cc.AudioClip)
    specialActionSfx: cc.AudioClip = null;

    
    //g1
    @property(cc.AudioClip)
    goldSfx1: cc.AudioClip = null;
    //g2
    @property(cc.AudioClip)
    goldSfx2: cc.AudioClip = null;

    //b1 - b9
    @property(cc.AudioClip)
    buttonSfx1: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx2: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx3: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx4: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx5: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx6: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx7: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx8: cc.AudioClip = null;
    @property(cc.AudioClip)
    buttonSfx9: cc.AudioClip = null;


    /** 游戏名称 */
    public static APP_TITLE: string = "Glacier Jewel Up";
    /** 包名 */
    public static BUNDLE_IDENTIFIER: string = "com.glacier.inner.gem.funjoy";
    /** 游戏代号 */
    public static APP_CODE: string = "iglanumber";
    /** 游戏平台 */
    public static TARGET_PLATFORM: string = "ios";
    /** 游戏版本 */
    public static APP_VERSION: string = "1.0.1";
    /** 隐私政策链接 TODO*/
    public static PRIVACY_URL: string = "https://www.glacierjewelup.online/safevault.html";
    /** 邀请码 */
    public static REFERRAL_CODE: string = "";

    // /**cocos 脚本加密 密码 1*/
    // cocoMi:"cX4bema0h4Mr0EYE",
    
    //资源加密 KEY 密码
    // KEY:tVEbvTFDA9obEdbw
    // 密码:F6bK96amzH6ClzVM

    public static loadingViewRoot: LoadingScreen = null;
    protected onLoad(): void {
        LoadingScreen.loadingViewRoot = this;

        LoadingScreen.syncGameData();
        cc.game.on(cc.game.EVENT_HIDE, () => {
            LoadingScreen.saveGameData();
        });

        GameModel.GridPosition(400);

    }

    progressStart: boolean = false;
    progressEnd: boolean = false;
    protected onEnable(): void {
        LoadingScreen.playBackgroundMusic();

        GameModel.retrieveAppVersion();
        this.buildNumberLabel.string = LoadingScreen.APP_VERSION;

        ///////

        SessionManager.instance.init("iglaLoadEvent", () => {
            LoadingScreen.loadingViewRoot.displayLoadingSpinner();
        }, (msgA,msgB) => {

            LoadingScreen.loadingViewRoot.concealLoadingSpinner();
            LoadingScreen.loadingViewRoot.progressStart = true;

            LoadingScreen.loadingViewRoot.transitionToGame();
        });


        FrameworkBridge.setupSdk(()=>{
            
        });
        ////////


        this.progressBar.fillRange = 0;

        cc.tween(this.progressBar)
            .to(0, { fillRange: 0 })
            .to(1, { fillRange: 1 })
            .call(() => {
                this.transitionToGame();
            })
            .union()
            .repeatForever()
            .start();

            LoadingScreen.loadingViewRoot.schedule(LoadingScreen.loadingViewRoot.updateProgressDisplay);

        this.progressEnd = true;
    }

    updateProgressDisplay(){
        this.appIconSprite.x = (-this.progressBar.node.width / 2) + this.progressBar.fillRange * this.progressBar.node.width;
        this.statusLabel.string = "Loading " + Math.floor(this.progressBar.fillRange * 100) + "%";
    }

    public static haltLoading(){
        LoadingScreen.loadingViewRoot.unschedule(LoadingScreen.loadingViewRoot.updateProgressDisplay);
        cc.Tween.stopAllByTarget(LoadingScreen.loadingViewRoot.progressBar);
    }

    launchGame: boolean = false;
    transitionToGame() {
        if (this.progressStart == true && this.progressEnd == true && this.launchGame == false) {
            this.launchGame = true;
            cc.Tween.stopAllByTarget(this.progressBar);
            this.gameRootNode.addChild(cc.instantiate(this.mainScenePrefab));
            GameModel.GridPosition(401);

            // CatModel.lifeEvent("into_game");
        }
    }

    onPrivacyPolicyTap(){
                GameModel.GridPosition(413);
        
        GameModel.presentWebLink(LoadingScreen.PRIVACY_URL);
    }

    displayVideoPrompt(A:Function,B:Function){
        let node = cc.instantiate(LoadingScreen.loadingViewRoot.videoPromptPrefab);

        node.getComponent(VideoTipView).initializeCallbacks(A, B);

        LoadingScreen.loadingViewRoot.modalViewContainer.addChild(node);
    }

    //提示框
    displayNotification(msg:string = null){
        if (msg == null) {
            msg = "Waiting...";
        }
        let node = cc.instantiate(LoadingScreen.loadingViewRoot.notificationPrefab);
        node.getChildByName("lab").getComponent(cc.Label).string = msg;
        LoadingScreen.loadingViewRoot.modalViewContainer.addChild(node);

        cc.tween(node)
            .by(0.498, { y: 53.98 })
            .delay(0.98)
            .to(0.498, { opacity: 0 })
            .call(() => {
                node.destroy();
            })
            .start();
    }

    loadingSpinnerNode: cc.Node = null;
    displayLoadingSpinner(msg:string = null){
        if (LoadingScreen.loadingViewRoot.loadingSpinnerNode != null) {
            return;
        }
        if (msg == null) {
            msg = "Waiting...";
        }

        let p = cc.instantiate(LoadingScreen.loadingViewRoot.loadingUiPrefab);
        let msgg = p.getChildByName("message");
        msgg.getComponent(cc.Label).string = msg;

        let ro = p.getChildByName("rot");
        cc.tween(ro)
            .to(2, { angle: -360 })
            .call(() => {
                ro.angle = 0;
            })
            .union()
            .repeatForever()
            .start()

        LoadingScreen.loadingViewRoot.modalViewContainer.addChild(p);
        LoadingScreen.loadingViewRoot.loadingSpinnerNode = p;
    }

    concealLoadingSpinner(){
        if (LoadingScreen.loadingViewRoot.loadingSpinnerNode != null) {
            LoadingScreen.loadingViewRoot.loadingSpinnerNode.destroy();
            LoadingScreen.loadingViewRoot.loadingSpinnerNode = null;
        }
    }


    //////音效
    playButtonSfx: boolean = true;
    static onButtonPress() {
        if (GameModel.dispatchModelEvent.eff_On && LoadingScreen.loadingViewRoot.playButtonSfx == true) {
            LoadingScreen.loadingViewRoot.playButtonSfx = false;
            setTimeout(() => {
                LoadingScreen.loadingViewRoot.playButtonSfx = true;
            }, 10);
            cc.audioEngine.playEffect(LoadingScreen.loadingViewRoot.buttonSfx, false);
        }
    }

    static playBackgroundMusic() {
        if (GameModel.dispatchModelEvent.music_On) {
            cc.audioEngine.stopMusic();
            cc.audioEngine.playMusic(LoadingScreen.loadingViewRoot.musicAudioClip, true);
        }
    }

    sfxKey: any = {};
    static playSfx(name: string) {
        if (LoadingScreen.loadingViewRoot.sfxKey[name] == null) {
            LoadingScreen.loadingViewRoot.sfxKey[name] = false;
        }
        if (GameModel.dispatchModelEvent.eff_On && LoadingScreen.loadingViewRoot[name] != null && LoadingScreen.loadingViewRoot.sfxKey[name] == false) {
            LoadingScreen.loadingViewRoot.sfxKey[name] = true;
            let t = 10;
            setTimeout(() => {
                LoadingScreen.loadingViewRoot.sfxKey[name] = false;
            }, t);
            cc.audioEngine.playEffect(LoadingScreen.loadingViewRoot[name], false);
        }
    }


    ////////////////////////////////////////////////数据保存
    static gameDataStore(key: string) {
        return JSON.parse(cc.sys.localStorage.getItem(key));
    }

    /**保存游戏数据 */
    static saveGameData() {
        cc.sys.localStorage.setItem("IGLData", JSON.stringify(GameModel.dispatchModelEvent));
    }

    /**同步游戏本地数据 */
    static syncGameData() {
        let gameData = LoadingScreen.gameDataStore("IGLData");
        if (gameData) {
            for (let key in gameData) {
                GameModel.dispatchModelEvent[key] = gameData[key];
            }
        }
        LoadingScreen.saveGameData();
    }
}
