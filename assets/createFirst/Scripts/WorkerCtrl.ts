import UIController from "./UIController";

const {ccclass, property} = cc._decorator;
@ccclass
export default class WorkerCtrl extends cc.Component {
    public static instance: WorkerCtrl = null;
    @property(cc.Node)
    process:cc.Node = null;
    @property(sp.Skeleton)
    worker:sp.Skeleton = null;

    total: number = 10;
    cur: number = 0;

    isBlock: boolean = false;

    /**5秒没有消除 睡觉 */
    totalLong: number = 5;
    /**当前时间 */
    curLong: number = 0;

    /**1表示睡觉 2表示普通挖矿 3表示开奖 */
    curState: number = 1;
    protected onLoad(): void {
        WorkerCtrl.instance = this;

        this.cur = 0;
        this.addProcess(0);

        this.runSleep();
        this.schedule(() => { 
            if(this.curState == 2){
                this.curLong += 1;
            }
            if(this.curLong >= this.totalLong){
                this.curLong = 0;
                this.runSleep();
            }
        }, 1)
    }

    addProcess(addNum: number) {
        this.curLong = 0;
        if(this.curState != 2){
            this.runNormal();
        }

        this.cur += addNum;
        if (this.cur > this.total) {
            this.cur = this.total;
        }
        cc.Tween.stopAllByTarget(this.process.getComponent(cc.ProgressBar));
        cc.tween(this.process.getComponent(cc.Sprite))
            .to(0.3, { fillRange: this.cur / this.total })
            .start()
    }

    clearAll(){
        this.cur = 0;
        this.addProcess(0);
        this.runSleep();
    }


    runNormal(){
        this.curLong = 0;

        this.curState = 2;
        this.worker.setAnimation(0, "normal", true);
    }
    runCrazy(cb:Function){
        this.curLong = 0;
        this.curState = 3;
        this.worker.timeScale = 2;
        this.runSpin(this.worker, "crazy", () => {
            this.worker.timeScale = 1;
            this.curLong = 0;
            this.runNormal();
            cb();
        });
    }
    runSleep(){
        this.curState = 1;
         this.runSpin(this.worker, "toSleep", () => {
            this.worker.setAnimation(0, "sleep", true);
        });
    }

    /**封装一个 执行 带回调的 sp 动画播放 */
    runSpin(sp1: sp.Skeleton, name: string, cb: Function) {

        let a: sp.spine.TrackEntry = sp1.setAnimation(0, name, false);
        sp1.setTrackCompleteListener(a, (entry: sp.spine.TrackEntry, loopCount: number) => {
            if (cb) {
                cb();
            }
        })
    }

    endClac(){
        if(this.cur >= this.total){
            //
            this.isBlock = true;
            //TODO打开奖励等等操作
            this.runCrazy(()=>{
                UIController.revealPrizesPanel();
                this.isBlock = false;
                this.cur = 0;
                this.addProcess(0);
            })

        }
    }


}
