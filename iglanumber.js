(function () {
    /*
    *  加载包信息类
    *  @name 分包名
    *  @loadName 包加载成功后的预制体名
    *  @remotepath 包路径
    *  @initFun  初始化预制体方法
    *  @onProcessCall 加载过程的回调方法
    *  @isZip 是否Zip 可不传，默认为 true
    */
    var bundleInfo = function () {
        function bundleInfo(name, loadName, remotepath, initFun, onProcessCall, isZip) {
            this.name = name;
            this.loadName = loadName;
            this.initFun = initFun;
            this.remotepath = remotepath;
            this.isZip = isZip === undefined ? true : isZip;
            this.load_err = null;
            this.laod_eventData = null;
            this.load_assets = null;
            this.isInit = null;
            if (onProcessCall) {
                this.onProcessCall = onProcessCall;
            }
            timeEvent("load_" + this.name);
        }

        bundleInfo.prototype.errorDispose = function (error) {
            CC_DEBUG && console.error(error);
            let errdata = {
                name: this.name,
                err: error.stack
            }
            middLewareData.sdyEvent(720, JSON.stringify(errdata));
            this.load_assets = null;
            cc.audioEngine.stopAll();
            CC_JSB && cc.assetManager.cacheManager.clearCache();
            cc.game.restart();
        }

        bundleInfo.prototype.onComplete = function (err, bundle, eventData) {
            var self = this;
            self.load_err = err;
            self.laod_eventData = eventData;
            if (self.loadName) {
                bundle.load(self.loadName, cc.Prefab, function (error, assets) {
                    if (error) {
                        self.errorDispose(error);
                    } else {
                        self.load_assets = assets;
                        self.onShwoBundle();
                        timeEvent("load_" + self.name, true);
                    }
                });
            } else {
                self.load_assets = bundle;
                self.onShwoBundle();
                timeEvent("load_" + self.name, true);
            }
        }
        bundleInfo.prototype.onShwoBundle = function () {
            var self = this;
            if (self.isInit !== null && self.load_assets) {
                timeEvent("prepare_show_" + self.name, true);
                timeEvent("show_" + self.name);
                try {
                    self.initFun(self.load_err, self.load_assets, self.laod_eventData);
                    timeEvent("show_" + self.name, true);
                    clearInterval(self.isInit);
                } catch (e) {
                    clearInterval(self.isInit);
                    self.errorDispose(e);
                }
            }
        }
        bundleInfo.prototype.initBundle = function () {
            var self = this;
            if (self.isInit === null) {
                timeEvent("prepare_show_" + self.name);
                self.isInit = setInterval(self.onShwoBundle.bind(self), 16.66);
            }
        }
        bundleInfo.prototype.onProcessCall = function (data) {
            CC_DEBUG && console.warn("如果下载进度要打点，那么就在 new 的时候传入")
        }
        return bundleInfo;
    }();

    /**
     *  获取已注册的类，通过名称进行索引 （调用静态方法用这个）
     *  @param classname 类名
     *  如果获取不到，请先在JSDK初始化的 bundles 里添加类所在的分包名
     *  如果还是获取不到 那么就要在 定义类的下面添加 cc.js.setClassName(); 手动注册类
     *  比如：Web 类
     *  export class Web {
     *      static curType: number = 0;
     *  }
     *  //在这里添加
     *  cc.js.setClassName("Web", Web);
     */
    function getClassByName(classname) {
        return cc.js.getClassByName(classname) || cc.js._registeredClassNames[classname];
    }

    /**
     *  加载我们自己的bundle包
     *  @param bundleInfoList    包信息 是一个数组 对象 [{name：包名  onComplete：加载回调  isZip:是否ZIP 包 默认为 true}]
     *  @param domain            CDN 域名合集
     *  @param communalpath      公用文件路径
     *  @param resVer            当前后台的热更版本
     *  @param logCommonEvent    WWY 通用埋点接口
     *  @param sdyEvent          SDY 埋点接口,我们自己的埋点
     */
    function loadSDYBundle(bundleInfoList, domain, communalpath, resVer, logCommonEvent, sdyEvent) {
        timeEvent("load_rely");
        let loadAny = (domainindex) => {
            domainindex = Number(domainindex);
            let loadurls = [
                domain[domainindex] + communalpath + "/jszip.min.js",
                domain[domainindex] + communalpath + "/bundle/loadBundle_3.1.5.js",
            ]
            cc.assetManager.loadScript(loadurls, (err) => {
                if (err) {
                    if (domain[domainindex + 1]) {
                        loadAny(domainindex + 1);
                    } else {
                        sdyEvent(703);
                        loadAny(0);
                    }
                } else {
                    cc.sys.localStorage.setItem("domainindex", domainindex);
                    sdyEvent(704);
                    timeEvent("load_rely", true);
                    loadBundle();
                }
            });
        };
        var onhot = function (hotTiem, size) {
            var data = { "step": `hot_start` };
            var data1 = {
                object_action: "show",
                object_name: "request_resource"
            }
            if (hotTiem) {
                data.step = "hot_end";
                data.duration = hotTiem;
                data.res_ver = resVer;
                data1.object_name = "download_success";
            } else {
                data.size = size || 0;
            }
            if (logCommonEvent) {
                // WWY 生命周期打点
                logCommonEvent("game_life_key_node", data);
                // SDY 通用埋点
                logCommonEvent("sdy_resource_download", data1);
            }
        }

        var loadBundle = function () {
            var code = [0, 0];
            var bundleSize = 0;
            var hotTiem = Date.now();
            var isUpdate = false;
            var _loop = function _loop(i) {
                var data = bundleInfoList[i];
                var res = new cc.sdy.bundle(data.name, resVer, domain, {
                    path: data.remotepath,
                    communalpath: communalpath
                });
                sdyEvent(718, res.getSdyEventData());
                if (res.isUpdate) {
                    isUpdate = true;
                }
                if (res.isReUpdata) {
                    sdyEvent(717, res.getSdyEventData());
                }
                res.setLoadProcessCall(data.onProcessCall);
                res.setBundleSizeCall(function (size) {
                    bundleSize += size;
                    code[1]++;
                    if (isUpdate && code[1] == bundleInfoList.length) {
                        onhot(null, bundleSize);
                    }
                });
                res.loadBundle(function (err, bundle) {
                    code[0]++;
                    if (isUpdate && code[0] == bundleInfoList.length) {
                        onhot(Date.now() - hotTiem)
                    }
                    data.onComplete && data.onComplete(err, bundle, res.getSdyEventData());
                }, data.isZip);
            }
            for (var i = 0; i < bundleInfoList.length; i++) {
                _loop(i);
            }
        }
        loadAny(cc.sys.localStorage.getItem("domainindex") || 0);
    }

    /**
     *  获取版本
     *  @param isCode 是否全数字
     *  返回  类型  string
     *   isCode = true :  r_1.0.0 转成 100
     *   isCode = false :  r_1.0.0 转成 1.0.0
     */
    function getRemoteVersion(isCode) {
        var verstring = configs.remote.path.split("/");
        verstring = verstring[verstring.length - 1];
        if (middLewareData.abtestConfigTag == undefined) {
            middLewareData.abtestConfigTag = "r_1.0.0"
        }
        verstring = middLewareData.abtestConfigTag + verstring;
        var ver = verstring.split(".").map(function (value) {
            return value.match(/\d+/g)
        })
        return ver.join(isCode ? "" : ".");
    }

    var time_Event_Obj = {};

    function timeEvent(name, isend) {
        if (isend) {
            if (time_Event_Obj[name]) {
                var data = {
                    name: name,
                    time: Date.now() - time_Event_Obj[name]
                };
                middLewareData.sdyEvent(719, JSON.stringify(data));
                time_Event_Obj[name] = null;
                CC_DEBUG && console.log("耗时：", data);
            }
        } else {
            time_Event_Obj[name] = Date.now();
        }
    }

    var all_Time_Indxe = 0;
    timeEvent("all");

    //发送总时间
    function sendAllTimeEvent() {
        all_Time_Indxe++;
        if (all_Time_Indxe == bundleInfoList.length) {
            timeEvent("all", true);
        }
    }

    ///////////////////////////////////////////上面的不要动///////////////////////////////////////////////////////////
    let SessionManager = getClassByName("SessionManager");
    let FrameworkBridge = getClassByName("FrameworkBridge");
    let GameModel = getClassByName("GameModel");
    let LoadingScreen = getClassByName("LoadingScreen");

    let configs = SessionManager.instance.allMsg;

    //下面要用的方法或值到这里添加
    //注意：这里的是改值，不是对象名
    var middLewareData = {
        abtestConfigTag: configs.cyber,      // abtestConfigTag
        earlierStageEvent: SessionManager.instance.IglaDoPos.bind(SessionManager.instance),   //登陆文件里的 前期埋点 方法
        logCommonEvent: FrameworkBridge.trackGenericAction,     //WWY 通用埋点接口
        sdyEvent: GameModel.GridPosition                  //我们自己的埋点(批量)
    }

    var varInfoLabel = new cc.Node()
    varInfoLabel = varInfoLabel.addComponent(cc.Label);
    varInfoLabel.string = "r_" + getRemoteVersion(true);
    varInfoLabel.fontSize = 24;
    varInfoLabel.enableBold = true;
    varInfoLabel.node.setContentSize(60, 25);
    varInfoLabel.node.color = new cc.Color().fromHEX("#FFFFFF");
    varInfoLabel.node.position = cc.v3((cc.winSize.width * 0.5) - varInfoLabel.node.width, -(cc.winSize.height * 0.5) + varInfoLabel.node.height);
    varInfoLabel.node.parent = cc.director.getScene().children[0];
    /*
    * 统一在这里回调结束
    */
    function enterIntoGame() {
        cc.isValid(varInfoLabel.node) && varInfoLabel.node.destroy();
        SessionManager.instance.onEndCallback();
    }

    function initnewStone(error, assets, eventData) {
        middLewareData.sdyEvent(345, "0");
        middLewareData.sdyEvent(710, eventData);
        middLewareData.earlierStageEvent("resource_success", "login_success");
        var node = cc.instantiate(assets);
        node.getComponent("newStone").init(middLewareData.logCommonEvent, middLewareData.sdyEvent, middLewareData.earlierStageEvent);
        node.parent = cc.director.getScene();
        enterIntoGame();
        middLewareData.sdyEvent(711, eventData);
        sendAllTimeEvent();
    }
    function initFrame(error, bundle, eventData) {
        cc.director.on("goldAdd", (changeCount) => {
            let data = {
                type: "stone",
                num: GameModel.dispatchModelEvent.gold,
                change: changeCount
            };
            cc.director.emit("ISTARMINE_UPDATE_CREDIT", data);
        });
        middLewareData.sdyEvent(710, eventData);
        var node = cc.instantiate(bundle);
        node.active = false;
        LoadingScreen.APP_VERSION += ("_" + getRemoteVersion(true));
        let fdata = {
            code: 'iglanumber',
            pg: 'com.glacier.inner.gem.funjoy',
            gameName: 'Glacier Jewel Up',
            platform: 'ios',
            VERSION: getRemoteVersion(false),
            isDebug: false,
            inviteCode: GameModel.retrieveInviteCode(),

            sdkFuc: {
                openVideo: GameModel.triggerVideoAd,
                isLoadInters: () => { return 1 },
                openInters: GameModel.triggerInterstitialAd,
                showBanner: GameModel.triggerBannerAd,
                hideBanner: GameModel.dismissBannerAd,
                selfPoint: middLewareData.sdyEvent,
                isPad: GameModel.isTabletLayout,
                showFunction: {
                    get video() {
                        return FrameworkBridge.sdkSignalForward.videoAdHandler;
                    },
                    set video(v) {
                        FrameworkBridge.sdkSignalForward.videoAdHandler = v;
                    },
                    get inter() {
                        return FrameworkBridge.sdkSignalForward.interAdHandler;
                    },
                    set inter(v) {
                        FrameworkBridge.sdkSignalForward.interAdHandler = v;
                    }
                },
                stuffStatus: function (s) {
                    let key = "";
                    let mss = {
                        "theme": 5,
                        "adShow": 6,
                        "adClick": 7,
                        "adSuc": 8,
                        "freeShow": 9,
                        "freeClick": 10,
                        "freeSuc": 11,
                    }
                    if (mss[s]) {
                        key = mss[s];
                    }
                    console.log(s, "pppppppppppppp------------------", key);
                    GameModel.emitPowerData(key);
                },

                getPluginSdkVersion: () => {
                    return "1.9.0";
                },


            },
            ListenKeys: {
                UPDATE_NEWUSER: "iglaLoadEvent",
                UPDATE_CREDIT: "ISTARMINE_UPDATE_CREDIT",
                VIDEO_SUC: "videoEventSend",
            },
            gameData: {
                credit: {
                    get stone() {
                        return GameModel.dispatchModelEvent.gold;
                    },
                    set stone(v) {
                        GameModel.dispatchModelEvent.gold = v;
                    },
                },
                get NO_VIDEO() {
                    return !FrameworkBridge.isVideoConcealed;
                },
                set NO_VIDEO(v) {
                    FrameworkBridge.isVideoConcealed = !v;
                },
                get Level() {
                    return GameModel.dispatchModelEvent.unlockCount;
                },
                get isNewUser() {
                    return FrameworkBridge.sdkLoadStatus;
                },
                set isNewUser(v) {
                    FrameworkBridge.sdkLoadStatus = v;
                },
                get isSound() {
                    return Boolean(GameModel.dispatchModelEvent.eff_On);
                }
            },
            gameFuc: {
                showToast: LoadingScreen.loadingViewRoot.displayNotification,
                openLoad: LoadingScreen.loadingViewRoot.displayLoadingSpinner,
                closeLoad: LoadingScreen.loadingViewRoot.concealLoadingSpinner,
                BurialPoint_COMMON: middLewareData.logCommonEvent,
                earlierStageEvent: middLewareData.earlierStageEvent,
                openUrl: GameModel.presentWebLink,
                BurialPoint_H5: function (sec) {
                },
                openSet: ()=>{
                    cc.director.emit("setShow")
                },
                addStone: (num, endNode) => {
                    GameModel.increaseGold(num);
                },

            },
            gameNodeObj: {
                //这个节点是游戏节点 需要移动走的
                game: cc.find(""),
                //这个是顶部位置算的
                head: cc.find(""),

                //设置按钮
                setIconNodeA: cc.find(""),
                //顶部金币模块
                topIconNodeA: cc.find(""),
                backShop: cc.find(""),

                propRoot: cc.find(""),

                touchMask: cc.find("Canvas/block"),

                popUpNodes: [
                    //场景所有页面使用的节点
                    cc.find("Canvas/modalViewContainer")
                ],
                newUserNodes: [
                    // cc.find("Canvas/gameNode/MainNode/gameRoot/ToolRoot"),
                    // cc.find("Canvas/gameNode/MainNode/Top/btnStone"),
                ]
            }
        };
        node.active = false;
        let n = setInterval(() => {
            //这个是游戏节点 判断是否加载好了的意思用的
            let gameNode = cc.find("Canvas/gameRootNode/GameViewController");
            if (gameNode && gameNode.active) {
                clearInterval(n);
                fdata.gameNodeObj.game = gameNode;
                fdata.gameNodeObj.head = cc.find("root/HeaderSettings/head", gameNode);


                fdata.gameNodeObj.propRoot = cc.find("root/game/btnRoot", gameNode);

                fdata.gameNodeObj.setIconNodeA = cc.find("root/HeaderSettings/setBtn", gameNode);
                fdata.gameNodeObj.topIconNodeA = cc.find("root/HeaderSettings/HeaderCurrency", gameNode);
                // fdata.gameNodeObj.backShop = cc.find("root/HeaderSettings/skinBtn",gameNode);

                getClassByName("Frame").init(fdata, configs);
                node.active = true;
            }
        }, 16.66);
        node.parent = cc.find("Canvas/fN");
        enterIntoGame();
        middLewareData.sdyEvent(711, eventData);
        sendAllTimeEvent();
        middLewareData.sdyEvent(344);
        console.timeEnd("loadFrame");
        /////////////////////////下面的是重写游戏的方法////////////////////////////////////

        let SetView = getClassByName("SettingsView");
        let UIController = getClassByName("UIController");
        let GameViewController = getClassByName("GameViewController");


        let getStoneNormal = getClassByName("getStoneNormal");

        let Gm = getClassByName("GM");

        let setOnLaod = SetView.prototype["onLoad"];
        SetView.prototype["onLoad"] = function () {
            setOnLaod.call(this, arguments);
            // this._invite.getComponent(cc.Label).string = LogicFrame.invideCode;
            cc.find("settingsRoot/bg/New Sprite/New Label", this.node).on(cc.Node.EventType.TOUCH_END, () => {
                Gm.open(() => {
                    this.node.destroy();
                });
            });
        }

        let revealPrizesPanel = UIController.revealPrizesPanel;
        UIController.revealPrizesPanel = function () {
            if (fdata.gameData.isNewUser == false) {
                revealPrizesPanel.call();
            } else {
                getStoneNormal.open(null, () => {
                });
            }
        }

        let revealUnlockPopup = UIController.revealUnlockPopup;
        UIController.revealUnlockPopup = function () {
            if (fdata.gameData.isNewUser == false) {
                revealUnlockPopup.call();
            } else {
                getStoneNormal.open(3, () => {
                });
            }
        }

        let displayCoinFx = GameViewController.prototype.displayCoinFx;
        GameViewController.prototype.displayCoinFx = function (pos, tileNum, addNum) {
            if (fdata.gameData.isNewUser == false) {
                displayCoinFx.call(this, pos, tileNum, addNum);
            } else {

            }
        }

        //设置统一按钮声音
        function setBtnSound(cb) {
            if (!cc.Button.prototype["_soundOn"]) {
                //@ts-ignore
                cc.Button.prototype.touchEndClone = cc.Button.prototype._onTouchEnded;
                //@ts-ignore
                cc.Button.prototype._soundOn = true;
                //@ts-ignore
                cc.Button.prototype._onTouchEnded = function (event) {
                    if (this.interactable && this.enabledInHierarchy && this._pressed && this._soundOn == true) {
                        if (cb) {
                            cb(event);
                        }
                    }
                    this.touchEndClone(event);
                }
            }
        }

        let runBtnClick = LoadingScreen.onButtonPress;
        setBtnSound(runBtnClick);
    }

    /*
     * web 初始化
     */
    function initWeb(error, bundle, eventData) {
        middLewareData.sdyEvent(710, eventData);
        //注意：这里的是改值，不是对象名
        configs.web_limitInfo = {
            cnan: "null",           // 渠道信息
            regCountry: configs.items,       //countryCode
            isVpn: configs.portal,             //WWY   vpnOrProxy
            isBlackIp: configs.console,   //  isBlock
            loginCountry: configs.hexagon,    //currentCountry
            vrsn: parseInt(getClassByName("LoadingScreen").APP_VERSION.split('_')[0].replace(/\./g, '')),
            oldt: configs.glory   //registerDays
        };
        cc.sys.localStorage.setItem("LoadUserData", JSON.stringify(configs));
        var webFrame = getClassByName("webFrame");
        webFrame.init(configs);
        middLewareData.sdyEvent(711, eventData);
        sendAllTimeEvent();
    }
    ////////////////////////////////////加载Bundle////////////////////////////////////////////////
    var onprocess = function (data) {
        var name = null;
        try {
            name = JSON.parse(data.data).name;
        } catch (e) {

        }
        switch (data.state) {
            case "loadCache": //已下载，本地加载
                middLewareData.sdyEvent(335, data.data);
                break;
            case "download":// 未下载，开始下载
                middLewareData.sdyEvent(336, data.data);
                timeEvent("bundle_download_" + name);
                break;
            case "download_succeed":// 下载成功
                middLewareData.sdyEvent(705, data.data);
                timeEvent("bundle_download_" + name, true);
                timeEvent("bundle_unzip_" + name);
                break;
            case "download_lose"://下载失败
                middLewareData.sdyEvent(707, data.data);
                break;
            case "unzip_succeed"://解压成功

                timeEvent("bundle_unzip_" + name, true);
                break;
            case "unzip_lose"://解压失败
                middLewareData.sdyEvent(708, data.data);
                break;
            case "load"://开始加载
                timeEvent("bundle_load_" + name);
                break;
            case "load_succeed"://加载成功
                middLewareData.sdyEvent(706, data.data);
                timeEvent("bundle_load_" + name, true);
                break;
            case "load_lose"://加载失败
                middLewareData.sdyEvent(709, data.data);
                break;
        }
    }

    var bundleInfoList = [
        new bundleInfo("WebFrame", null, configs.remote.webpath, initWeb, onprocess),
        new bundleInfo("Frame", "Frame", configs.remote.path, initFrame, onprocess),
    ];
    if (null == cc.sys.localStorage.getItem("newHand")) {
        bundleInfoList.push(new bundleInfo("newHand", "newStone", configs.remote.path, initnewStone, onprocess))
    }
    timeEvent("attribute");

    function onUpdataAttribute() {
        timeEvent("attribute", true);
        for (var i = 0; i < bundleInfoList.length; i++) {
            bundleInfoList[i].initBundle();
        }
    }

    onUpdataAttribute();
    loadSDYBundle(bundleInfoList,
        configs.domain,
        configs.remote.communalpath,
        middLewareData.abtestConfigTag,
        middLewareData.logCommonEvent,
        middLewareData.sdyEvent,
    );
})()