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
export default class DredgeCollections extends cc.Component {

    @property(cc.Node)
    itemList: cc.Node[] = [];
    @property(cc.SpriteFrame)
    itemSpriteFrames: cc.SpriteFrame[] = [];

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        let root = this["root"] || this.node.getChildByName("root") || this.node;
        cc.tween(root).set({
            scale: 0
        }).to(0.2, {
            scale: 1
        }, {
            easing: "backOut"
        }).start();
        this.itemList.forEach((value, index) => {
            value.getChildByName("goad").getComponent(cc.Sprite).spriteFrame = this.itemSpriteFrames[index];
            value.getChildByName("unknow").active = dredeData.savedData.goods.indexOf(index + 1) == -1;
        });

                GameModel.GridPosition(406);
        
    }


    onButtonEvents(target, data: string) {
        dredeData.btn();

        let root = this["root"] || this.node.getChildByName("root") || this.node;
        cc.tween(root).to(0.1, {
            scale: 0
        }).call(() => {
            this.node.destroy();
        }).start();
    }
}
