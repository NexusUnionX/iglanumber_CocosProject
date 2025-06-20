import LoadingScreen from "../../createFirst/Scripts/LoadingScreen";

class DataModel {
    chisel: number = 20;
    level: number = 0;
    levelData: number[] = [];
    goods: number[] = [];

    constructor() {
        let data = DataModel.getStorageData("DredgeData", null, {});
        for (let key in data) {
            this[key] = data[key];
        }
        cc.game.on(cc.game.EVENT_HIDE, () => {
            DataModel.setlocalStorageItem(null, dredeData.savedData, "DredgeData");
        });
    }

    /**
     * 获取本地缓存数据
     * @param pkey 对象中的key
     * @param key  对象名
     * @param value 如果这个对象中没有这个 pkey 的值 那么就设置成这个值 且 返回这个值
     */
    static getStorageData<T>(pkey: string, key?: string, value?: T): T {
        let data = this.getlocalStorageItem(key, pkey);
        if (data) {
            return data;
        } else {
            this.setlocalStorageItem(key, value, pkey);
            return value;
        }
    }

    /**
     * 获取本地缓存数据
     * @param key  对象名
     * @param pkey  key 在哪个对象的名 如果不传就为 就为 当前游戏代号
     */
    static getlocalStorageItem(key?: string, pkey?: string): any {
        let data = cc.sys.localStorage.getItem(pkey || "DredgeData");
        if (data && key && data != "") {
            return JSON.parse(data)[key];
        }
        if (data != null && data != "") {
            try {
                return JSON.parse(data);
            } catch (e) {
                return data;
            }
        }
        return null;
    }

    /**
     * 设置本地缓存
     * @param key 名
     * @param value 要设置的值
     * @param pkey  key 在哪个对象的名 如果不传就为 就为 当前游戏代号
     */
    static setlocalStorageItem(key: string, value: any, pkey?: string): void {
        if (value == undefined) {
            value = {};
        }
        let data = this.getlocalStorageItem(undefined, pkey);
        if (key) {
            if (data == null || data == "") {
                data = {};
            }
            data[key] = value;
        } else {
            data = value;
        }
        cc.sys.localStorage.setItem(pkey || "DredgeData", JSON.stringify(data));
    }
}

class DredgeData {
    savedData = new Proxy(new DataModel(), {
        //要存储的对象
        get(target, key) {
            return target[key];
        },
        set(target, key, value) {
            let bool = Reflect.set(target, key, value);
            bool && DataModel.setlocalStorageItem(null, dredeData.savedData, "DredgeData");
            return bool;
        }
    });

    levelConing = [
        {size: [5, 5], good: [1], ids: [[6, 7, 8, 13, 12, 11, 16, 17, 18]]},
        {
            size: [7, 7],
            good: [2, 3, 4],
            ids: [[0, 1, 8, 7], [12, 11, 10, 17, 18, 19, 26, 25, 24], [36, 37, 38, 39, 46, 45, 44]]
        },
        {
            size: [9, 9],
            good: [5, 6, 7, 8],
            ids: [[10, 19, 37, 28], [31, 21, 22, 23, 32, 41, 40, 39], [80, 79, 78, 69, 60, 61, 62, 71], [65, 66, 57, 56]]
        }
    ];
    "DredgeConig" = {
        "item": {
            "coin": 1000,
            "inexd": 1
        }
    };

    coin: number = 0;
    isSound: true;

    getRandom(min: number | number[], max?: number): number {
        if (Array.isArray(min)) {
            max = min[1];
            min = min[0];
        }
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    init(data: { coin: number, isSound: boolean }) {
        let coins = Object.getOwnPropertyDescriptor(data, "coin");
        Object.defineProperty(this, "coin", {
            set(value) {
                coins.set.call(this, value);
            },
            get() {
                return coins.get.call(this);
            }
        });
        let isSound = Object.getOwnPropertyDescriptor(data, "isSound");
        Object.defineProperty(this, "isSound", {
            set(value) {
                isSound.set.call(this, value);
            },
            get() {
                return isSound.get.call(this);
            }
        });
    }

    btn(){
        LoadingScreen.onButtonPress();
    }
}

export var dredeData = new DredgeData();