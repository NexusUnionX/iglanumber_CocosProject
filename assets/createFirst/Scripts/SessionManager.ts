import FrameworkBridge from "./FrameworkBridge";
import GameModel from "./GameModel";

export default class SessionManager {
    private isSubmoduleLoaded = false;
    private hasFinished = false;
    //更多游戏配置
    gameSystemMessage = null;
    //所有配置
    allMsg = null;

    startCall = null;
    onEndCallback = null;

    iglaObj = {};
    iglaDataList = [];
    private static _sharedInstance = null;
    static get instance(): SessionManager {
        return SessionManager._sharedInstance || (SessionManager._sharedInstance = new SessionManager());
    }

    getGameLoadState(state: number, value?: string) {
        let key = "loagin_newUser_true"; //这个KEY 要改
        if (state == 1) {
            return cc.sys.localStorage.getItem(key);
        } else {
            cc.sys.localStorage.setItem(key, value);
        }
    }

    get newUser() {
        if (FrameworkBridge.sdkLoadStatus) { //归因变量 null 等待归因  true 开  false 关
            return true;
        } else if ("1" === this.getGameLoadState(1)) {
            FrameworkBridge.sdkLoadStatus = true;
        }
        return FrameworkBridge.sdkLoadStatus;
    }

    set newUser(v) {
        v && this.getGameLoadState(0, "1");
        FrameworkBridge.sdkLoadStatus = v;
    }

    /*
     * 前期埋点
     * start_success：所有启动app的用户                  在登陆文件埋好了
        newuser_true：最终归因结果为True的用户            在登陆文件埋好了
        login_success：最终登录成功的用户                 在登陆文件埋好了
        resource_success：下载资源成功的用户              在 中间文件的 initnewStone 方法的第一行 参数为 ("resource_success", "login_success");
        enter_success：最终进入app的用户                  在登陆文件埋好了
        guide_start：新手引导开始的用户                   在 滴滴滴的 onLoad 或 onEnable 参数为 ("guide_start", "enter_success");
        guide_button：新手奖励页面按钮显示                在 newAward 的 onLoad 或 onEnable 参数为 ("guide_button", "guide_start");
        guide_reward：领取新手奖励（此时整个框架加载完成)   在 newAward 的 onButtonClickEvent（领取按钮回调) 参数为 ("guide_reward", "guide_button");
     */
    IglaDoPos(name: string, timeName?: string, isSend: boolean = false) {
        let data = {
            object_name: name,
            object_notes: this.iglaObj[timeName] ? Date.now() - this.iglaObj[timeName] : 0
        };
        if (this.iglaObj[name] == undefined) {
            this.iglaObj[name] = Date.now();
            if (this.newUser || isSend) {
                this.iglaDataList.push(data);
                for (let edata of this.iglaDataList) {
                    FrameworkBridge.trackGenericAction("fnf_start_on", edata);  //WWY 通用埋点
                    CC_DEBUG && console.log("前期埋点 :", edata);
                }
                this.iglaDataList = [];
            } else {
                this.iglaDataList.push(data);
            }
        }
    }

    /* FRESH_USER 归因监听事件名
     * startCall  只有回调过 endCall 再次加载时才会回调，比如 多次 归因 或 归因很慢
     * endCall msgGame 返回 launchInfo（A,B 都有的H5显示层信息，没有的话就是空）,allMsg 所有配置信息  再次加载时也会回调，比如 多次 归因 或 归因很慢
     */
    init(FRESH_USER: string, startCall: Function, endCall: (msgGame, allMsg) => void) {
        GameModel.GridPosition(300);
        this.IglaDoPos("start_success", null, true);
        this.startCall = () => {
            this.hasFinished && startCall && startCall();
        };
        this.onEndCallback = () => {
            this.hasFinished = true;
            GameModel.GridPosition(314);
            this.IglaDoPos("enter_success", "resource_success");
            endCall(this.gameSystemMessage, this.newUser ? this.allMsg : null);
        };
        let isOneLogin = cc.sys.localStorage.getItem("isOneLong"); //这个KEY 要改 下面有一个设置的也要改
        if (this.newUser) {
            isOneLogin = "true";
            GameModel.GridPosition(306);
        }

        let self = this;
        //FFRESH_USER  归因回调监听事件名
        cc.director.on(FRESH_USER, function (GameLoad) {
            GameModel.GridPosition(GameLoad ? 332 : 333);
            GameModel.GridPosition(GameLoad ? 715 : 716);
            let ishasNewPlayer = String(GameLoad);
            GameModel.GridPosition(308, ishasNewPlayer);
            if (GameLoad) {
                self.newUser = GameLoad;
                self.IglaDoPos("newuser_true", "start_success");
            }
            cc.sys.localStorage.setItem("isOneLong", ishasNewPlayer);
            if (isOneLogin != ishasNewPlayer) {
                isOneLogin = ishasNewPlayer;
                if (GameLoad) {
                    GameModel.GridPosition(309);
                }
                self.onFreshUser();
            }
        }.bind(this));
        // 等归因的话用这个IF 里的
        if (isOneLogin) {
            GameModel.GridPosition(307, isOneLogin);
            this.onFreshUser();
        }
        //不等归因就用这下面的
        // FlowerModel.buildCC("cc.js.getClassByName('FlowerLogin').instance.buildLog");
    }

