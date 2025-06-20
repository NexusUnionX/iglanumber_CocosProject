// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import {dredeData} from "./DredgeData";
import Dredge from "./Dredge";
import GameModel from "../../createFirst/Scripts/GameModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class DredgeLevel extends cc.Component {

    @property(cc.Node)
    bg: cc.Node = null;
    @property(cc.Node)
    front: cc.Node = null;
    @property(cc.Node)
    select: cc.Node = null;
    @property(cc.Node)
    goods: cc.Node = null;
    @property(cc.SpriteFrame)
    bgSpriteFrames: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    frontSpriteFrames: cc.SpriteFrame[] = [];

    // LIFE-CYCLE CALLBACKS:
    isOperate = true;

    onLoad() {
        this.select.active = false;
        let conf = dredeData.levelConing[dredeData.savedData.level];
        let width = Math.ceil(640 / conf.size[0]);
        for (let i = 0; i < conf.size[0] * conf.size[1]; i++) {
            let bgnode = this.bg.children[i] || cc.instantiate(this.bg.children[0]);
            let frontnode = this.front.children[i] || cc.instantiate(this.front.children[0]);
            bgnode.height = frontnode.height = bgnode.width = frontnode.width = width;
            let code = dredeData.getRandom(0, this.bgSpriteFrames.length - 1);
            bgnode.getComponent(cc.Sprite).spriteFrame = this.bgSpriteFrames[code];
            frontnode.getComponent(cc.Sprite).spriteFrame = this.frontSpriteFrames[code];
            this.bg.children[i] || this.bg.addChild(bgnode);
            this.front.children[i] || this.front.addChild(frontnode);
            let isShow = dredeData.savedData.levelData.indexOf(i) == -1;
            frontnode.opacity = isShow ? 255 : 0;
            isShow && frontnode.on(cc.Node.EventType.TOUCH_END, () => {
                if (frontnode.opacity == 255 && this.isOperate) {
                    if (dredeData.savedData.chisel > 0) {
                        Dredge.ins.playSound(i);
                        this.openBox(frontnode, () => {
                            dredeData.savedData.chisel--;
        GameModel.GridPosition(405,dredeData.savedData.chisel + "");

                            frontnode.opacity = 0;
                            dredeData.savedData.levelData.push(i);
                            this.checkLevel();
                            Dredge.ins.updateUI();
                        });
                    } else {
                        Dredge.ins.showTips("Not Enough Tools");
                    }
                }
            }, this);
        }
        this.bg.width = this.front.width = this.bg.height = this.front.height = width * conf.size[0];
        for (let node of this.goods.children) {
            node.opacity = dredeData.savedData.goods.indexOf(Number(node.name)) != -1 ? 0 : 255;
        }
    }

    openBox(target: cc.Node, cb) {
        this.isOperate = false;
        let point = target.convertToWorldSpaceAR(cc.v3());
        this.select.active = true;
        this.select.opacity = 255;
        this.select.position = this.node.convertToNodeSpaceAR(point);
        this.select.getComponent(cc.Animation).play();
        this.scheduleOnce(() => {
            this.isOperate = true;
            this.select.active = false;
            cb && cb();
        }, 0.53);
    }

    checkLevel() {
        let addID = [];
        let conf = dredeData.levelConing[dredeData.savedData.level];
        for (let key  in  conf.ids) {
            if (dredeData.savedData.goods.indexOf(conf.good[key]) == -1) {
                let isadd = true;
                for (let id of  conf.ids[key]) {
                    if (dredeData.savedData.levelData.indexOf(id) == -1) {
                        isadd = false;
                        break;
                    }
                }
                if (isadd) {
                    addID.push(conf.good[key]);
                    dredeData.savedData.goods.push(conf.good[key]);
                }
            }
        }
        if (addID.length > 0) {
            for (let id of addID) {
                let node = this.goods.getChildByName(id.toString());
                Dredge.ins.unlockGood(cc.instantiate(node), node.convertToWorldSpaceAR(cc.v3()));
                node.opacity = 0;
            }
        }
        let isLeve = true;
        for (let id  of  conf.good) {
            if (dredeData.savedData.goods.indexOf(id) == -1) {
                isLeve = false;
                break;
            }
        }
        if (isLeve) {
            //过关
            Dredge.ins.passLeve();
            this.node.destroy();
        }
    }


}
