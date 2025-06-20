import SessionManager from "./SessionManager";
import GameModel from "./GameModel";
import UIController from "./UIController";
import GameViewController from "./GameViewController";
import PlatformComponent from "./PlatformComponent";
import LoadingScreen from "./LoadingScreen";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SettingsView extends cc.Component {
    @property(cc.Node)
    settingsRoot: cc.Node = null;
    @property(cc.Node)
    uiLock: cc.Node = null;

    @property(cc.Node)
    sfxToggleSprite: cc.Node = null;
    @property(cc.Node)
    musicToggleSprite: cc.Node = null;
    @property(cc.Node)
    vibrationToggleSprite: cc.Node = null;

    @property(cc.Node)
    moreGamesButton: cc.Node = null;

    @property(cc.Label)
    versionLabelDisplay: cc.Label = null;
    @property(cc.Label)
    inviteCodeLabel: cc.Label = null;

    @property(cc.Prefab)    
    viewPrefab: cc.Prefab = null;

    protected onLoad(): void {
        
    }

    protected onEnable(): void {
        this.uiLock.active = true;
        this.display(this.settingsRoot, () => {
            this.uiLock.active = false;
        })

        this.refreshToggles();

        this.versionLabelDisplay.string  = LoadingScreen.APP_VERSION;
        //TODO igla
        this.inviteCodeLabel.string = GameModel.retrieveInviteCode();

        this.moreGamesButton.active = false;
        if (SessionManager.instance.gameSystemMessage != null) {
            if(SessionManager.instance.gameSystemMessage.WEB!= null){
                let list: Array<any> = SessionManager.instance.gameSystemMessage.WEB;
                if (list != null && list.length > 0) {
                        this.moreGamesButton.active = true;
                    
                }
            }
        }


    }

    onPanelClose() {
        this.uiLock.active = true;
        this.conceal(this.settingsRoot, () => {
            this.node.destroy();
        })
    }
    /**打开页面动画 */
    display(node: cc.Node, cb: Function) {
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
    conceal(node: cc.Node, cb: Function) {
        node.scale = 1;
        node.opacity = 255;
        cc.tween(node)
            .to(0.2, { scale: 0, opacity: 0 }, { easing: "backIn" })
            .call(() => {
                cb();
            })
            .start();
    }

    onDismissButton() {
        LoadingScreen.onButtonPress();
        this.onPanelClose();
    }

    refreshToggles(){
        this.sfxToggleSprite.getChildByName("click").getChildByName("on").active = GameModel.dispatchModelEvent.eff_On;
        this.sfxToggleSprite.getChildByName("click").getChildByName("off").active = !GameModel.dispatchModelEvent.eff_On;

        this.musicToggleSprite.getChildByName("click").getChildByName("on").active = GameModel.dispatchModelEvent.music_On;
        this.musicToggleSprite.getChildByName("click").getChildByName("off").active = !GameModel.dispatchModelEvent.music_On;

        this.vibrationToggleSprite.getChildByName("click").getChildByName("on").active = GameModel.dispatchModelEvent.shake_On;
        this.vibrationToggleSprite.getChildByName("click").getChildByName("off").active = !GameModel.dispatchModelEvent.shake_On;
    }

    handleToggleChange(node, index) {
        LoadingScreen.onButtonPress();
        if(index == 0){
            //音效
            GameModel.dispatchModelEvent.eff_On = !GameModel.dispatchModelEvent.eff_On;
            LoadingScreen.saveGameData();
        }

        if(index == 1){
            //背景
            GameModel.dispatchModelEvent.music_On = !GameModel.dispatchModelEvent.music_On;
            LoadingScreen.saveGameData();

            if(GameModel.dispatchModelEvent.music_On){
                LoadingScreen.playBackgroundMusic();
            }
            else{
                cc.audioEngine.stopMusic();
            }
        }

        if(index == 2){
            //震动
            GameModel.dispatchModelEvent.shake_On = !GameModel.dispatchModelEvent.shake_On;
            LoadingScreen.saveGameData();
        }

        this.refreshToggles();
    }

    onPrivacyButton(){
        GameModel.GridPosition(413);
        
        LoadingScreen.onButtonPress();
        GameModel.presentWebLink(LoadingScreen.PRIVACY_URL);
    }

    onRestartButton(){
        LoadingScreen.onButtonPress();

        GameViewController.viewRoot.gameGridRoot.removeAllChildren();
        GameViewController.viewRoot.unscheduleAllCallbacks();

        GameModel.resetGameplayState();

        setTimeout(() => {
            GameViewController.viewRoot.regenerateGrid();
        }, 1000);

        UIController.uiRootNode.executeRestart();
        this.onPanelClose();
    }


    onWebsiteButton(){
        LoadingScreen.onButtonPress();

        let list:Array<any> = SessionManager.instance.gameSystemMessage.WEB;

        if(list == null){
            return;
        }
        if(list.length == 0){
            return;
        }

        let ran = (min,max)=>{
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        let a :cc.Node= null;
        if (LoadingScreen.loadingViewRoot.modalViewContainer.getChildByName("PlatformComponent") != null) {
            a = LoadingScreen.loadingViewRoot.modalViewContainer.getChildByName("PlatformComponent");
        }
        else{
            a = cc.instantiate(this.viewPrefab);
            a.parent = LoadingScreen.loadingViewRoot.modalViewContainer;
        }

        a.setSiblingIndex(100);
        a.x = 0;
        a.getComponent(PlatformComponent).isConfigured(list[ran(0, list.length - 1)]["link_url"]);
    }


}