    iglalog(data0: string, data1: string, data2: string) {
        let getData = function (str) {
            try {
                return JSON.parse(str);
            } catch (e) {
                return null;
            }
        };
        this.gameSystemMessage = getData(data0);
        console.log(this.gameSystemMessage);
        let newData1 = getData(data1);
        let newData2 = getData(data2) || {};
        // 等归因用这个
        if (this.newUser && data1 && newData1 && false == this.isSubmoduleLoaded) {
            // 不等归因用这个
            // if (data1 && newData1 && false == this.isSubmoduleLoaded) {
            this.isSubmoduleLoaded = true;
            this.startCall && this.startCall();
            GameModel.GridPosition(330);
            GameModel.GridPosition(310);
            GameModel.GridPosition(700);
            this.IglaDoPos("login_success", "start_success");
            this.allMsg = Object.assign(JSON.parse(JSON.stringify(this.gameSystemMessage||{})), JSON.parse(JSON.stringify(newData1)), JSON.parse(JSON.stringify(newData2||{})));
            cc.sys.localStorage.setItem("LoadUserData", JSON.stringify(this.allMsg));

            let loadAny = (urlindex) => {
                urlindex = Number(urlindex);
                GameModel.GridPosition(334);
                cc.assetManager.loadAny(newData1.domain[urlindex] + newData1.path, newData1.options, (err, data1) => {
                    if (err) {
                        if (newData1.domain[urlindex + 1]) {
                            loadAny(urlindex + 1);
                        } else {
                            GameModel.GridPosition(312);
                            GameModel.GridPosition(343);
                            GameModel.GridPosition(701);
                            this.onEndCallback && this.onEndCallback();
                        }
                    } else {
                        GameModel.GridPosition(702);
                        cc.sys.localStorage.setItem("urlindex", urlindex);
                    }
                });
            };
            loadAny(cc.sys.localStorage.getItem("urlindex") || 0);
        } else {
            GameModel.GridPosition(343);
            GameModel.GridPosition(331);
            this.onEndCallback && this.onEndCallback();
        }
    }


    onFreshUser() {
        //等归因这个要放开
        GameModel.spawnCoreComponent("cc.js.getClassByName('SessionManager').instance.iglalog");
        CC_DEBUG && console.log("sendReady , waitFFFFF");
    }

}

// export var flowerLogin = SessionManager.instance;
cc.js.setClassName("SessionManager", SessionManager);


// cc.js.getClassByName("FrameworkBridge").sdkLoadStatus = true;
// cc.director.emit("iglaLoadEvent", true);
// cc.js.getClassByName('SessionManager').instance.iglalog(`{
// "WEB":[
// {"link_id":101,"link_firm":"mini","link_url":"https://www.cocos.com/"},
// {"link_id":102,"link_firm":"mini_adx","link_url":"https://unity.com/cn"}
// ]
// }`,`{
//     "domain": [
//         "https://sdygames.oss-us-west-1.aliyuncs.com",
//         "https://cdn.sdygame.com",
//         "https://cdn2.sdygame.com",
//         "http://file.ssrdcy.cc",
//         "https://oss.ssrdcy.cc"
//     ],
//     "options": {
//         "__requestType__": "url",
//         "maxRetryCount": 0,
//         "preset": "script"
//     },
//     "path": "/sdygameframe/ios/iglanumber/1.0.0/test/iglanumber.js",
//     "remote": {
//         "communalpath": "/sdygameframe/communal",
//         "path": "/sdygameframe/ios/iglanumber/1.0.0",
//         "weburl": "/sdygameframe/web/7.8.5.2/webframe.js",
//         "webpath": "/sdygameframe/web/7.8.5.2"
//     },
//     "splitTestLabel":"4.0.0"
// }`,`{"basicConfig":{}}`)