import GameViewController from "./GameViewController";
import LoadingScreen from "./LoadingScreen";

const {ccclass, property} = cc._decorator;
@ccclass
export default class AnimationEffect extends cc.Component {
    @property(cc.Node)
    animatedNode: cc.Node = null;
    onCompleteCallback = null;
    onLoad() {
        this.node.setContentSize(cc.winSize);
    }

    runPrimaryAction(cb:Function){
        this.onCompleteCallback = cb;
        this.runSecondaryAction();
    }

    runSecondaryAction() {
        for (let i = 0; i < this.animatedNode.childrenCount; i++) {
            this.animatedNode.children[i].scale = 0;
        }
        let scaleList = [1, 0.98, 0.9, 0.95, 0.8, 0.7];

        let promiseList = [];
        let ff = (wait:number,node:cc.Node,scale:number)=>{
            return new Promise<void>((resolve) => {
                this.executeAnimation(wait, node, scale, resolve);
            })
        }

        for(let i = 0; i < this.animatedNode.childrenCount; i++){
            promiseList.push(ff(0.1 * i, this.animatedNode.children[i], scaleList[i]));
        }
    
        Promise.all(promiseList).then(()=>{
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
            this.node.destroy();
        })
 
    }

    executeAnimation(wait:number, node: cc.Node, scale,cb:Function) {
        let word = GameViewController.viewRoot.objectiveSprite.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let end = node.parent.convertToNodeSpaceAR(word);
        cc.tween(node)
            .delay(wait)
            .to(0.199, { scale: scale })
            .call(() => {
                LoadingScreen.playSfx("goldSfx2");
            })
            .then(
                cc.sequence(
                    cc.moveBy(0.0799, 0, 11),
                    cc.moveBy(0.0799, 0, -11),
                    cc.moveBy(0.0799, 0, 11),
                    cc.moveBy(0.0799, 0, -11),
                    cc.moveBy(0.0799, 0, 11),
                    cc.moveBy(0.0799, 0, -11),
                    cc.spawn(
                        cc.moveTo(0.399, end.x, end.y),
                        cc.scaleTo(0.399, 0.599)
                    ),
                    cc.callFunc(() => {
                        LoadingScreen.playSfx("goldSfx1");
                        node.active = false;
                    })
                )
            )
            .call(() => {
                cb();
            })
            .start()
    }

}
