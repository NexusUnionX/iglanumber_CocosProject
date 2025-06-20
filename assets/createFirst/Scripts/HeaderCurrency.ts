import GameModel from "./GameModel";
const {ccclass, property} = cc._decorator;
@ccclass
export default class HeaderCurrency extends cc.Component {
    //已修改
    public static goldDisplayRoot: HeaderCurrency = null;
    @property(cc.Label)
    currencyAmountLabel: cc.Label = null;
    @property(cc.Label)
    addCurrencyLabel: cc.Label = null;
    @property(cc.Node)
    currencyIcon: cc.Node = null;
    @property(sp.Skeleton)
    iconAnimation: sp.Skeleton = null;
    /**展示修改用的金币数量 */
    displayedAmount:number = 0;
    /**当期展示的金币 */
    currentAmount = 0;
    protected onLoad(): void {
        if (HeaderCurrency.goldDisplayRoot == null) { HeaderCurrency.goldDisplayRoot = this }
        cc.director.on("goldAdd", this.onClickHandler, this);
        this.addCurrencyLabel.node.scale = 0;
        this.schedule(() => {
            if (this.currentAmount < GameModel.dispatchModelEvent.gold) {
                let score = Math.floor((GameModel.dispatchModelEvent.gold - this.currentAmount) / 2);
                if (score < 1) {
                    score = 0;
                    this.currentAmount = GameModel.dispatchModelEvent.gold;
                }
                this.currentAmount += score;
                this.updateAmountLabel(this.currentAmount);
            }
            else {
                this.currentAmount = GameModel.dispatchModelEvent.gold;
                this.updateAmountLabel(GameModel.dispatchModelEvent.gold);
            }
        }, 0.05)
    }

    onClickHandler(changeCount: number){
        this.displayedAmount += changeCount;
        this.addCurrencyLabel.string = (this.displayedAmount > 0 ? "+" : "") + Math.floor((this.displayedAmount));
        this.addCurrencyLabel.node.stopAllActions();
        this.addCurrencyLabel.node.scale = 1;
        this.registerClickHandler();
    }
    playFlourishAnimation(){
        this.iconAnimation.setAnimation(0, "animation", false);
    }
    registerClickHandler() {
        this.unschedule(this.playFlourishAnimation);
        this.scheduleOnce(this.playFlourishAnimation, 0.8);
        cc.tween(this.addCurrencyLabel.node)
            .delay(0.5)
            .to(0.5, { scale: 0 },{easing:"backIn"})
            .call(() => {
                this.displayedAmount = 0;
            })
            .start();
    }
    updateAmountLabel(num:number){
        this.currencyAmountLabel.string = `${Math.floor(num)}`;
    }
 
}
