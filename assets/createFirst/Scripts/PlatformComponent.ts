import LoadingScreen from "./LoadingScreen";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PlatformComponent extends cc.Component {
    @property(cc.WebView)
    platformWidget: cc.WebView = null;
    isConfigured(url: string) {
        this.platformWidget.url = url;
    }
    handleInteraction(){
        LoadingScreen.onButtonPress();
        this.platformWidget.url = "";
        this.node.x = 10000;
    }
}
