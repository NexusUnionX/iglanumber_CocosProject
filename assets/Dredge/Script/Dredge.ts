// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import GameModel from "../../createFirst/Scripts/GameModel";
import {dredeData} from "./DredgeData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Dredge extends cc.Component {

    @property(cc.Label)
    label_icon: cc.Label = null;
    @property(cc.Label)
    label_tips: cc.Label = null;
    @property(cc.Label)
    label_chisel: cc.Label = null;
    @property(cc.Prefab)
    levelPrefabList: cc.Prefab[] = [];
    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    collectionsPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    tipsPrefab: cc.Prefab = null;
    @property(cc.Node)
    btn_collections: cc.Node = null;
    @property(cc.Node)
    level: cc.Node = null;
    @property(cc.Node)
    levelselectList: cc.Node[] = [];
    @property([cc.AudioClip])
    soundList: cc.AudioClip[] = [];


    // LIFE-CYCLE CALLBACKS:
    static ins: Dredge = null;

    onLoad() {
        Dredge.ins = this;
        this.init();

        GameModel.GridPosition(404);
        
    }

    protected onDestroy(): void {
        Dredge.ins = null;
    }

    init() {
        this.updateUI();
        this.label_tips.node.active = !this.levelPrefabList[dredeData.savedData.level];
        if (this.levelPrefabList[dredeData.savedData.level]) {
            let level = cc.instantiate(this.levelPrefabList[dredeData.savedData.level]);
            level.parent = this.level;
        }
        this.levelselectList.forEach(((value, index) => {
            value.active = index == dredeData.savedData.level;
        }));
    }

    updateUI() {
        this.label_chisel.string = dredeData.savedData.chisel.toString();
        this.label_icon.string = parseInt(dredeData.coin.toString()).toString();
    }

    playSound(boxid: number) {
        if (dredeData.isSound) {
            let conf = dredeData.levelConing[dredeData.savedData.level];
            let sid = 0;
            for (let key  in  conf.ids) {
                for (let id of  conf.ids[key]) {
                    if (id == boxid) {
                        sid = 1;
                        break;
                    }
                }
            }
            cc.audioEngine.play(this.soundList[sid], false, 1);
        }
    }

    unlockGood(node: cc.Node, world: cc.Vec3) {
        this.node.addChild(node);
        node.position = this.node.convertToNodeSpaceAR(world);
        cc.tween(node).to(0.2, {scale: 1.3, angle: 0}, {
            easing: "backOut"
        }).delay(0.2).to(0.5, {position: this.btn_collections.position, scale: 0.2}).removeSelf().start();
    }

    showTips(msg: string) {
        let node = cc.instantiate(this.tipsPrefab);
        node.y = -350;
        node.getComponentInChildren(cc.Label).string = msg;
        node.parent = this.node;
        cc.tween(node).to(0.5, {y: 0}).delay(0.5).removeSelf().start();
    }

    passLeve() {
        dredeData.savedData.level++;
        dredeData.savedData.levelData = [];
        this.init();
        this.showTips("Congratulations on passing level");
    }

    onButtonEvents(target, data: string) {
        dredeData.btn();
        if (data == "0") {
            this.node.destroy();
        } else if (data == "1") {
            this.node.addChild(cc.instantiate(this.collectionsPrefab));
        } else if (data == "2") {
            this.node.addChild(cc.instantiate(this.itemPrefab));
        }
    }

    // update (dt) {}
}
