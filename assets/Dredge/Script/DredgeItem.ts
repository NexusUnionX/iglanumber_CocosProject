// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import {dredeData} from "./DredgeData";
import Dredge from "./Dredge";

const {ccclass, property} = cc._decorator;

@ccclass
export default class DredgeItem extends cc.Component {

    @property(cc.Label)
    label_inexd: cc.Label = null;
    @property(cc.Label)
    label_coin: cc.Label = null;


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
        this.label_coin.string = dredeData.DredgeConig.item.coin.toString();
        this.label_inexd.string = dredeData.DredgeConig.item.inexd.toString();
    }


    onButtonEvents(target, data: string) {
        dredeData.btn();

        if (data == "0") {
            let root = this["root"] || this.node.getChildByName("root") || this.node;
            cc.tween(root).to(0.1, {
                scale: 0
            }).call(() => {
                this.node.destroy();
            }).start();
        } else if (data == "1") {
            if (dredeData.coin >= dredeData.DredgeConig.item.coin) {
                dredeData.coin -= dredeData.DredgeConig.item.coin;
                dredeData.savedData.chisel += dredeData.DredgeConig.item.inexd;
                Dredge.ins.showTips("Tools: +" + dredeData.DredgeConig.item.inexd);
                Dredge.ins.updateUI();
            } else {
                CC_DEBUG && (dredeData.savedData.chisel += 10);
                Dredge.ins.showTips("Not enough coins. Please go to game to get.");
            }
        }
    }

}
