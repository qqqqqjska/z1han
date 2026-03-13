(function () {
    'use strict';

    const GARDEN_TITLE_STORAGE_KEY = 'garden_app_custom_title_v1';
    const GARDEN_LAYOUT_STORAGE_KEY = 'garden_app_contact_layouts_v1';
    const GARDEN_GAME_STATE_STORAGE_KEY = 'garden_game_state_v1';
    const GARDEN_ROGUE_ACTIVITY_STATE_STORAGE_KEY = 'garden_rogue_activity_state_v1';
    const GARDEN_HOME_TUTORIAL_DISMISSED_KEY = 'garden_home_tutorial_dismissed_v1';
    const GARDEN_FIGURE_ASSET_DB_NAME = 'garden_app_figure_assets_v1';
    const GARDEN_FIGURE_ASSET_STORE = 'resident_character_assets';
    const GARDEN_TITLE_DEFAULT = '\u840c\u5ba0\u76f8\u4f34\u7684\u5bb6';
    const GARDEN_TITLE_MAX_LENGTH = 20;
    const CONTACT_FIGURE_MIN_LEFT = 15;
    const CONTACT_FIGURE_MAX_LEFT = 85;
    const CONTACT_FIGURE_MIN_TOP = 74;
    const CONTACT_FIGURE_MAX_TOP = 90;

    const HOME_ENTRY_META = {
        home: { label: '小家' },
        farm: { label: '农场' },
        pasture: { label: '牧场' },
        kitchen: { label: '厨房' }
    };

    const ITEM_META = {
        wheat: { id: 'wheat', name: '小麦', emoji: '🌾', category: 'crops', sellPrice: 20 },
        carrot: { id: 'carrot', name: '胡萝卜', emoji: '🥕', category: 'crops', sellPrice: 35 },
        tomato: { id: 'tomato', name: '番茄', emoji: '🍅', category: 'crops', sellPrice: 50 },
        corn: { id: 'corn', name: '玉米', emoji: '🌽', category: 'crops', sellPrice: 65 },
        pumpkin: { id: 'pumpkin', name: '南瓜', emoji: '🎃', category: 'crops', sellPrice: 90 },
        egg: { id: 'egg', name: '鸡蛋', emoji: '🥚', category: 'products', sellPrice: 30 },
        milk: { id: 'milk', name: '牛奶', emoji: '🥛', category: 'products', sellPrice: 200 },
        pork: { id: 'pork', name: '猪肉', emoji: '🥩', category: 'products', sellPrice: 80 },
        wool: { id: 'wool', name: '羊毛', emoji: '🧶', category: 'products', sellPrice: 130 },
        bread: { id: 'bread', name: '香喷喷面包', emoji: '🍞', category: 'cooked', sellPrice: 90 },
        cake: { id: 'cake', name: '美味蛋糕', emoji: '🍰', category: 'cooked', sellPrice: 320 },
        salad: { id: 'salad', name: '田园沙拉', emoji: '🥗', category: 'cooked', sellPrice: 170 },
        pizza: { id: 'pizza', name: '农家披萨', emoji: '🍕', category: 'cooked', sellPrice: 290 },
        taco: { id: 'taco', name: '烤肉卷饼', emoji: '🌮', category: 'cooked', sellPrice: 240 },
        icecream: { id: 'icecream', name: '奶香冰淇淋', emoji: '🍨', category: 'cooked', sellPrice: 520 },
        stirfry: { id: 'stirfry', name: '营养炖菜', emoji: '🥘', category: 'cooked', sellPrice: 180 }
    };

    const STORAGE_TABS = {
        crops: { id: 'crops', label: '作物', itemIds: ['wheat', 'carrot', 'tomato', 'corn', 'pumpkin'] },
        products: { id: 'products', label: '畜产', itemIds: ['egg', 'milk', 'pork', 'wool'] },
        cooked: { id: 'cooked', label: '熟食', itemIds: ['bread', 'cake', 'salad', 'pizza', 'taco', 'icecream', 'stirfry'] }
    };

    const INVENTORY_ITEM_IDS = Object.keys(ITEM_META);

    function getFarmSeedGrowTimeByCost(cost) {
        return Math.max(60 * 1000, cost * 6000);
    }

    const FARM_SEEDS = {
        wheat: { id: 'wheat', inventoryId: 'wheat', name: '小麦', emoji: '🌾', cost: 10, time: getFarmSeedGrowTimeByCost(10) },
        carrot: { id: 'carrot', inventoryId: 'carrot', name: '胡萝卜', emoji: '🥕', cost: 15, time: getFarmSeedGrowTimeByCost(15) },
        tomato: { id: 'tomato', inventoryId: 'tomato', name: '番茄', emoji: '🍅', cost: 20, time: getFarmSeedGrowTimeByCost(20) },
        corn: { id: 'corn', inventoryId: 'corn', name: '玉米', emoji: '🌽', cost: 25, time: getFarmSeedGrowTimeByCost(25) },
        pumpkin: { id: 'pumpkin', inventoryId: 'pumpkin', name: '南瓜', emoji: '🎃', cost: 35, time: getFarmSeedGrowTimeByCost(35) }
    };

    const KITCHEN_RECIPES = {
        bread: { id: 'bread', name: '香喷喷面包', emoji: '🍞', primaryIngredient: 'wheat', ingredients: { wheat: 2, egg: 1 } },
        cake: { id: 'cake', name: '美味蛋糕', emoji: '🍰', primaryIngredient: 'wheat', ingredients: { wheat: 3, milk: 1 } },
        salad: { id: 'salad', name: '田园沙拉', emoji: '🥗', primaryIngredient: 'tomato', ingredients: { tomato: 2, carrot: 1 } },
        pizza: { id: 'pizza', name: '农家披萨', emoji: '🍕', primaryIngredient: 'wheat', ingredients: { wheat: 3, tomato: 2, pork: 1 } },
        taco: { id: 'taco', name: '烤肉卷饼', emoji: '🌮', primaryIngredient: 'wheat', ingredients: { wheat: 2, pork: 2 } },
        icecream: { id: 'icecream', name: '奶香冰淇淋', emoji: '🍨', primaryIngredient: 'milk', ingredients: { milk: 2, egg: 1 } },
        stirfry: { id: 'stirfry', name: '营养炖菜', emoji: '🥘', primaryIngredient: 'carrot', ingredients: { carrot: 2, pork: 1 } }
    };

    const ROGUE_STAGE_LABELS = {
        farm: '农场阶段',
        pasture: '牧场阶段',
        kitchen: '厨房阶段',
        sell_setup: '出售准备',
        sell_orders: '出售阶段'
    };

    const ROGUE_CONTEXT_LABELS = {
        farm: '农场',
        pasture: '牧场',
        kitchen: '厨房',
        sell: '出售'
    };

    const ROGUE_STAGE_SEQUENCE = ['farm', 'pasture', 'kitchen', 'sell_setup', 'sell_orders'];

    const ROGUE_CARD_POOL = {
        farm_fast_water: { id: 'farm_fast_water', context: 'farm', title: '快浇快熟', desc: '接下来 3 次浇水后的作物，成熟时间 x0.75', effectType: 'farm_fast_water', values: { remaining: 3, value: 0.75 } },
        farm_double_crop: { id: 'farm_double_crop', context: 'farm', title: '双倍丰收', desc: '接下来 5 次作物收获，各有 35% 概率额外 +1', effectType: 'farm_double_crop', values: { remaining: 5, value: 0.35 } },
        farm_seed_rebate: { id: 'farm_seed_rebate', context: 'farm', title: '种子返利', desc: '本轮所有播种返还 30% 金币，向上取整', effectType: 'farm_seed_rebate', values: { value: 0.3 } },
        farm_big_crop: { id: 'farm_big_crop', context: 'farm', title: '大果加成', desc: '本轮价格 >= 25 的作物收获固定额外 +1', effectType: 'farm_big_crop', values: { value: 1 } },
        pasture_fast_feed: { id: 'pasture_fast_feed', context: 'pasture', title: '速喂速成', desc: '接下来 4 次喂食后，对应成长/生产时间 x0.7', effectType: 'pasture_fast_feed', values: { remaining: 4, value: 0.7 } },
        pasture_twin_yield: { id: 'pasture_twin_yield', context: 'pasture', title: '双产祝福', desc: '接下来 5 次畜产收获，各有 35% 概率额外 +1', effectType: 'pasture_twin_yield', values: { remaining: 5, value: 0.35 } },
        pasture_type_bonus: { id: 'pasture_type_bonus', context: 'pasture', title: '首收奖励', desc: '本轮每种动物类型的第一次收获固定额外 +1', effectType: 'pasture_type_bonus', values: { flags: [] } },
        pasture_baby_boost: { id: 'pasture_baby_boost', context: 'pasture', title: '幼崽冲刺', desc: '本轮所有幼崽成长时间 x0.6', effectType: 'pasture_baby_boost', values: { value: 0.6 } },
        kitchen_bonus_output: { id: 'kitchen_bonus_output', context: 'kitchen', title: '加量出锅', desc: '接下来 2 次成功烹饪，成品固定额外 +1', effectType: 'kitchen_bonus_output', values: { remaining: 2, value: 1 } },
        kitchen_easy_qte: { id: 'kitchen_easy_qte', context: 'kitchen', title: '稳手厨师', desc: '接下来 5 次烹饪 QTE，白区和黄区宽度 x1.35', effectType: 'kitchen_easy_qte', values: { remaining: 5, value: 1.35 } },
        kitchen_cooked_markup: { id: 'kitchen_cooked_markup', context: 'kitchen', title: '熟食溢价', desc: '本轮所有熟食出售价格 +20%', effectType: 'kitchen_cooked_markup', values: { value: 0.2 } },
        kitchen_primary_save: { id: 'kitchen_primary_save', context: 'kitchen', title: '返料巧手', desc: '接下来 2 次成功烹饪，返还 1 份主材料', effectType: 'kitchen_primary_save', values: { remaining: 2, value: 1 } },
        sell_bulk_bonus: { id: 'sell_bulk_bonus', context: 'sell', title: '整批出货', desc: '单次出售同一物品数量 >= 3 时，该物品金币 +15%', effectType: 'sell_bulk_bonus', values: { value: 0.15 } },
        sell_cooked_order: { id: 'sell_cooked_order', context: 'sell', title: '熟食订单', desc: '熟食进入订单权重 x2，且熟食订单奖励 x1.3', effectType: 'sell_cooked_order', values: { value: 1.3 } },
        sell_order_tip: { id: 'sell_order_tip', context: 'sell', title: '订单小费', desc: '每完成一张订单，额外获得 +60 金币', effectType: 'sell_order_tip', values: { value: 60 } },
        sell_chain_bonus: { id: 'sell_chain_bonus', context: 'sell', title: '连单奖励', desc: '完成一张订单后，下一张订单奖励 x1.2', effectType: 'sell_chain_bonus', values: { flags: [] } }
    };

    const STAGE_SUPPLY_POOL = {
        farm: [
            { id: 'farm_supply_gold', stage: 'farm', title: '金币补给', desc: '立即获得 100 金币', rewardType: 'coins', amount: 100 },
            { id: 'farm_supply_chicken', stage: 'farm', title: '小鸡支援', desc: '免费获得 1 只小鸡幼崽', rewardType: 'animal', animalType: 'chicken', amount: 1 },
            { id: 'farm_supply_pig', stage: 'farm', title: '小猪支援', desc: '免费获得 1 只小猪幼崽', rewardType: 'animal', animalType: 'pig', amount: 1 }
        ],
        pasture: [
            { id: 'pasture_supply_basic', stage: 'pasture', title: '基础食材箱', desc: '获得 小麦 x2 + 鸡蛋 x2', rewardType: 'items', items: { wheat: 2, egg: 2 } },
            { id: 'pasture_supply_milk', stage: 'pasture', title: '鲜奶拼箱', desc: '获得 牛奶 x1 + 鸡蛋 x1 + 番茄 x2', rewardType: 'items', items: { milk: 1, egg: 1, tomato: 2 } },
            { id: 'pasture_supply_meat', stage: 'pasture', title: '炖锅食材箱', desc: '获得 猪肉 x1 + 小麦 x2 + 胡萝卜 x2', rewardType: 'items', items: { pork: 1, wheat: 2, carrot: 2 } }
        ],
        kitchen: [
            { id: 'kitchen_supply_bread', stage: 'kitchen', title: '面包补给', desc: '获得 面包 x2', rewardType: 'items', items: { bread: 2 } },
            { id: 'kitchen_supply_combo', stage: 'kitchen', title: '熟食双拼', desc: '获得 沙拉 x1 + 卷饼 x1', rewardType: 'items', items: { salad: 1, taco: 1 } },
            { id: 'kitchen_supply_gold', stage: 'kitchen', title: '金币打赏', desc: '立即获得 120 金币', rewardType: 'coins', amount: 120 }
        ]
    };

    const PASTURE_ANIMAL_DATA = {
        chicken: { id: 'chicken', babyEmoji: '🐥', adultEmoji: '🐓', food: '🌾', inventoryId: 'egg', produceName: '鸡蛋', produceEmoji: '🥚', cost: 20, growTime: 5000, produceTime: 6000 },
        pig: { id: 'pig', babyEmoji: '🐷', adultEmoji: '🐖', food: '🥬', inventoryId: 'pork', produceName: '猪肉', produceEmoji: '🥩', cost: 50, growTime: 8000, produceTime: 10000 },
        sheep: { id: 'sheep', babyEmoji: '🐑', adultEmoji: '🐏', food: '🌿', inventoryId: 'wool', produceName: '羊毛', produceEmoji: '🧶', cost: 80, growTime: 12000, produceTime: 15000 },
        cow: { id: 'cow', babyEmoji: '🐮', adultEmoji: '🐄', food: '🌽', inventoryId: 'milk', produceName: '牛奶', produceEmoji: '🥛', cost: 120, growTime: 15000, produceTime: 20000 }
    };

    const PANEL_TABS = [
        {
            key: 'pet',
            label: '宠物',
            icon: 'fas fa-paw',
            items: [
                { kind: 'spawn', itemType: 'pet_dog', placement: 'floor', icon: 'fas fa-dog', color: '#d97706', name: '活泼柴犬' },
                { kind: 'spawn', itemType: 'pet_dog_samoyed', placement: 'floor', icon: 'fas fa-dog', color: '#cbd5e0', name: '萨摩耶' },
                { kind: 'spawn', itemType: 'pet_dog_golden', placement: 'floor', icon: 'fas fa-dog', color: '#f59e0b', name: '大金毛' },
                { kind: 'spawn', itemType: 'pet_cat', placement: 'floor', icon: 'fas fa-cat', color: '#f97316', name: '溜达橘猫' },
                { kind: 'spawn', itemType: 'pet_cat_silver', placement: 'floor', icon: 'fas fa-cat', color: '#d1d5db', name: '银渐层' },
                { kind: 'spawn', itemType: 'pet_cat_calico', placement: 'floor', icon: 'fas fa-cat', color: '#374151', name: '三花猫' }
            ]
        },
        {
            key: 'furniture',
            label: '家具',
            icon: 'fas fa-couch',
            items: [
                { kind: 'spawn', itemType: 'bed', placement: 'floor', icon: 'fas fa-bed', color: 'var(--wood-dark)', name: '小熊床' },
                { kind: 'spawn', itemType: 'sofa', placement: 'floor', icon: 'fas fa-couch', color: 'var(--primary)', name: '云朵沙发' },
                { kind: 'spawn', itemType: 'tv', placement: 'floor', icon: 'fas fa-tv', color: '#9ca3af', name: '复古电视' },
                { kind: 'spawn', itemType: 'bookshelf', placement: 'floor', icon: 'fas fa-book-open', color: '#8b5a2b', name: '大书架' },
                { kind: 'spawn', itemType: 'table', placement: 'floor', icon: 'fas fa-table-cells-large', color: 'var(--wood)', name: '原木桌' },
                { kind: 'spawn', itemType: 'desk', placement: 'floor', icon: 'fas fa-table', color: '#c08457', name: '小书桌' },
                { kind: 'spawn', itemType: 'chair', placement: 'floor', icon: 'fas fa-chair', color: '#f3c17a', name: '木椅' },
                { kind: 'spawn', itemType: 'dresser', placement: 'floor', icon: 'fas fa-box', color: '#f59e0b', name: '小斗柜' },
                { kind: 'spawn', itemType: 'wardrobe', placement: 'floor', icon: 'fas fa-door-closed', color: '#f4d7a1', name: '奶油衣柜' },
                { kind: 'spawn', itemType: 'pet_house', placement: 'floor', icon: 'fas fa-house', color: '#fb7185', name: '宠物小窝' },
                { kind: 'spawn', itemType: 'plant', placement: 'floor', icon: 'fas fa-seedling', color: 'var(--primary)', name: '圆叶绿植' },
                { kind: 'spawn', itemType: 'cactus', placement: 'floor', icon: 'fas fa-seedling', color: '#2a9d8f', name: '仙人掌' },
                { kind: 'spawn', itemType: 'lamp', placement: 'floor', icon: 'fas fa-lightbulb', color: '#fef08a', name: '落地灯' },
                { kind: 'spawn', itemType: 'pouf', placement: 'floor', icon: 'fas fa-circle', color: 'var(--secondary)', name: '软坐垫' },
                { kind: 'spawn', itemType: 'cat_lazy', placement: 'floor', icon: 'fas fa-cat', color: '#f97316', name: '猫咪垫' },
                { kind: 'spawn', itemType: 'rug', placement: 'floor', icon: 'fas fa-grip-lines', color: '#cbd5e0', name: '羊毛毯' }
            ]
        },
        {
            key: 'decor',
            label: '墙饰',
            icon: 'fas fa-image',
            items: [
                { kind: 'spawn', itemType: 'window', placement: 'wall', icon: 'fas fa-window-maximize', color: '#bae6fd', name: '拱形窗' },
                { kind: 'spawn', itemType: 'mirror', placement: 'wall', icon: 'fas fa-face-smile', color: '#fbcfe8', name: '梳妆镜' },
                { kind: 'spawn', itemType: 'painting', placement: 'wall', icon: 'fas fa-image', color: 'var(--primary)', name: '抽象挂画' },
                { kind: 'spawn', itemType: 'board', placement: 'wall', icon: 'fas fa-thumbtack', color: '#d97706', name: '软木板' },
                { kind: 'spawn', itemType: 'clock', placement: 'wall', icon: 'fas fa-clock', color: 'var(--secondary)', name: '挂钟' },
                { kind: 'spawn', itemType: 'garland', placement: 'wall', icon: 'fas fa-flag', color: 'var(--wood-dark)', name: '派对彩旗' }
            ]
        },
        {
            key: 'wallpaper',
            label: '墙纸',
            icon: 'fas fa-paint-roller',
            items: [
                { kind: 'texture', target: 'wall', background: 'linear-gradient(to bottom, #fefce8, #fef9c3)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: linear-gradient(to bottom, #fefce8, #fef9c3);', name: '奶油淡黄' },
                { kind: 'texture', target: 'wall', background: 'linear-gradient(to bottom, #fcfefe, #f0f7f4)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: linear-gradient(to bottom, #fcfefe, #f0f7f4);', name: '初雪清晨' },
                { kind: 'texture', target: 'wall', background: 'repeating-linear-gradient(0deg, #fff2f2, #fff2f2 10px, #ffffff 10px, #ffffff 20px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(0deg, #fff2f2, #fff2f2 10px, #ffffff 10px, #ffffff 20px);', name: '蜜桃条纹' },
                { kind: 'texture', target: 'wall', background: 'radial-gradient(#88d4ab 2px, transparent 2px)', bgSize: '10px 10px', bgColor: '#f0f7f4', swatchStyle: 'background: radial-gradient(#88d4ab 2px, transparent 2px); background-size: 10px 10px; background-color: #f0f7f4;', name: '薄荷波点' },
                { kind: 'texture', target: 'wall', background: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', bgSize: '10px 10px', bgColor: '#ffffff', swatchStyle: 'background: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px); background-size: 10px 10px; background-color: #fff;', name: '极简网格' },
                { kind: 'texture', target: 'wall', background: 'radial-gradient(#fef08a 2px, transparent 2px)', bgSize: '30px 30px', bgColor: '#e0f2fe', swatchStyle: 'background: radial-gradient(#fef08a 2px, transparent 2px); background-size: 15px 15px; background-color: #e0f2fe;', name: '星空蓝' }
            ]
        },
        {
            key: 'floor',
            label: '地板',
            icon: 'fas fa-border-all',
            items: [
                { kind: 'texture', target: 'floor', background: 'repeating-linear-gradient(90deg, #fcd34d, #fcd34d 30px, #fbbf24 30px, #fbbf24 32px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(90deg, #fcd34d, #fcd34d 10px, #fbbf24 10px, #fbbf24 12px);', name: '明亮木纹' },
                { kind: 'texture', target: 'floor', background: '#e8f4ec', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: #e8f4ec;', name: '浅草绿' },
                { kind: 'texture', target: 'floor', background: 'repeating-linear-gradient(90deg, #e2e8f0, #e2e8f0 30px, #cbd5e0 30px, #cbd5e0 32px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(90deg, #e2e8f0, #e2e8f0 10px, #cbd5e0 10px, #cbd5e0 12px);', name: '灰白木纹' },
                { kind: 'texture', target: 'floor', background: 'repeating-linear-gradient(90deg, #8b5a2b, #8b5a2b 30px, #704721 30px, #704721 32px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(90deg, #8b5a2b, #8b5a2b 10px, #704721 10px, #704721 12px);', name: '深色胡桃' },
                { kind: 'texture', target: 'floor', background: 'conic-gradient(#88d4ab 90deg, #fff 90deg 180deg, #88d4ab 180deg 270deg, #fff 270deg)', bgSize: '40px 40px', bgColor: 'transparent', swatchStyle: 'background: conic-gradient(#88d4ab 90deg, #fff 90deg 180deg, #88d4ab 180deg 270deg, #fff 270deg); background-size: 20px 20px;', name: '复古棋盘' }
            ]
        }
    ];

    const SHAPE_GENERATORS = {
        pet_dog: `<div class="shape-pet pet-dog is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_dog_samoyed: `<div class="shape-pet pet-dog-samoyed is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_dog_golden: `<div class="shape-pet pet-dog-golden is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_cat: `<div class="shape-pet pet-cat is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_cat_silver: `<div class="shape-pet pet-cat-silver is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_cat_calico: `<div class="shape-pet pet-cat-calico is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        bed: `<div class="shape-bed"><div class="floor-shadow"></div><div class="bed-frame"></div><div class="bed-head"></div><div class="bed-mat"></div><div class="bed-blanket"></div><div class="bed-pillow"></div></div>`,
        sofa: `<div class="shape-sofa"><div class="floor-shadow"></div><div class="sofa-back1"></div><div class="sofa-back2"></div><div class="sofa-base"></div></div>`,
        bookshelf: `<div class="shape-bookshelf"><div class="floor-shadow"></div><div class="shelf-board b1"></div><div class="shelf-board b2"></div><div class="book bk1"></div><div class="book bk2"></div><div class="book bk3"></div></div>`,
        table: `<div class="shape-table"><div class="floor-shadow"></div><div class="table-leg left"></div><div class="table-leg right"></div><div class="table-top"></div></div>`,
        coffee_table: `<div class="shape-coffee-table"><div class="floor-shadow"></div><div class="coffee-top"></div><div class="coffee-apron"></div><div class="coffee-shelf"></div><div class="coffee-leg fl"></div><div class="coffee-leg fr"></div><div class="coffee-leg bl"></div><div class="coffee-leg br"></div></div>`,
        desk: `<div class="shape-desk"><div class="floor-shadow"></div><div class="desk-leg left"></div><div class="desk-leg right"></div><div class="desk-top"></div><div class="desk-drawer"></div><div class="desk-note"></div></div>`,
        chair: `<div class="shape-chair"><div class="floor-shadow"></div><div class="chair-back-frame"></div><div class="chair-back-cushion"></div><div class="chair-seat"></div><div class="chair-leg back-left"></div><div class="chair-leg back-right"></div><div class="chair-leg front-left"></div><div class="chair-leg front-right"></div><div class="chair-bar"></div></div>`,
        dresser: `<div class="shape-dresser"><div class="floor-shadow"></div><div class="dresser-body"></div><div class="dresser-top"></div><div class="dresser-drawer d1"></div><div class="dresser-drawer d2"></div><div class="dresser-drawer d3"></div><div class="dresser-knob k1"></div><div class="dresser-knob k2"></div><div class="dresser-knob k3"></div></div>`,
        wardrobe: `<div class="shape-wardrobe"><div class="floor-shadow"></div><div class="wardrobe-body"></div><div class="wardrobe-door left"></div><div class="wardrobe-door right"></div><div class="wardrobe-handle left"></div><div class="wardrobe-handle right"></div><div class="wardrobe-base"></div></div>`,
        pet_house: `<div class="shape-pet-house"><div class="floor-shadow"></div><div class="pet-house-roof"></div><div class="pet-house-body"></div><div class="pet-house-entry"></div><div class="pet-house-cushion"></div></div>`,
        cactus: `<div class="shape-cactus"><div class="floor-shadow"></div><div class="cac-arm"></div><div class="cac-body"></div><div class="cac-pot"></div></div>`,
        lamp: `<div class="shape-lamp"><div class="floor-shadow"></div><div class="lamp-base"></div><div class="lamp-pole"></div><div class="lamp-shade"></div></div>`,
        pouf: `<div class="shape-pouf"><div class="floor-shadow"></div><div class="pouf-body"></div></div>`,
        rug: `<div class="shape-rug"></div>`,
        plant: `<div class="shape-plant"><div class="floor-shadow"></div><div class="plant-leaf leaf-3"></div><div class="plant-leaf leaf-2"></div><div class="plant-leaf leaf-1"></div><div class="plant-pot"></div></div>`,
        flora_portal_plant: `<div class="shape-flora-portal flora-portal-state-healthy"><div class="flora-portal-particle-system"><div class="flora-portal-particle" style="left: 20%; animation-delay: 0s;">&#10024;</div><div class="flora-portal-particle" style="left: 70%; animation-delay: 1.5s;">&#127807;</div><div class="flora-portal-particle" style="left: 45%; animation-delay: 0.8s;">&#127793;</div></div><div class="flora-portal-art-flower"></div><div class="flora-portal-art-leaf flora-portal-l1"></div><div class="flora-portal-art-leaf flora-portal-l2"></div><div class="flora-portal-art-leaf flora-portal-l3"></div><div class="flora-portal-art-leaf flora-portal-l4"></div><div class="flora-portal-art-stem"></div><div class="flora-portal-art-pot"></div><div class="flora-portal-floor-shadow"></div></div>`,
        tv: `<div class="shape-tv"><div class="floor-shadow"></div><div class="tv-leg1"></div><div class="tv-leg2"></div><div class="tv-antenna"></div><div class="tv-screen"></div><div class="tv-knob k1"></div><div class="tv-knob k2"></div></div>`,
        cat_lazy: `<div class="shape-cat-lazy"><div class="floor-shadow"></div><div class="cat-mat"></div><div class="cat-tail-lazy"></div><div class="cat-body"></div><div class="cat-ear1"></div><div class="cat-ear2"></div></div>`,
        window: `<div class="shape-window"><div class="win-sun"></div></div>`,
        mirror: `<div class="shape-mirror"><div class="mirror-glare"></div></div>`,
        garland: `<div class="shape-garland"><div class="garland-line"></div><div class="flag f1"></div><div class="flag f2"></div><div class="flag f3"></div></div>`,
        painting: `<div class="shape-painting"><div class="paint-hill"></div></div>`,
        clock: `<div class="shape-clock"><div class="clock-center"></div><div class="clock-hand1"></div><div class="clock-hand2"></div></div>`,
        board: `<div class="shape-board"><div class="board-p1"><div class="board-pin"></div></div><div class="board-p2"></div><div class="board-p3"></div></div>`
    };




    const FLORA_STATES = {
        blooming: {
            particlesVisible: true,
            particles: [
                { left: '30%', delay: '0s', label: '\u2728' },
                { left: '60%', delay: '1s', label: '\u{1F339}' }
            ],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">\u521a\u521a</div>
                    <div class="garden-flora-msg-bubble is-positive">
                        <i class="ph-fill ph-flower-tulip"></i>TA \u5bf9\u4f60\u8868\u8fbe\u4e86\u5f88\u591a\u559c\u6b22\u548c\u5fc3\u52a8\uff0c\u7eff\u690d\u5f00\u51fa\u4e86\u6f02\u4eae\u7684\u5c0f\u82b1\u3002
                    </div>
                </div>`
        },
        healthy: {
            particlesVisible: true,
            particles: [
                { left: '20%', delay: '0s', label: '\u2728' },
                { left: '70%', delay: '1.5s', label: '\u{1F33F}' },
                { left: '45%', delay: '0.8s', label: '\u{1F331}' }
            ],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">10:42</div>
                    <div class="garden-flora-msg-bubble is-positive">
                        <i class="ph-fill ph-smiley"></i>TA \u521a\u521a\u56de\u4e86\u4f60\u4e00\u53e5\u201c\u54c8\u54c8\u54c8\u54c8\u201d\uff0c\u7eff\u690d\u5438\u6536\u5230\u4e86\u5feb\u4e50\u517b\u5206\u3002
                    </div>
                </div>
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">09:15</div>
                    <div class="garden-flora-msg-bubble">
                        <i class="ph-fill ph-cloud-rain" style="color: #5ac8fa;"></i>\u4eca\u5929\u8bb0\u5f97\u4e5f\u6765\u6d47\u6d47\u6c34\uff0c\u966a\u5b83\u8bf4\u8bf4\u8bdd\u3002
                    </div>
                </div>`
        },
        withering: {
            particlesVisible: false,
            particles: [],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">\u6628\u5929</div>
                    <div class="garden-flora-msg-bubble is-negative">
                        <i class="ph-fill ph-warning-circle"></i>\u4f60\u4eec\u5df2\u7ecf\u8d85\u8fc7 24 \u5c0f\u65f6\u6ca1\u6709\u8ba4\u771f\u4e92\u52a8\u4e86\uff0c\u7eff\u690d\u5f00\u59cb\u6709\u70b9\u7f3a\u6c34\u53d1\u853b\u3002
                    </div>
                </div>`
        },
        withered: {
            particlesVisible: false,
            particles: [],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">\u4e09\u5929\u524d</div>
                    <div class="garden-flora-msg-bubble is-negative">
                        <i class="ph-fill ph-heart-break"></i>\u6700\u8fd1\u6355\u6349\u5230\u4e86\u51b7\u6de1\u6216\u4e89\u5435\u7684\u60c5\u7eea\uff0c\u690d\u7269\u6709\u70b9\u5931\u53bb\u751f\u673a\u4e86\uff0c\u5feb\u53bb\u54c4\u54c4 TA \u5427\u3002
                    </div>
                </div>`
        }
    };

    const state = {
        initialized: false,
        gardenMode: 'casual',
        gardenGame: null,
        casualGardenGame: null,
        rogueActivityGame: null,
        activeTab: 'pet',
        currentView: 'home',
        drawerOpen: false,
        currentHomeSection: 'home',
        homeEntryMenuOpen: false,
        farmScreenOpen: false,
        pastureScreenOpen: false,
        kitchenScreenOpen: false,
        farmToastTimeout: null,
        pastureToastTimeout: null,
        kitchenToastTimeout: null,
        roguePanelOpen: false,
        homeTutorialDismissed: false,
        farmGame: {
            initialized: false,
            progressTimer: null,
            currentTool: 'pointer',
            currentSeed: 'wheat'
        },
        pastureGame: {
            initialized: false,
            progressTimer: null,
            roamTimer: null,
            visualEatingUntil: {},
            currentTool: 'pointer',
            selectedAnimalToBuy: 'chicken'
        },
        kitchenGame: {
            initialized: false,
            qteActive: false,
            currentRecipeId: null,
            currentAngle: 0,
            spinDuration: 0,
            startTime: 0,
            whiteStart: 0,
            whiteEnd: 0,
            yellowStart: 0,
            yellowEnd: 0
        },
        storageSell: {
            itemId: null,
            qty: 1
        },
        toastTimeout: null,
        saveResetTimer: null,
        saveDoneTimer: null,
        shadowRoot: null,
        roomEl: null,
        wallEl: null,
        floorEl: null,
        residentLayerEl: null,
        toastEl: null,
        drawerEl: null,
        tabsEl: null,
        panelContentEl: null,
        floraState: 'healthy',
        floraOpen: false,
        currentGardenContactId: null,
        gardenLayouts: null,
        residentFigureEl: null,
        residentFigureLoopTimer: null,
        residentFigureMoveTimer: null,
        residentFigurePreloadToken: 0,
        residentFigureImageCache: new Map(),
        residentFigureAssetDbPromise: null,
        residentFigureAssetUrlCache: new Map(),
        residentFigurePoseToken: 0,
        contactFigureDraftFiles: {
            idle: null,
            runLeft: null,
            runRight: null
        },
        contactFigureEditingId: null
    };

    let screenEl;
    let closeBtn;
    let togglePanelBtn;
    let saveBtn;
    let viewEls;
    let navBtns;
    let activitiesViewEl;
    let storageViewEl;
    let storageGridEl;
    let storageTabBtns = [];
    let storageSellSheetEl;
    let storageSellBackdropEl;
    let storageSellIconEl;
    let storageSellNameEl;
    let storageSellStockEl;
    let storageSellPriceEl;
    let storageSellQtyEl;
    let storageSellTotalEl;
    let storageSellConfirmBtn;
    let homeEntryMenuEl;
    let farmScreenEl;
    let farmCloseBtn;
    let farmGridEl;
    let farmSeedPanelEl;
    let farmSeedListEl;
    let farmCoinsEl;
    let farmLevelEl;
    let farmToolBtns = [];
    let farmToastEl;
    let pastureScreenEl;
    let pastureCloseBtn;
    let pastureFieldEl;
    let pastureShopPanelEl;
    let pastureCoinsEl;
    let pastureExpEl;
    let pastureToolBtns = [];
    let pastureShopItems = [];
    let pastureToastEl;
    let kitchenScreenEl;
    let kitchenCloseBtn;
    let kitchenOverlayEl;
    let kitchenQteContainerEl;
    let kitchenQteDialEl;
    let kitchenQtePointerEl;
    let kitchenQteHintEl;
    let kitchenToastEl;
    let kitchenCookBtns = [];
    let rogueProgressStripEl;
    let rogueProgressStageEl;
    let rogueProgressCardsEl;
    let rogueProgressGoalEl;
    let rogueProgressOrderEl;
    let rogueProgressPanelEl;
    let rogueProgressPanelStageEl;
    let rogueProgressPanelCardsEl;
    let rogueProgressPanelGoalEl;
    let rogueProgressPanelOrderEl;
    let rogueOfferModalEl;
    let rogueOfferTitleEl;
    let rogueOfferDescEl;
    let rogueOfferChoicesEl;
    let storageOrderCardEl;
    let kitchenSkipBtnEl;
    let homeTutorialCardEl;
    let homeTutorialReopenBtnEl;
    let editorHost;
    let titleTextEl;
    let floraScreenEl;
    let floraAppEl;
    let floraBackBtn;
    let floraArtEl;
    let floraParticlesEl;
    let floraLogContentEl;
    let floraToggleBtns = [];
    let contactFigureModalEl;
    let contactFigureModalTitleEl;
    let contactFigureIdleInputEl;
    let contactFigureRunLeftInputEl;
    let contactFigureRunRightInputEl;
    let contactFigureIdlePreviewEl;
    let contactFigureRunLeftPreviewEl;
    let contactFigureRunRightPreviewEl;

    function createEmptyInventory() {
        return INVENTORY_ITEM_IDS.reduce((result, itemId) => {
            result[itemId] = 0;
            return result;
        }, {});
    }

    function createEmptyFarmPlotState() {
        return {
            state: 'empty',
            seedId: '',
            readyAt: null,
            growDuration: null
        };
    }

    function createInitialPastureAnimals() {
        return [
            { id: 'starter_chicken_1', type: 'chicken', age: 'baby', state: 'hungry', x: 30, y: 40, stateEndsAt: null },
            { id: 'starter_chicken_2', type: 'chicken', age: 'adult', state: 'hungry', x: 70, y: 60, stateEndsAt: null }
        ];
    }

    function createDefaultRogueRun(completedRuns = 0) {
        return {
            runId: `rogue_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            stage: 'farm',
            progress: {
                farmHarvests: 0,
                pastureHarvests: 0,
                kitchenSuccesses: 0,
                ordersCompleted: 0
            },
            selectedCards: [],
            activeModifiers: {},
            currentOffer: null,
            currentSupplyOffer: null,
            currentOrder: null,
            completedRuns: Math.max(0, Math.floor(Number(completedRuns) || 0))
        };
    }

    function normalizeRogueModifierState(rawModifier) {
        if (!rawModifier || typeof rawModifier !== 'object') return null;
        const remaining = isFiniteNumber(Number(rawModifier.remaining)) ? Math.max(0, Math.floor(Number(rawModifier.remaining))) : null;
        const value = isFiniteNumber(Number(rawModifier.value)) ? Number(rawModifier.value) : null;
        const flags = Array.isArray(rawModifier.flags)
            ? rawModifier.flags.map((flag) => String(flag)).filter(Boolean)
            : [];
        return { remaining, value, flags };
    }

    function normalizeRogueOffer(rawOffer) {
        if (!rawOffer || typeof rawOffer !== 'object') return null;
        const context = ['farm', 'pasture', 'kitchen', 'sell'].includes(rawOffer.context) ? rawOffer.context : null;
        if (!context) return null;
        const cardIds = Array.isArray(rawOffer.cardIds)
            ? Array.from(new Set(rawOffer.cardIds.filter((cardId) => ROGUE_CARD_POOL[cardId] && ROGUE_CARD_POOL[cardId].context == context))).slice(0, 3)
            : [];
        if (!cardIds.length) return null;
        return { context, cardIds };
    }

    function normalizeRogueSupplyOffer(rawOffer) {
        if (!rawOffer || typeof rawOffer !== 'object') return null;
        const stage = ['farm', 'pasture', 'kitchen'].includes(rawOffer.stage) ? rawOffer.stage : null;
        if (!stage) return null;
        const optionIds = Array.isArray(rawOffer.optionIds)
            ? Array.from(new Set(rawOffer.optionIds.filter((optionId) => {
                return (STAGE_SUPPLY_POOL[stage] || []).some((entry) => entry.id === optionId);
            }))).slice(0, 3)
            : [];
        if (!optionIds.length) return null;
        return { stage, optionIds };
    }

    function normalizeRogueOrder(rawOrder) {
        if (!rawOrder || typeof rawOrder !== 'object') return null;
        const lines = Array.isArray(rawOrder.lines)
            ? rawOrder.lines.map((line) => {
                if (!line || typeof line !== 'object' || !ITEM_META[line.itemId]) return null;
                const requiredQty = isFiniteNumber(Number(line.requiredQty)) ? Math.max(1, Math.floor(Number(line.requiredQty))) : 1;
                const fulfilledQty = isFiniteNumber(Number(line.fulfilledQty))
                    ? Math.max(0, Math.min(requiredQty, Math.floor(Number(line.fulfilledQty))))
                    : 0;
                return { itemId: line.itemId, requiredQty, fulfilledQty };
            }).filter(Boolean).slice(0, 2)
            : [];
        if (!lines.length) return null;
        return {
            orderId: rawOrder.orderId ? String(rawOrder.orderId) : `rogue_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title: rawOrder.title ? String(rawOrder.title) : '特殊订单',
            lines,
            baseValue: isFiniteNumber(Number(rawOrder.baseValue)) ? Math.max(0, Math.floor(Number(rawOrder.baseValue))) : 0,
            bonusGold: isFiniteNumber(Number(rawOrder.bonusGold)) ? Math.max(0, Math.floor(Number(rawOrder.bonusGold))) : 0
        };
    }

    function normalizeRogueRun(rawRun) {
        const defaults = createDefaultRogueRun(rawRun && rawRun.completedRuns);
        if (!rawRun || typeof rawRun !== 'object') return defaults;
        const progressSource = rawRun.progress && typeof rawRun.progress === 'object' ? rawRun.progress : {};
        const activeModifiers = {};
        Object.keys(ROGUE_CARD_POOL).forEach((cardId) => {
            const normalizedModifier = normalizeRogueModifierState(rawRun.activeModifiers && rawRun.activeModifiers[cardId]);
            if (!normalizedModifier) return;
            if (normalizedModifier.remaining === 0 && normalizedModifier.value === null && !normalizedModifier.flags.length) return;
            activeModifiers[cardId] = normalizedModifier;
        });
        return {
            ...defaults,
            runId: rawRun.runId ? String(rawRun.runId) : defaults.runId,
            stage: ROGUE_STAGE_LABELS[rawRun.stage] ? rawRun.stage : defaults.stage,
            progress: {
                farmHarvests: isFiniteNumber(Number(progressSource.farmHarvests)) ? Math.max(0, Math.floor(Number(progressSource.farmHarvests))) : 0,
                pastureHarvests: isFiniteNumber(Number(progressSource.pastureHarvests)) ? Math.max(0, Math.floor(Number(progressSource.pastureHarvests))) : 0,
                kitchenSuccesses: isFiniteNumber(Number(progressSource.kitchenSuccesses)) ? Math.max(0, Math.floor(Number(progressSource.kitchenSuccesses))) : 0,
                ordersCompleted: isFiniteNumber(Number(progressSource.ordersCompleted)) ? Math.max(0, Math.floor(Number(progressSource.ordersCompleted))) : 0
            },
            selectedCards: Array.isArray(rawRun.selectedCards)
                ? Array.from(new Set(rawRun.selectedCards.filter((cardId) => ROGUE_CARD_POOL[cardId]))).slice(0, 4)
                : [],
            activeModifiers,
            currentOffer: normalizeRogueOffer(rawRun.currentOffer),
            currentSupplyOffer: normalizeRogueSupplyOffer(rawRun.currentSupplyOffer),
            currentOrder: normalizeRogueOrder(rawRun.currentOrder),
            completedRuns: isFiniteNumber(Number(rawRun.completedRuns)) ? Math.max(0, Math.floor(Number(rawRun.completedRuns))) : defaults.completedRuns
        };
    }

    function createDefaultGardenGameState(options) {
        const includeRogue = !!(options && options.includeRogue);
        const baseState = {
            coins: 250,
            inventory: createEmptyInventory(),
            farm: {
                level: 1,
                exp: 0,
                plots: Array.from({ length: 9 }, () => createEmptyFarmPlotState())
            },
            pasture: {
                level: 2,
                animals: createInitialPastureAnimals()
            },
            storage: {
                tab: 'crops'
            }
        };
        if (includeRogue) {
            baseState.rogueRun = createDefaultRogueRun(0);
        }
        return baseState;
    }

    function createDefaultRogueActivityGameState() {
        return createDefaultGardenGameState({ includeRogue: true });
    }

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function formatFarmDuration(ms) {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function sanitizeStorageTab(tab) {
        return STORAGE_TABS[tab] ? tab : 'crops';
    }

    function normalizeInventory(rawInventory) {
        const inventory = createEmptyInventory();
        if (!rawInventory || typeof rawInventory !== 'object') return inventory;
        INVENTORY_ITEM_IDS.forEach((itemId) => {
            const count = Number(rawInventory[itemId]);
            inventory[itemId] = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
        });
        return inventory;
    }

    function advanceFarmPlotByClock(plot, now) {
        if (!plot || plot.state !== 'growing' || !isFiniteNumber(plot.readyAt)) return false;
        if (plot.readyAt > now) return false;
        plot.state = 'ready';
        plot.readyAt = null;
        plot.growDuration = null;
        return true;
    }

    function normalizeFarmPlot(rawPlot, now) {
        const plot = createEmptyFarmPlotState();
        if (!rawPlot || typeof rawPlot !== 'object') return plot;

        const nextState = rawPlot.state;
        plot.state = nextState === 'planted' || nextState === 'growing' || nextState === 'ready' ? nextState : 'empty';
        plot.seedId = FARM_SEEDS[rawPlot.seedId] ? rawPlot.seedId : '';
        plot.readyAt = isFiniteNumber(rawPlot.readyAt) ? rawPlot.readyAt : null;
        plot.growDuration = isFiniteNumber(rawPlot.growDuration) ? Math.max(1000, Math.floor(rawPlot.growDuration)) : null;

        if (!plot.seedId) {
            return createEmptyFarmPlotState();
        }
        if (plot.state === 'empty') {
            return createEmptyFarmPlotState();
        }
        if (plot.state === 'ready') {
            plot.readyAt = null;
            plot.growDuration = null;
            return plot;
        }
        if (plot.state === 'planted') {
            plot.readyAt = null;
            plot.growDuration = null;
            return plot;
        }
        if (!isFiniteNumber(plot.readyAt)) {
            plot.state = 'planted';
            plot.readyAt = null;
            plot.growDuration = null;
            return plot;
        }
        if (!isFiniteNumber(plot.growDuration)) {
            const seed = FARM_SEEDS[plot.seedId];
            plot.growDuration = seed ? seed.time : null;
        }
        advanceFarmPlotByClock(plot, now);
        return plot;
    }

    function advancePastureAnimalByClock(animal, now) {
        let changed = false;
        while (animal && isFiniteNumber(animal.stateEndsAt) && animal.stateEndsAt <= now) {
            if (animal.state === 'growing') {
                animal.age = 'adult';
                animal.state = 'hungry';
                animal.stateEndsAt = null;
                changed = true;
                continue;
            }
            if (animal.state === 'producing') {
                animal.state = 'ready';
                animal.stateEndsAt = null;
                changed = true;
                continue;
            }
            animal.stateEndsAt = null;
            changed = true;
        }
        return changed;
    }

    function normalizePastureAnimal(rawAnimal, now) {
        if (!rawAnimal || typeof rawAnimal !== 'object') return null;
        if (!PASTURE_ANIMAL_DATA[rawAnimal.type]) return null;

        const animal = {
            id: rawAnimal.id ? String(rawAnimal.id) : `animal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: rawAnimal.type,
            age: rawAnimal.age === 'adult' ? 'adult' : 'baby',
            state: ['hungry', 'growing', 'producing', 'ready'].includes(rawAnimal.state) ? rawAnimal.state : 'hungry',
            x: isFiniteNumber(Number(rawAnimal.x)) ? Number(rawAnimal.x) : 50,
            y: isFiniteNumber(Number(rawAnimal.y)) ? Number(rawAnimal.y) : 50,
            stateEndsAt: isFiniteNumber(Number(rawAnimal.stateEndsAt)) ? Number(rawAnimal.stateEndsAt) : null
        };
        if (animal.age === 'baby' && animal.state === 'ready') {
            animal.state = 'hungry';
        }
        if (animal.age === 'baby' && animal.state === 'producing') {
            animal.state = 'growing';
        }
        advancePastureAnimalByClock(animal, now);
        return animal;
    }

    function normalizeGardenGameState(rawState, options) {
        const includeRogue = !!(options && options.includeRogue);
        const defaults = includeRogue ? createDefaultRogueActivityGameState() : createDefaultGardenGameState();
        const now = Date.now();
        if (!rawState || typeof rawState !== 'object') return defaults;

        const farmPlots = Array.from({ length: 9 }, (_, index) => normalizeFarmPlot(rawState.farm && rawState.farm.plots ? rawState.farm.plots[index] : null, now));
        const hasPastureAnimals = !!(rawState.pasture && Array.isArray(rawState.pasture.animals));
        const animalsSource = hasPastureAnimals ? rawState.pasture.animals : defaults.pasture.animals;
        const animals = animalsSource
            .map((animal) => normalizePastureAnimal(animal, now))
            .filter(Boolean);

        const normalizedState = {
            coins: isFiniteNumber(Number(rawState.coins)) ? Math.max(0, Math.floor(Number(rawState.coins))) : defaults.coins,
            inventory: normalizeInventory(rawState.inventory),
            farm: {
                level: isFiniteNumber(Number(rawState.farm && rawState.farm.level)) ? Math.max(1, Math.floor(Number(rawState.farm.level))) : defaults.farm.level,
                exp: isFiniteNumber(Number(rawState.farm && rawState.farm.exp)) ? Math.max(0, Math.floor(Number(rawState.farm.exp))) : defaults.farm.exp,
                plots: farmPlots
            },
            pasture: {
                level: isFiniteNumber(Number(rawState.pasture && rawState.pasture.level)) ? Math.max(1, Math.floor(Number(rawState.pasture.level))) : defaults.pasture.level,
                animals: hasPastureAnimals ? animals : createInitialPastureAnimals()
            },
            storage: {
                tab: sanitizeStorageTab(rawState.storage && rawState.storage.tab)
            }
        };
        if (includeRogue) {
            normalizedState.rogueRun = normalizeRogueRun(rawState.rogueRun);
        }
        return normalizedState;
    }

    function getGardenGameStorageKey(mode) {
        return mode === 'rogue_activity' ? GARDEN_ROGUE_ACTIVITY_STATE_STORAGE_KEY : GARDEN_GAME_STATE_STORAGE_KEY;
    }

    function loadGardenGameState(mode = 'casual') {
        const isRogueActivity = mode === 'rogue_activity';
        const defaultState = isRogueActivity ? createDefaultRogueActivityGameState() : createDefaultGardenGameState();
        try {
            const raw = window.localStorage.getItem(getGardenGameStorageKey(mode));
            if (!raw) return defaultState;
            return normalizeGardenGameState(JSON.parse(raw), { includeRogue: isRogueActivity });
        } catch (error) {
            return defaultState;
        }
    }

    function hasPersistedRogueActivitySave() {
        try {
            return !!window.localStorage.getItem(GARDEN_ROGUE_ACTIVITY_STATE_STORAGE_KEY);
        } catch (error) {
            return false;
        }
    }

    function syncGardenGameReference() {
        state.gardenGame = state.gardenMode === 'rogue_activity'
            ? state.rogueActivityGame
            : state.casualGardenGame;
    }

    function saveGardenGameState() {
        const mode = state.gardenMode === 'rogue_activity' ? 'rogue_activity' : 'casual';
        const gameState = mode === 'rogue_activity' ? state.rogueActivityGame : state.casualGardenGame;
        if (!gameState) return;
        try {
            window.localStorage.setItem(getGardenGameStorageKey(mode), JSON.stringify(gameState));
        } catch (error) {
            return;
        }
    }

    function setGardenMode(mode) {
        const nextMode = mode === 'rogue_activity' ? 'rogue_activity' : 'casual';
        if (nextMode === 'rogue_activity' && !state.rogueActivityGame) {
            state.rogueActivityGame = loadGardenGameState('rogue_activity');
        }
        if (nextMode === 'casual' && !state.casualGardenGame) {
            state.casualGardenGame = loadGardenGameState('casual');
        }
        state.gardenMode = nextMode;
        syncGardenGameReference();
        if (screenEl) {
            screenEl.classList.toggle('is-rogue-activity-mode', state.gardenMode === 'rogue_activity');
            screenEl.classList.toggle('is-casual-garden-mode', state.gardenMode !== 'rogue_activity');
        }
    }

    function getInventoryCount(itemId) {
        return state.gardenGame && state.gardenGame.inventory && isFiniteNumber(Number(state.gardenGame.inventory[itemId]))
            ? Math.max(0, Math.floor(Number(state.gardenGame.inventory[itemId])))
            : 0;
    }

    function addInventoryItem(itemId, amount) {
        if (!state.gardenGame || !ITEM_META[itemId]) return;
        const nextAmount = Math.max(0, getInventoryCount(itemId) + amount);
        state.gardenGame.inventory[itemId] = nextAmount;
    }

    function hasInventoryItems(ingredients) {
        return Object.entries(ingredients || {}).every(([itemId, requiredCount]) => getInventoryCount(itemId) >= requiredCount);
    }

    function spendInventoryItems(ingredients) {
        if (!hasInventoryItems(ingredients)) return false;
        Object.entries(ingredients || {}).forEach(([itemId, requiredCount]) => {
            addInventoryItem(itemId, -requiredCount);
        });
        return true;
    }

    function getFarmPlots() {
        return state.gardenGame ? state.gardenGame.farm.plots : [];
    }

    function getPastureAnimals() {
        return state.gardenGame ? state.gardenGame.pasture.animals : [];
    }

    function updateGardenCoins(amount) {
        if (!state.gardenGame) return;
        state.gardenGame.coins = Math.max(0, state.gardenGame.coins + amount);
        syncFarmStats();
        syncPastureStats();
    }

    function syncActivitiesFarmCardUi() {
        const farmCard = activitiesViewEl
            ? activitiesViewEl.querySelector('[data-activities-card="farm"]')
            : document.querySelector('#garden-app [data-activities-card="farm"]');
        if (!farmCard) return;
        const descEl = farmCard.querySelector('.garden-activities-desc');
        const statsTextEl = farmCard.querySelector('.garden-activities-stats span');
        const playBtn = farmCard.querySelector('.garden-activities-play-btn');
        const hasProgress = hasPendingRogueActivityProgress();
        if (descEl) {
            descEl.textContent = '四阶段轻肉鸽周目：农场 → 牧场 → 厨房 → 出售。';
        }
        if (statsTextEl) {
            statsTextEl.textContent = hasProgress ? '周目进行中 · 点击继续挑战' : '轻肉鸽挑战 · 点击进入挑战';
        }
        if (playBtn) {
            playBtn.setAttribute('aria-label', hasProgress ? 'continue farm rogue challenge' : 'start farm rogue challenge');
            playBtn.title = hasProgress ? '继续挑战' : '进入挑战';
        }
        farmCard.classList.toggle('is-highlight', true);
    }

    function refreshGardenEconomyUi() {
        syncFarmStats();
        syncPastureStats();
        syncKitchenCookButtons();
        renderStorageItems(state.gardenGame && state.gardenGame.storage ? state.gardenGame.storage.tab : 'crops');
        syncStorageSellSheetUi();
        syncGardenRogueUi();
        syncActivitiesFarmCardUi();
    }

    function refreshGardenModeViews() {
        refreshGardenEconomyUi();
        renderFarmPlots();
        renderPastureAnimals();
    }

    function showRogueToast(message) {
        if (!message) return;
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(message, 2200);
            return;
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 1800, 'info');
        }
    }

    function isRogueActivityMode() {
        return state.gardenMode === 'rogue_activity';
    }

    function getRogueRun() {
        return isRogueActivityMode() && state.gardenGame ? state.gardenGame.rogueRun : null;
    }

    function ensureRogueRun() {
        if (!isRogueActivityMode() || !state.gardenGame) return null;
        if (!state.gardenGame.rogueRun) {
            state.gardenGame.rogueRun = createDefaultRogueRun(0);
        }
        return state.gardenGame.rogueRun;
    }

    function getRogueCardContextForStage(stage) {
        if (stage === 'farm') return 'farm';
        if (stage === 'pasture') return 'pasture';
        if (stage === 'kitchen') return 'kitchen';
        if (stage === 'sell_setup') return 'sell';
        return null;
    }

    function getNextRogueStageAfterSupply(stage) {
        if (stage === 'farm') return 'pasture';
        if (stage === 'pasture') return 'kitchen';
        if (stage === 'kitchen') return 'sell_setup';
        return null;
    }

    function getSupplyOptionDef(stage, optionId) {
        return (STAGE_SUPPLY_POOL[stage] || []).find((entry) => entry.id === optionId) || null;
    }

    function createRogueSupplyOffer(stage) {
        const run = ensureRogueRun();
        const options = STAGE_SUPPLY_POOL[stage] || [];
        if (!run || !options.length) return null;
        run.currentSupplyOffer = {
            stage,
            optionIds: options.map((entry) => entry.id).slice(0, 3)
        };
        return run.currentSupplyOffer;
    }

    function createPastureAnimalRewardState(type) {
        const x = 18 + (Math.random() * 64);
        const y = 24 + (Math.random() * 52);
        return createPastureAnimalState(type, x, y, false);
    }

    function applyRogueSupplyReward(optionId) {
        const run = ensureRogueRun();
        const offer = run ? run.currentSupplyOffer : null;
        const option = offer ? getSupplyOptionDef(offer.stage, optionId) : null;
        if (!run || !offer || !option) return false;
        if (option.rewardType === 'coins') {
            updateGardenCoins(option.amount || 0);
        } else if (option.rewardType === 'animal' && option.animalType) {
            getPastureAnimals().push(createPastureAnimalRewardState(option.animalType));
        } else if (option.rewardType === 'items' && option.items) {
            Object.entries(option.items).forEach(([itemId, amount]) => {
                addInventoryItem(itemId, Math.max(0, Math.floor(Number(amount) || 0)));
            });
        }
        return true;
    }

    function hasPendingRogueActivityProgress() {
        if (!hasPersistedRogueActivitySave()) return false;
        const game = state.rogueActivityGame || loadGardenGameState('rogue_activity');
        const run = game && game.rogueRun ? game.rogueRun : null;
        if (!run) return false;
        return true;
    }

    function getSelectedRogueCardDefs() {
        const run = getRogueRun();
        if (!run || !Array.isArray(run.selectedCards)) return [];
        return run.selectedCards.map((cardId) => ROGUE_CARD_POOL[cardId]).filter(Boolean);
    }

    function hasSelectedRogueCardForContext(context) {
        return getSelectedRogueCardDefs().some((card) => card.context === context);
    }

    function getRogueModifier(cardId) {
        const run = getRogueRun();
        if (!run || !run.activeModifiers) return null;
        return run.activeModifiers[cardId] || null;
    }

    function isRogueModifierActive(cardId) {
        const modifier = getRogueModifier(cardId);
        if (!modifier) return false;
        return modifier.remaining == null || modifier.remaining > 0;
    }

    function getRogueModifierValue(cardId, fallbackValue) {
        const modifier = getRogueModifier(cardId);
        if (modifier && isFiniteNumber(Number(modifier.value))) return Number(modifier.value);
        const card = ROGUE_CARD_POOL[cardId];
        if (card && card.values && isFiniteNumber(Number(card.values.value))) return Number(card.values.value);
        return fallbackValue;
    }

    function createRogueModifierState(cardId) {
        const card = ROGUE_CARD_POOL[cardId];
        if (!card) return null;
        const values = card.values || {};
        return {
            remaining: isFiniteNumber(Number(values.remaining)) ? Math.max(1, Math.floor(Number(values.remaining))) : null,
            value: isFiniteNumber(Number(values.value)) ? Number(values.value) : null,
            flags: Array.isArray(values.flags) ? values.flags.map((flag) => String(flag)).filter(Boolean) : []
        };
    }

    function applyRogueCardModifier(cardId) {
        const run = ensureRogueRun();
        if (!run) return;
        const modifier = createRogueModifierState(cardId);
        if (!modifier) return;
        run.activeModifiers[cardId] = modifier;
    }

    function consumeRogueModifier(cardId, amount = 1) {
        const run = ensureRogueRun();
        if (!run || !run.activeModifiers || !run.activeModifiers[cardId]) return false;
        const modifier = run.activeModifiers[cardId];
        if (modifier.remaining == null) return true;
        modifier.remaining = Math.max(0, Math.floor(Number(modifier.remaining) || 0) - Math.max(1, Math.floor(amount || 1)));
        if (modifier.remaining <= 0) {
            delete run.activeModifiers[cardId];
        }
        return true;
    }

    function rogueModifierHasFlag(cardId, flag) {
        const modifier = getRogueModifier(cardId);
        return !!(modifier && Array.isArray(modifier.flags) && modifier.flags.includes(flag));
    }

    function rogueModifierAddFlag(cardId, flag) {
        const modifier = getRogueModifier(cardId);
        if (!modifier || !flag) return;
        if (!Array.isArray(modifier.flags)) modifier.flags = [];
        if (!modifier.flags.includes(flag)) modifier.flags.push(flag);
    }

    function rogueModifierRemoveFlag(cardId, flag) {
        const modifier = getRogueModifier(cardId);
        if (!modifier || !Array.isArray(modifier.flags)) return;
        modifier.flags = modifier.flags.filter((entry) => entry !== flag);
    }

    function shuffleGardenArray(list) {
        const cloned = Array.isArray(list) ? list.slice() : [];
        for (let index = cloned.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = cloned[index];
            cloned[index] = cloned[swapIndex];
            cloned[swapIndex] = temp;
        }
        return cloned;
    }

    function createRogueCardOffer(context) {
        const run = ensureRogueRun();
        if (!run) return null;
        const availableCards = shuffleGardenArray(
            Object.values(ROGUE_CARD_POOL).filter((card) => card.context === context && !run.selectedCards.includes(card.id))
        ).slice(0, 3);
        if (!availableCards.length) return null;
        run.currentOffer = {
            context,
            cardIds: availableCards.map((card) => card.id)
        };
        return run.currentOffer;
    }

    function canCookAnyKitchenRecipe() {
        return Object.values(KITCHEN_RECIPES).some((recipe) => hasInventoryItems(recipe.ingredients));
    }

    function getSellUnitPrice(itemId) {
        const meta = ITEM_META[itemId];
        if (!meta) return 0;
        let price = meta.sellPrice;
        if (meta.category === 'cooked' && isRogueModifierActive('kitchen_cooked_markup')) {
            price *= 1 + getRogueModifierValue('kitchen_cooked_markup', 0.2);
        }
        return Math.max(1, Math.round(price));
    }

    function calculateStorageSellGold(itemId, qty) {
        const sellQty = Math.max(0, Math.floor(qty || 0));
        if (sellQty < 1) return 0;
        let totalGold = getSellUnitPrice(itemId) * sellQty;
        if (sellQty >= 3 && isRogueModifierActive('sell_bulk_bonus')) {
            totalGold = Math.round(totalGold * (1 + getRogueModifierValue('sell_bulk_bonus', 0.15)));
        }
        return Math.max(0, Math.round(totalGold));
    }

    function markSellChainPending() {
        if (!isRogueModifierActive('sell_chain_bonus')) return;
        rogueModifierAddFlag('sell_chain_bonus', 'pending_next');
    }

    function takeSellChainPending() {
        if (!rogueModifierHasFlag('sell_chain_bonus', 'pending_next')) return false;
        rogueModifierRemoveFlag('sell_chain_bonus', 'pending_next');
        return true;
    }

    function calculateOrderReward(lines, options) {
        const normalizedLines = Array.isArray(lines) ? lines : [];
        const baseValue = normalizedLines.reduce((sum, line) => sum + (getSellUnitPrice(line.itemId) * line.requiredQty), 0);
        let bonusGold = Math.round(baseValue * 0.5);
        const hasCookedLine = normalizedLines.some((line) => ITEM_META[line.itemId] && ITEM_META[line.itemId].category === 'cooked');
        if (hasCookedLine && isRogueModifierActive('sell_cooked_order')) {
            bonusGold = Math.round(bonusGold * getRogueModifierValue('sell_cooked_order', 1.3));
        }
        if (options && options.chainApplied) {
            bonusGold = Math.round(bonusGold * 1.2);
        }
        if (isRogueModifierActive('sell_order_tip')) {
            bonusGold += Math.round(getRogueModifierValue('sell_order_tip', 60));
        }
        return { baseValue, bonusGold };
    }

    function getSpecialOrderCandidates() {
        return Object.keys(ITEM_META)
            .map((itemId) => ({
                itemId,
                stock: getInventoryCount(itemId),
                meta: ITEM_META[itemId],
                weight: ITEM_META[itemId].category === 'cooked' && isRogueModifierActive('sell_cooked_order') ? 2 : 1
            }))
            .filter((entry) => entry.stock > 0);
    }

    function pickWeightedSpecialOrderCandidate(candidates, excludedIds) {
        const excludedSet = excludedIds instanceof Set ? excludedIds : new Set(excludedIds || []);
        const weightedPool = [];
        (candidates || []).forEach((entry) => {
            if (!entry || excludedSet.has(entry.itemId)) return;
            for (let index = 0; index < Math.max(1, entry.weight || 1); index += 1) {
                weightedPool.push(entry);
            }
        });
        if (!weightedPool.length) return null;
        return weightedPool[Math.floor(Math.random() * weightedPool.length)];
    }

    function createSpecialOrderLine(itemId) {
        const meta = ITEM_META[itemId];
        const stock = getInventoryCount(itemId);
        if (!meta || stock < 1) return null;
        const maxQty = meta.category === 'cooked' ? 2 : 3;
        const requiredQty = Math.max(1, Math.min(stock, 1 + Math.floor(Math.random() * Math.min(maxQty, stock))));
        return { itemId, requiredQty, fulfilledQty: 0 };
    }

    function createSpecialSellOrder() {
        const run = ensureRogueRun();
        const candidates = getSpecialOrderCandidates();
        if (!run || !candidates.length) return null;
        const desiredLineCount = candidates.length >= 2 && Math.random() >= 0.75 ? 2 : 1;
        const chosenIds = [];
        const usedIds = new Set();
        while (chosenIds.length < desiredLineCount) {
            const picked = pickWeightedSpecialOrderCandidate(candidates, usedIds);
            if (!picked) break;
            chosenIds.push(picked.itemId);
            usedIds.add(picked.itemId);
        }
        if (!chosenIds.length) return null;
        const lines = chosenIds.map((itemId) => createSpecialOrderLine(itemId)).filter(Boolean);
        if (!lines.length) return null;
        const chainApplied = takeSellChainPending();
        const reward = calculateOrderReward(lines, { chainApplied });
        return {
            orderId: `rogue_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title: `特殊订单 ${Math.min(2, run.progress.ordersCompleted + 1)}/2`,
            lines,
            baseValue: reward.baseValue,
            bonusGold: reward.bonusGold
        };
    }

    function ensureSellStageOrder() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'sell_orders' || run.currentOrder || run.currentOffer || run.currentSupplyOffer) return false;
        const nextOrder = createSpecialSellOrder();
        if (!nextOrder) return false;
        run.currentOrder = nextOrder;
        return true;
    }

    function syncRogueStateConsistency() {
        const run = ensureRogueRun();
        if (!run) return false;
        let changed = false;
        if (!run.currentSupplyOffer && !run.currentOffer) {
            const currentContext = getRogueCardContextForStage(run.stage);
            if (currentContext && !hasSelectedRogueCardForContext(currentContext)) {
                changed = !!createRogueCardOffer(currentContext) || changed;
            }
        }
        changed = ensureSellStageOrder() || changed;
        return changed;
    }

    function getRogueStageGoalText() {
        const run = getRogueRun();
        if (!run) return '等待新周目开始';
        if (run.currentSupplyOffer) {
            const nextStage = getNextRogueStageAfterSupply(run.currentSupplyOffer.stage);
            return `阶段完成，领取补给后进入${ROGUE_STAGE_LABELS[nextStage] || '下一阶段'}`;
        }
        if (run.stage === 'farm') {
            if (run.currentOffer) return '先选择 1 张农场卡牌';
            return `收获作物 2 次（${Math.min(2, run.progress.farmHarvests)}/2）`;
        }
        if (run.stage === 'pasture') {
            if (run.currentOffer) return '先选择 1 张牧场卡牌';
            return `收获畜产 2 次（${Math.min(2, run.progress.pastureHarvests)}/2）`;
        }
        if (run.stage === 'kitchen') {
            if (run.currentOffer) return '先选择 1 张厨房卡牌';
            if (!canCookAnyKitchenRecipe()) return '暂无可做料理，可无惩罚跳过厨房';
            return `成功烹饪 1 次（${Math.min(1, run.progress.kitchenSuccesses)}/1）`;
        }
        if (run.stage === 'sell_setup') return run.currentOffer ? '先选择 1 张出售卡牌' : '出售卡牌已生效，准备生成特殊订单';
        if (run.stage === 'sell_orders') return run.currentOrder ? `完成特殊订单 2 张（${Math.min(2, run.progress.ordersCompleted)}/2）` : '等待可交付库存';
        return '继续推进本轮周目';
    }

    function getRogueOrderSummaryText() {
        const run = getRogueRun();
        if (!run) return '未开始';
        if (run.currentSupplyOffer) return '本阶段已完成，先领取补给';
        if (run.stage === 'sell_setup') return '选完出售卡后生成第一张订单';
        if (run.stage !== 'sell_orders') return '尚未进入出售阶段';
        if (!run.currentOrder) return '等待可交付库存';
        const completedLines = run.currentOrder.lines.map((line) => {
            const meta = ITEM_META[line.itemId];
            return `${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId} ${line.fulfilledQty}/${line.requiredQty}`;
        });
        return `${run.currentOrder.title} · ${completedLines.join(' / ')} · 奖励 ${run.currentOrder.bonusGold}`;
    }

    function renderStorageSpecialOrderCard() {
        if (!storageOrderCardEl) return;
        if (!isRogueActivityMode()) {
            storageOrderCardEl.hidden = true;
            storageOrderCardEl.innerHTML = '';
            return;
        }
        storageOrderCardEl.hidden = false;
        const run = ensureRogueRun();
        if (!run) {
            storageOrderCardEl.innerHTML = '';
            return;
        }
        const isSellStage = run.stage === 'sell_setup' || run.stage === 'sell_orders';
        storageOrderCardEl.classList.toggle('is-active', isSellStage);
        storageOrderCardEl.classList.toggle('is-idle', !isSellStage);
        if (run.stage === 'sell_setup') {
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">特殊订单</div>
                        <div class="garden-storage-order-subtitle">选完出售卡后自动生成第一张订单</div>
                    </div>
                    <div class="garden-storage-order-reward">待生成</div>
                </div>
            `;
            return;
        }
        if (run.stage !== 'sell_orders') {
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">特殊订单</div>
                        <div class="garden-storage-order-subtitle">出售阶段开始后会在这里显示订单</div>
                    </div>
                    <div class="garden-storage-order-reward">未开启</div>
                </div>
            `;
            return;
        }
        if (!run.currentOrder) {
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">特殊订单</div>
                        <div class="garden-storage-order-subtitle">等待可交付库存，仓库有货后会自动补单</div>
                    </div>
                    <div class="garden-storage-order-reward">补货中</div>
                </div>
            `;
            return;
        }
        const lineHtml = run.currentOrder.lines.map((line) => {
            const meta = ITEM_META[line.itemId];
            return `
                <div class="garden-storage-order-line">
                    <span>${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId}</span>
                    <strong>${line.fulfilledQty}/${line.requiredQty}</strong>
                </div>
            `;
        }).join('');
        storageOrderCardEl.innerHTML = `
            <div class="garden-storage-order-head">
                <div>
                    <div class="garden-storage-order-title">${run.currentOrder.title}</div>
                    <div class="garden-storage-order-subtitle">完成后额外获得 ${run.currentOrder.bonusGold} 金币</div>
                </div>
                <div class="garden-storage-order-reward">${run.progress.ordersCompleted}/2</div>
            </div>
            <div class="garden-storage-order-lines">${lineHtml}</div>
        `;
    }

    function syncKitchenSkipButton() {
        if (!kitchenSkipBtnEl) return;
        const run = getRogueRun();
        const shouldShow = !!run && run.stage === 'kitchen' && !run.currentOffer && !run.currentSupplyOffer && !canCookAnyKitchenRecipe();
        kitchenSkipBtnEl.hidden = !shouldShow;
        kitchenSkipBtnEl.disabled = !shouldShow;
    }

    function renderRogueProgressStrip() {
        const run = getRogueRun();
        if (!run) return;
        if (rogueProgressStageEl) rogueProgressStageEl.textContent = ROGUE_STAGE_LABELS[run.stage] || '农场阶段';
        if (rogueProgressCardsEl) {
            const cardTitles = getSelectedRogueCardDefs().map((card) => card.title);
            rogueProgressCardsEl.textContent = cardTitles.length ? `卡牌：${cardTitles.join(' · ')}` : '已选卡牌 0/4';
        }
        if (rogueProgressGoalEl) rogueProgressGoalEl.textContent = `目标：${getRogueStageGoalText()}`;
        if (rogueProgressOrderEl) {
            rogueProgressOrderEl.textContent = run.currentOrder
                ? `${run.currentOrder.title} · 奖励 ${run.currentOrder.bonusGold}`
                : (run.stage === 'sell_orders' ? '订单：等待可交付库存' : '订单：未开始');
        }
    }

    function renderRogueProgressPanel() {
        const run = getRogueRun();
        if (!run) return;
        if (rogueProgressPanelStageEl) rogueProgressPanelStageEl.textContent = ROGUE_STAGE_LABELS[run.stage] || '农场阶段';
        if (rogueProgressPanelGoalEl) rogueProgressPanelGoalEl.textContent = getRogueStageGoalText();
        if (rogueProgressPanelCardsEl) {
            const cards = getSelectedRogueCardDefs();
            rogueProgressPanelCardsEl.innerHTML = cards.length
                ? cards.map((card) => `<span class="garden-rogue-chip">${card.title}</span>`).join('')
                : '<span class="garden-rogue-empty-text">本轮还没有选卡</span>';
        }
        if (rogueProgressPanelOrderEl) {
            if (!run.currentOrder) {
                rogueProgressPanelOrderEl.innerHTML = `<div class="garden-rogue-empty-text">${getRogueOrderSummaryText()}</div>`;
            } else {
                rogueProgressPanelOrderEl.innerHTML = `
                    <div class="garden-rogue-order-title">${run.currentOrder.title}</div>
                    <div class="garden-rogue-order-lines">${run.currentOrder.lines.map((line) => {
                        const meta = ITEM_META[line.itemId];
                        return `<div class="garden-rogue-order-line"><span>${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId}</span><strong>${line.fulfilledQty}/${line.requiredQty}</strong></div>`;
                    }).join('')}</div>
                    <div class="garden-rogue-order-reward">完成奖励：${run.currentOrder.bonusGold} 金币</div>
                `;
            }
        }
    }

    function renderRogueOfferModal() {
        if (!rogueOfferModalEl) return;
        const run = getRogueRun();
        const cardOffer = run ? run.currentOffer : null;
        const supplyOffer = run ? run.currentSupplyOffer : null;
        const isOpen = !!(cardOffer || supplyOffer);
        rogueOfferModalEl.classList.toggle('is-open', isOpen);
        rogueOfferModalEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (!isOpen) return;
        if (supplyOffer) {
            if (rogueOfferTitleEl) rogueOfferTitleEl.textContent = `${ROGUE_CONTEXT_LABELS[supplyOffer.stage] || '阶段'}完成补给`;
            if (rogueOfferDescEl) rogueOfferDescEl.textContent = '选择 1 份补给后，会自动进入下一阶段。';
            if (rogueOfferChoicesEl) {
                rogueOfferChoicesEl.innerHTML = supplyOffer.optionIds.map((optionId) => {
                    const option = getSupplyOptionDef(supplyOffer.stage, optionId);
                    if (!option) return '';
                    return `
                        <button class="garden-rogue-card-choice" data-rogue-supply-id="${option.id}" type="button">
                            <div class="garden-rogue-card-choice-title">${option.title}</div>
                            <div class="garden-rogue-card-choice-desc">${option.desc}</div>
                        </button>
                    `;
                }).join('');
            }
            return;
        }
        if (!cardOffer) return;
        if (rogueOfferTitleEl) rogueOfferTitleEl.textContent = `${ROGUE_CONTEXT_LABELS[cardOffer.context] || '阶段'}三选一卡`;
        if (rogueOfferDescEl) rogueOfferDescEl.textContent = `本轮已选 ${run.selectedCards.length} 张卡牌，选择后立即生效。`;
        if (rogueOfferChoicesEl) {
            rogueOfferChoicesEl.innerHTML = cardOffer.cardIds.map((cardId) => {
                const card = ROGUE_CARD_POOL[cardId];
                return `
                    <button class="garden-rogue-card-choice" data-rogue-card-id="${card.id}" type="button">
                        <div class="garden-rogue-card-choice-title">${card.title}</div>
                        <div class="garden-rogue-card-choice-desc">${card.desc}</div>
                    </button>
                `;
            }).join('');
        }
    }

    function syncGardenRogueUi() {
        if (!state.gardenGame) return;
        if (!isRogueActivityMode()) {
            setRogueProgressPanelOpen(false);
            if (rogueProgressStripEl) rogueProgressStripEl.hidden = true;
            if (rogueOfferModalEl) {
                rogueOfferModalEl.classList.remove('is-open');
                rogueOfferModalEl.setAttribute('aria-hidden', 'true');
            }
            renderStorageSpecialOrderCard();
            syncKitchenSkipButton();
            return;
        }
        if (rogueProgressStripEl) rogueProgressStripEl.hidden = false;
        const changed = syncRogueStateConsistency();
        if (changed) saveGardenGameState();
        renderRogueProgressStrip();
        renderRogueProgressPanel();
        renderRogueOfferModal();
        renderStorageSpecialOrderCard();
        syncKitchenSkipButton();
    }

    function setRogueProgressPanelOpen(open) {
        state.roguePanelOpen = !!open;
        if (!rogueProgressPanelEl) return;
        rogueProgressPanelEl.classList.toggle('is-open', state.roguePanelOpen);
        rogueProgressPanelEl.setAttribute('aria-hidden', state.roguePanelOpen ? 'false' : 'true');
    }

    function handleRogueUiClick(event) {
        if (!isRogueActivityMode()) return;
        const openButton = event.target.closest('[data-rogue-open-panel]');
        if (openButton) {
            setRogueProgressPanelOpen(true);
            vibrate(12);
            return;
        }
        const closeButton = event.target.closest('[data-rogue-close-panel]');
        if (closeButton) {
            setRogueProgressPanelOpen(false);
            vibrate(12);
            return;
        }
        const cardButton = event.target.closest('[data-rogue-card-id]');
        if (cardButton) {
            selectRogueCard(cardButton.dataset.rogueCardId);
            vibrate(15);
            return;
        }
        const supplyButton = event.target.closest('[data-rogue-supply-id]');
        if (supplyButton) {
            selectRogueSupply(supplyButton.dataset.rogueSupplyId);
            vibrate(15);
            return;
        }
        const skipButton = event.target.closest('[data-kitchen-skip-rogue]');
        if (skipButton) {
            skipRogueKitchenStage();
            vibrate(15);
            return;
        }
    }

    function openCurrentRogueStageScreen(options) {
        const run = getRogueRun();
        const preferActivitiesBase = !options || options.preferActivitiesBase !== false;
        if (!run) return;
        if (run.stage === 'farm') {
            if (preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            openFarmScreen();
            return;
        }
        if (run.stage === 'pasture') {
            if (preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            openPastureScreen();
            return;
        }
        if (run.stage === 'kitchen') {
            if (preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            openKitchenScreen();
            return;
        }
        switchView('gallery');
    }

    function progressRogueFarmHarvest() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'farm' || run.currentOffer || run.currentSupplyOffer) return;
        run.progress.farmHarvests += 1;
        if (run.progress.farmHarvests >= 2 && !run.currentSupplyOffer) {
            createRogueSupplyOffer('farm');
            showRogueToast('农场目标完成，来领 1 份阶段补给');
        }
    }

    function progressRoguePastureHarvest() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'pasture' || run.currentOffer || run.currentSupplyOffer) return;
        run.progress.pastureHarvests += 1;
        if (run.progress.pastureHarvests >= 2 && !run.currentSupplyOffer) {
            createRogueSupplyOffer('pasture');
            showRogueToast('牧场目标完成，来领 1 份阶段补给');
        }
    }

    function progressRogueKitchenSuccess() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'kitchen' || run.currentOffer || run.currentSupplyOffer) return;
        run.progress.kitchenSuccesses += 1;
        if (run.progress.kitchenSuccesses >= 1 && !run.currentSupplyOffer) {
            createRogueSupplyOffer('kitchen');
            showRogueToast('厨房目标完成，来领 1 份阶段补给');
        }
    }

    function skipRogueKitchenStage() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'kitchen' || run.currentOffer || run.currentSupplyOffer || canCookAnyKitchenRecipe()) return;
        run.stage = 'sell_setup';
        run.currentOrder = null;
        showRogueToast('已无惩罚跳过厨房，进入出售准备');
        syncRogueStateConsistency();
        saveGardenGameState();
        refreshGardenEconomyUi();
        openCurrentRogueStageScreen({ preferActivitiesBase: false });
    }

    function selectRogueCard(cardId) {
        const run = ensureRogueRun();
        const card = ROGUE_CARD_POOL[cardId];
        if (!run || !card || !run.currentOffer || !run.currentOffer.cardIds.includes(cardId)) return;
        if (!run.selectedCards.includes(cardId)) run.selectedCards.push(cardId);
        applyRogueCardModifier(cardId);
        run.currentOffer = null;
        if (card.context === 'farm') {
            showRogueToast('农场卡已生效，去收获 2 次作物吧');
        } else if (card.context === 'pasture') {
            showRogueToast('牧场卡已生效，去收获 2 次畜产吧');
        } else if (card.context === 'kitchen') {
            showRogueToast(canCookAnyKitchenRecipe() ? '厨房卡已生效，成功做出 1 道菜即可进入出售' : '当前没有可做料理，可以直接跳过厨房');
        } else if (card.context === 'sell') {
            run.stage = 'sell_orders';
            run.currentOrder = null;
            showRogueToast('出售卡已生效，去仓库完成 2 张特殊订单吧');
        }
        syncRogueStateConsistency();
        saveGardenGameState();
        refreshGardenEconomyUi();
        if (card.context === 'sell') {
            openCurrentRogueStageScreen({ preferActivitiesBase: false });
        }
    }

    function selectRogueSupply(optionId) {
        const run = ensureRogueRun();
        const offer = run ? run.currentSupplyOffer : null;
        if (!run || !offer || !offer.optionIds.includes(optionId)) return;
        if (!applyRogueSupplyReward(optionId)) return;
        const nextStage = getNextRogueStageAfterSupply(offer.stage);
        run.currentSupplyOffer = null;
        if (nextStage) {
            run.stage = nextStage;
            if (nextStage === 'sell_setup') {
                run.currentOrder = null;
            }
        }
        syncRogueStateConsistency();
        saveGardenGameState();
        refreshGardenEconomyUi();
        if (nextStage) {
            showRogueToast(`补给已领取，进入${ROGUE_STAGE_LABELS[nextStage] || '下一阶段'}`);
            openCurrentRogueStageScreen();
        }
    }

    function applySellToCurrentOrder(itemId, sellQty) {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'sell_orders' || !run.currentOrder || sellQty < 1) return null;
        let remainingQty = sellQty;
        run.currentOrder.lines.forEach((line) => {
            if (line.itemId !== itemId || remainingQty < 1) return;
            const missingQty = Math.max(0, line.requiredQty - line.fulfilledQty);
            if (missingQty < 1) return;
            const fulfilledNow = Math.min(missingQty, remainingQty);
            line.fulfilledQty += fulfilledNow;
            remainingQty -= fulfilledNow;
        });
        const isCompleted = run.currentOrder.lines.every((line) => line.fulfilledQty >= line.requiredQty);
        if (!isCompleted) return null;
        const completedOrder = run.currentOrder;
        run.progress.ordersCompleted += 1;
        updateGardenCoins(completedOrder.bonusGold);
        markSellChainPending();
        run.currentOrder = null;
        if (run.progress.ordersCompleted >= 2) {
            const completedRuns = Math.max(0, Math.floor(Number(run.completedRuns) || 0)) + 1;
            updateGardenCoins(120);
            state.gardenGame.rogueRun = createDefaultRogueRun(completedRuns);
            syncRogueStateConsistency();
            showRogueToast(`本轮完成，额外获得 ${completedOrder.bonusGold + 120} 金币，已开启下一轮农场阶段`);
            return { finishedRun: true, reward: completedOrder.bonusGold, settlementGold: 120 };
        }
        ensureSellStageOrder();
        showRogueToast(`订单完成，额外获得 ${completedOrder.bonusGold} 金币`);
        return { finishedRun: false, reward: completedOrder.bonusGold };
    }

    function createEmptyContactFigureDraftFiles() {
        return {
            idle: null,
            runLeft: null,
            runRight: null
        };
    }

    function readHomeTutorialDismissed() {
        try {
            const value = window.localStorage.getItem(GARDEN_HOME_TUTORIAL_DISMISSED_KEY);
            if (value == null) return true;
            return value === '1';
        } catch (error) {
            return true;
        }
    }

    function writeHomeTutorialDismissed(dismissed) {
        try {
            window.localStorage.setItem(GARDEN_HOME_TUTORIAL_DISMISSED_KEY, dismissed ? '1' : '0');
        } catch (error) {
            return;
        }
    }

    function syncHomeTutorialVisibility() {
        if (homeTutorialCardEl) {
            homeTutorialCardEl.hidden = true;
        }
        if (homeTutorialReopenBtnEl) {
            homeTutorialReopenBtnEl.hidden = true;
        }
    }

    function setHomeTutorialDismissed(dismissed) {
        state.homeTutorialDismissed = !!dismissed;
        writeHomeTutorialDismissed(state.homeTutorialDismissed);
        syncHomeTutorialVisibility();
    }

    function init() {
        if (state.initialized) return;

        screenEl = document.getElementById('garden-app');
        closeBtn = document.getElementById('close-garden-app');
        togglePanelBtn = document.getElementById('garden-toggle-panel-btn');
        saveBtn = document.getElementById('garden-save-btn');
        editorHost = document.getElementById('garden-editor-host');
        titleTextEl = document.querySelector('#garden-app .garden-app-title-text');
        viewEls = Array.from(document.querySelectorAll('#garden-app .garden-app-view'));
        navBtns = Array.from(document.querySelectorAll('#garden-app .garden-bottom-nav-btn'));
        activitiesViewEl = document.querySelector('#garden-app [data-garden-view="activities"]');
        storageViewEl = document.querySelector('#garden-app [data-garden-view="gallery"]');
        storageGridEl = document.getElementById('garden-storage-grid');
        storageTabBtns = Array.from(document.querySelectorAll('#garden-app [data-storage-tab]'));
        storageSellSheetEl = document.getElementById('garden-storage-sell-sheet');
        storageSellBackdropEl = document.getElementById('garden-storage-sell-backdrop');
        storageSellIconEl = document.getElementById('garden-storage-sell-icon');
        storageSellNameEl = document.getElementById('garden-storage-sell-name');
        storageSellStockEl = document.getElementById('garden-storage-sell-stock');
        storageSellPriceEl = document.getElementById('garden-storage-sell-price');
        storageSellQtyEl = document.getElementById('garden-storage-sell-qty');
        storageSellTotalEl = document.getElementById('garden-storage-sell-total');
        storageSellConfirmBtn = document.getElementById('garden-storage-sell-confirm');
        homeEntryMenuEl = document.getElementById('garden-home-entry-menu');
        farmScreenEl = document.getElementById('garden-farm-screen');
        farmCloseBtn = document.getElementById('garden-farm-close-btn');
        farmGridEl = document.getElementById('garden-farm-grid');
        farmSeedPanelEl = document.getElementById('garden-farm-seed-panel');
        farmSeedListEl = document.getElementById('garden-farm-seed-list');
        farmCoinsEl = document.getElementById('garden-farm-coins');
        farmLevelEl = document.getElementById('garden-farm-level');
        farmToolBtns = Array.from(document.querySelectorAll('#garden-app [data-farm-tool]'));
        farmToastEl = document.getElementById('garden-farm-toast');
        pastureScreenEl = document.getElementById('garden-pasture-screen');
        pastureCloseBtn = document.getElementById('garden-pasture-close-btn');
        pastureFieldEl = document.getElementById('garden-pasture-field');
        pastureShopPanelEl = document.getElementById('garden-pasture-shop-panel');
        pastureCoinsEl = document.getElementById('garden-pasture-coins');
        pastureExpEl = document.getElementById('garden-pasture-exp');
        pastureToolBtns = Array.from(document.querySelectorAll('#garden-app [data-pasture-tool]'));
        pastureShopItems = Array.from(document.querySelectorAll('#garden-app [data-pasture-animal]'));
        pastureToastEl = document.getElementById('garden-pasture-toast');
        kitchenScreenEl = document.getElementById('garden-kitchen-screen');
        kitchenCloseBtn = document.getElementById('garden-kitchen-close-btn');
        kitchenOverlayEl = document.getElementById('garden-kitchen-overlay');
        kitchenQteContainerEl = document.getElementById('garden-kitchen-qte-container');
        kitchenQteDialEl = document.getElementById('garden-kitchen-qte-dial');
        kitchenQtePointerEl = document.getElementById('garden-kitchen-qte-pointer');
        kitchenQteHintEl = document.getElementById('garden-kitchen-qte-hint');
        kitchenToastEl = document.getElementById('garden-kitchen-toast');
        kitchenCookBtns = Array.from(document.querySelectorAll('#garden-app [data-kitchen-cook]'));
        rogueProgressStripEl = document.getElementById('garden-rogue-strip');
        rogueProgressStageEl = document.getElementById('garden-rogue-stage');
        rogueProgressCardsEl = document.getElementById('garden-rogue-cards');
        rogueProgressGoalEl = document.getElementById('garden-rogue-goal');
        rogueProgressOrderEl = document.getElementById('garden-rogue-order');
        rogueProgressPanelEl = document.getElementById('garden-rogue-panel');
        rogueProgressPanelStageEl = document.getElementById('garden-rogue-panel-stage');
        rogueProgressPanelCardsEl = document.getElementById('garden-rogue-panel-cards');
        rogueProgressPanelGoalEl = document.getElementById('garden-rogue-panel-goal');
        rogueProgressPanelOrderEl = document.getElementById('garden-rogue-panel-order');
        rogueOfferModalEl = document.getElementById('garden-rogue-offer');
        rogueOfferTitleEl = document.getElementById('garden-rogue-offer-title');
        rogueOfferDescEl = document.getElementById('garden-rogue-offer-desc');
        rogueOfferChoicesEl = document.getElementById('garden-rogue-offer-choices');
        storageOrderCardEl = document.getElementById('garden-storage-order-card');
        kitchenSkipBtnEl = document.getElementById('garden-kitchen-skip-btn');
        homeTutorialCardEl = document.getElementById('garden-home-tutorial-card');
        homeTutorialReopenBtnEl = document.getElementById('garden-home-tutorial-reopen');
        floraScreenEl = document.getElementById('garden-flora-screen');
        floraAppEl = document.getElementById('garden-flora-app');
        floraBackBtn = document.getElementById('garden-flora-back');
        floraArtEl = document.getElementById('garden-flora-art-plant');
        floraParticlesEl = document.getElementById('garden-flora-particles');
        floraLogContentEl = document.getElementById('garden-flora-log-content');
        floraToggleBtns = Array.from(document.querySelectorAll('#garden-flora-screen .garden-flora-toggle-btn'));

        if (!screenEl || !closeBtn || !togglePanelBtn || !saveBtn || !editorHost) {
            return;
        }

        state.casualGardenGame = loadGardenGameState('casual');
        if (hasPersistedRogueActivitySave()) {
            state.rogueActivityGame = loadGardenGameState('rogue_activity');
        }
        setGardenMode('casual');
        state.homeTutorialDismissed = readHomeTutorialDismissed();
        saveGardenGameState();
        syncHomeTutorialVisibility();

        closeBtn.addEventListener('click', closeApp);
        bindGardenTitleEditing();
        syncGardenTitle();
        syncActivitiesNavButton();
        bindActivitiesInteractions();
        initStorageView();
        ensureContactFigureModal();
        screenEl.addEventListener('click', handleRogueUiClick);
        togglePanelBtn.addEventListener('click', () => {
            if (state.currentView !== 'home') return;
            setDrawerOpen(!state.drawerOpen);
        });
        saveBtn.addEventListener('click', saveDesign);
        navBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const viewKey = btn.dataset.gardenView;
                if (viewKey === 'home' && state.currentView === 'home') {
                    setDrawerOpen(false);
                    syncHomeEntryMenuSelection();
                    setHomeEntryMenuOpen(!state.homeEntryMenuOpen);
                    vibrate(20);
                    return;
                }

                setHomeEntryMenuOpen(false);
                switchView(viewKey);
                vibrate(20);
            });
        });
        if (homeEntryMenuEl) {
            homeEntryMenuEl.addEventListener('click', handleHomeEntryMenuClick);
        }
        if (farmCloseBtn) {
            farmCloseBtn.addEventListener('click', closeFarmScreen);
        }
        if (pastureCloseBtn) {
            pastureCloseBtn.addEventListener('click', closePastureScreen);
        }
        if (kitchenCloseBtn) {
            kitchenCloseBtn.addEventListener('click', closeKitchenScreen);
        }
        document.addEventListener('click', handleOutsideDrawerClick, true);
        if (floraBackBtn) {
            floraBackBtn.addEventListener('click', closeFloraScreen);
        }
        window.addEventListener('moodflora:statechange', handleFloraStateEvent);
        window.addEventListener('moodflora:contactchange', handleFloraContactEvent);

        initEditor();
        initFarmScreen();
        initPastureScreen();
        initKitchenScreen();
        syncGardenLayoutFromActiveContact();
        syncFloraFromEngine();
        switchView('home');
        state.initialized = true;
    }

    function sanitizeGardenTitle(value) {
        if (typeof value !== 'string') return '';
        return value.replace(/\s+/g, ' ').trim().slice(0, GARDEN_TITLE_MAX_LENGTH);
    }

    function readGardenTitle() {
        try {
            return sanitizeGardenTitle(window.localStorage.getItem(GARDEN_TITLE_STORAGE_KEY) || '');
        } catch (error) {
            return '';
        }
    }

    function writeGardenTitle(value) {
        try {
            window.localStorage.setItem(GARDEN_TITLE_STORAGE_KEY, value);
        } catch (error) {
            console.warn('[garden-app] title-save-failed', error);
        }
    }

    function applyGardenTitle(value) {
        if (!titleTextEl) return;
        const nextTitle = sanitizeGardenTitle(value) || GARDEN_TITLE_DEFAULT;
        titleTextEl.textContent = nextTitle;
        titleTextEl.setAttribute('title', nextTitle);
    }

    function syncGardenTitle() {
        if (!titleTextEl) return;
        applyGardenTitle(readGardenTitle() || titleTextEl.textContent || GARDEN_TITLE_DEFAULT);
    }

    function moveCaretToEnd(el) {
        if (!el || !window.getSelection || !document.createRange) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function finishGardenTitleEditing(commit = true) {
        if (!titleTextEl || !titleTextEl.classList.contains('is-editing')) return;

        const previousTitle = titleTextEl.dataset.previousTitle || GARDEN_TITLE_DEFAULT;
        const currentTitle = sanitizeGardenTitle(titleTextEl.textContent);

        titleTextEl.contentEditable = 'false';
        titleTextEl.classList.remove('is-editing');

        if (!commit) {
            applyGardenTitle(previousTitle);
            delete titleTextEl.dataset.previousTitle;
            return;
        }

        const nextTitle = currentTitle || previousTitle || GARDEN_TITLE_DEFAULT;
        applyGardenTitle(nextTitle);
        writeGardenTitle(nextTitle);
        delete titleTextEl.dataset.previousTitle;
        vibrate(10);
    }

    function startGardenTitleEditing() {
        if (!titleTextEl || titleTextEl.classList.contains('is-editing')) return;

        titleTextEl.dataset.previousTitle = sanitizeGardenTitle(titleTextEl.textContent) || GARDEN_TITLE_DEFAULT;
        titleTextEl.contentEditable = 'true';
        titleTextEl.spellcheck = false;
        titleTextEl.classList.add('is-editing');
        titleTextEl.focus();
        moveCaretToEnd(titleTextEl);
    }

    function bindGardenTitleEditing() {
        if (!titleTextEl || titleTextEl.dataset.editBound === 'true') return;

        titleTextEl.dataset.editBound = 'true';
        titleTextEl.setAttribute('role', 'textbox');
        titleTextEl.setAttribute('aria-label', '\u7f16\u8f91\u5bb6\u56ed\u6807\u9898');

        titleTextEl.addEventListener('click', (event) => {
            event.stopPropagation();
            startGardenTitleEditing();
        });

        titleTextEl.addEventListener('blur', () => {
            finishGardenTitleEditing(true);
        });

        titleTextEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                finishGardenTitleEditing(true);
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                finishGardenTitleEditing(false);
            }
        });

        titleTextEl.addEventListener('input', () => {
            if (!titleTextEl.classList.contains('is-editing')) return;
            const sanitizedText = sanitizeGardenTitle(titleTextEl.textContent);
            if (titleTextEl.textContent !== sanitizedText) {
                titleTextEl.textContent = sanitizedText;
                moveCaretToEnd(titleTextEl);
            }
        });
    }

    function syncActivitiesNavButton() {
        const button = document.querySelector('#garden-app .garden-bottom-nav-btn[data-garden-view="activities"]');
        if (!button) return;

        const icon = button.querySelector('i');
        const label = button.querySelector('span');
        if (icon) {
            icon.className = 'fas fa-gamepad';
        }
        if (label) {
            label.textContent = '\u6d3b\u52a8';
        }
    }

    function setHomeEntryMenuOpen(open) {
        state.homeEntryMenuOpen = Boolean(open) && state.currentView === 'home';
        if (!homeEntryMenuEl) return;
        homeEntryMenuEl.classList.toggle('is-open', state.homeEntryMenuOpen);
        homeEntryMenuEl.setAttribute('aria-hidden', state.homeEntryMenuOpen ? 'false' : 'true');
    }

    function syncHomeEntryMenuSelection() {
        if (!homeEntryMenuEl) return;
        homeEntryMenuEl.querySelectorAll('[data-garden-home-entry]').forEach((button) => {
            button.classList.toggle('is-current', button.dataset.gardenHomeEntry === state.currentHomeSection);
        });
    }

    function handleHomeEntrySelection(entryKey) {
        const targetKey = HOME_ENTRY_META[entryKey] ? entryKey : 'home';
        setHomeEntryMenuOpen(false);
        vibrate(20);

        if (targetKey === 'home') {
            state.currentHomeSection = 'home';
            syncHomeEntryMenuSelection();
            switchView('home');
            return;
        }

        if (targetKey === 'farm') {
            openCasualFarmScreen();
            return;
        }

        if (targetKey === 'pasture') {
            openCasualPastureScreen();
            return;
        }

        if (targetKey === 'kitchen') {
            openCasualKitchenScreen();
            return;
        }

        const label = HOME_ENTRY_META[targetKey] ? HOME_ENTRY_META[targetKey].label : '\u8be5\u533a\u57df';
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`${label}\u5165\u53e3\u83dc\u5355\u5df2\u7ecf\u505a\u597d\uff0c\u4e0b\u4e00\u6b65\u6211\u53ef\u4ee5\u7ee7\u7eed\u5e2e\u4f60\u628a\u9875\u9762\u63a5\u8fdb\u53bb`, 2200);
            return;
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification(`${label}\u5165\u53e3\u83dc\u5355\u5df2\u7ecf\u505a\u597d`, 1800, 'info');
        }
    }

    function handleHomeEntryMenuClick(event) {
        const closeTarget = event.target.closest('[data-garden-home-entry-close]');
        if (closeTarget) {
            setHomeEntryMenuOpen(false);
            return;
        }

        const entryButton = event.target.closest('[data-garden-home-entry]');
        if (!entryButton) return;
        handleHomeEntrySelection(entryButton.dataset.gardenHomeEntry);
    }

    function enterCasualGardenMode() {
        setGardenMode('casual');
        saveGardenGameState();
        refreshGardenEconomyUi();
        renderFarmPlots();
        renderPastureAnimals();
    }

    function enterRogueActivityMode() {
        if (!state.rogueActivityGame) {
            state.rogueActivityGame = loadGardenGameState('rogue_activity');
        }
        setGardenMode('rogue_activity');
        syncRogueStateConsistency();
        saveGardenGameState();
        refreshGardenEconomyUi();
        renderFarmPlots();
        renderPastureAnimals();
    }

    function openCasualFarmScreen() {
        enterCasualGardenMode();
        openFarmScreen();
    }

    function openCasualPastureScreen() {
        enterCasualGardenMode();
        openPastureScreen();
    }

    function openCasualKitchenScreen() {
        enterCasualGardenMode();
        openKitchenScreen();
    }

    function openFarmRogueChallengeFromActivities() {
        openActivitiesView();
        enterRogueActivityMode();
        openCurrentRogueStageScreen();
    }

    function initFarmScreen() {
        if (!farmGridEl || !farmSeedListEl) return;
        if (!state.farmGame.initialized) {
            farmGridEl.innerHTML = '';
            for (let index = 0; index < 9; index += 1) {
                const plot = document.createElement('div');
                plot.className = 'garden-farm-plot';
                plot.dataset.plotIndex = String(index);
                plot.innerHTML = '<span class="garden-farm-crop"></span><div class="garden-farm-progress-meta"><div class="garden-farm-progress-container"><div class="garden-farm-progress-fill"></div></div><div class="garden-farm-progress-time"></div></div>';
                plot.addEventListener('click', () => handleFarmPlotClick(plot));
                farmGridEl.appendChild(plot);
            }

            farmSeedListEl.innerHTML = '';
            Object.values(FARM_SEEDS).forEach((seed, index) => {
                const item = document.createElement('div');
                item.className = `garden-farm-seed-item${index === 0 ? ' active' : ''}`;
                item.dataset.farmSeed = seed.id;
                item.innerHTML = `<div class="garden-farm-seed-emoji">${seed.emoji}</div><div class="garden-farm-seed-info"><i class="ri-copper-coin-fill" style="color:#FFD700;"></i>${seed.cost}</div><div class="garden-farm-seed-time">${formatFarmDuration(seed.time)}</div>`;
                item.addEventListener('click', () => setFarmSeed(seed.id));
                farmSeedListEl.appendChild(item);
            });

            farmToolBtns.forEach((button) => {
                button.addEventListener('click', () => setFarmTool(button.dataset.farmTool));
            });

            state.farmGame.initialized = true;
        }

        ensureFarmProgressTimer();
        renderFarmPlots();
        syncFarmStats();
        syncFarmToolUi();
    }

    function syncFarmStats() {
        if (farmCoinsEl) farmCoinsEl.textContent = String(state.gardenGame ? state.gardenGame.coins : 0);
        if (farmLevelEl) farmLevelEl.textContent = String(state.gardenGame ? state.gardenGame.farm.level : 1);
    }

    function ensureFarmProgressTimer() {
        if (state.farmGame.progressTimer) return;
        state.farmGame.progressTimer = window.setInterval(() => {
            const changed = advanceFarmPlotsByClock();
            renderFarmPlots();
            if (changed) saveGardenGameState();
        }, 250);
    }

    function advanceFarmPlotsByClock() {
        const now = Date.now();
        let changed = false;
        getFarmPlots().forEach((plot) => {
            changed = advanceFarmPlotByClock(plot, now) || changed;
        });
        return changed;
    }

    function getFarmPlotStateByElement(plotEl) {
        if (!plotEl) return null;
        const plotIndex = Number(plotEl.dataset.plotIndex);
        return getFarmPlots()[plotIndex] || null;
    }

    function getFarmPlotProgress(plot) {
        if (!plot || plot.state !== 'growing' || !plot.seedId || !isFiniteNumber(plot.readyAt)) return 0;
        const seed = FARM_SEEDS[plot.seedId];
        if (!seed) return 0;
        const totalDuration = isFiniteNumber(plot.growDuration) ? plot.growDuration : seed.time;
        const remaining = Math.max(0, plot.readyAt - Date.now());
        return Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100));
    }

    function renderFarmPlots() {
        if (!farmGridEl) return;
        const now = Date.now();
        let changed = false;
        Array.from(farmGridEl.children).forEach((plotEl, index) => {
            const plot = getFarmPlots()[index] || createEmptyFarmPlotState();
            changed = advanceFarmPlotByClock(plot, now) || changed;
            const cropEl = plotEl.querySelector('.garden-farm-crop');
            const progressMetaEl = plotEl.querySelector('.garden-farm-progress-meta');
            const progressFillEl = plotEl.querySelector('.garden-farm-progress-fill');
            const progressTimeEl = plotEl.querySelector('.garden-farm-progress-time');
            plotEl.dataset.state = plot.state;
            plotEl.dataset.seedId = plot.seedId || '';
            plotEl.classList.remove('planted', 'growing', 'ready');

            if (plot.state === 'empty' || !plot.seedId) {
                if (cropEl) cropEl.textContent = '';
                if (progressFillEl) progressFillEl.style.width = '0%';
                if (progressTimeEl) progressTimeEl.textContent = '';
                if (progressMetaEl) progressMetaEl.style.display = 'none';
                return;
            }

            const seed = FARM_SEEDS[plot.seedId];
            if (plot.state === 'ready') {
                plotEl.classList.add('ready');
                if (cropEl) cropEl.textContent = seed ? seed.emoji : '🌾';
                if (progressFillEl) progressFillEl.style.width = '100%';
                if (progressTimeEl) progressTimeEl.textContent = '';
                if (progressMetaEl) progressMetaEl.style.display = 'none';
                return;
            }

            if (progressMetaEl) progressMetaEl.style.display = 'flex';
            if (plot.state === 'planted') {
                plotEl.classList.add('planted');
                if (cropEl) cropEl.textContent = '🌱';
                if (progressFillEl) progressFillEl.style.width = '0%';
                if (progressTimeEl) progressTimeEl.textContent = `成熟 ${seed ? formatFarmDuration(seed.time) : '01:00'}`;
                return;
            }

            if (plot.state === 'growing') {
                plotEl.classList.add('growing');
            }
            if (cropEl) cropEl.textContent = '🌱';
            if (progressFillEl) progressFillEl.style.width = `${getFarmPlotProgress(plot)}%`;
            if (progressTimeEl) {
                progressTimeEl.textContent = `剩余 ${formatFarmDuration(Math.max(0, (plot.readyAt || now) - now))}`;
            }
        });

        if (changed) saveGardenGameState();
    }

    function syncFarmToolUi() {
        farmToolBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.farmTool === state.farmGame.currentTool);
        });
        if (farmSeedPanelEl) {
            farmSeedPanelEl.classList.toggle('is-open', state.farmGame.currentTool === 'plant');
        }
        if (!farmSeedListEl) return;
        farmSeedListEl.querySelectorAll('[data-farm-seed]').forEach((item) => {
            item.classList.toggle('active', item.dataset.farmSeed === state.farmGame.currentSeed);
        });
    }

    function setFarmTool(toolKey) {
        state.farmGame.currentTool = toolKey || 'pointer';
        syncFarmToolUi();
        vibrate(15);
    }

    function setFarmSeed(seedId) {
        if (!FARM_SEEDS[seedId]) return;
        state.farmGame.currentSeed = seedId;
        syncFarmToolUi();
        vibrate(15);
    }

    function openFarmScreen() {
        initFarmScreen();
        if (!farmScreenEl) return;
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        state.farmScreenOpen = true;
        state.currentHomeSection = 'farm';
        farmScreenEl.classList.add('is-open');
        farmScreenEl.setAttribute('aria-hidden', 'false');
        vibrate(20);
    }

    function closeFarmScreen(options) {
        if (!farmScreenEl) return;
        const silent = !!(options && options.silent);
        state.farmScreenOpen = false;
        state.currentHomeSection = 'home';
        farmScreenEl.classList.remove('is-open');
        farmScreenEl.setAttribute('aria-hidden', 'true');
        if (!silent) vibrate(20);
    }

    function handleFarmPlotClick(plotEl) {
        if (!plotEl) return;
        const plotState = plotEl.dataset.state || 'empty';
        const currentTool = state.farmGame.currentTool;

        if (currentTool === 'plant') {
            if (plotState !== 'empty') {
                showFarmToast('这块地已经种上啦');
                return;
            }
            const seed = FARM_SEEDS[state.farmGame.currentSeed];
            if (!seed) return;
            if (!state.gardenGame || state.gardenGame.coins < seed.cost) {
                showFarmToast('金币不足啦');
                return;
            }
            updateGardenCoins(-seed.cost);
            let rebateGold = 0;
            if (isRogueModifierActive('farm_seed_rebate')) {
                rebateGold = Math.ceil(seed.cost * getRogueModifierValue('farm_seed_rebate', 0.3));
                if (rebateGold > 0) {
                    updateGardenCoins(rebateGold);
                }
            }
            plantFarmSeed(plotEl, seed, rebateGold);
            return;
        }

        if (currentTool === 'water') {
            if (plotState === 'planted') {
                waterFarmPlot(plotEl);
                return;
            }
            if (plotState === 'growing') {
                showFarmToast('已经浇过水啦，等现实时间过去后成熟');
                return;
            }
            if (plotState === 'ready') {
                showFarmToast('已经成熟啦，快去收获');
                return;
            }
            showFarmToast('先种下种子再浇水');
            return;
        }

        if (currentTool === 'harvest') {
            if (plotState !== 'ready') {
                showFarmToast('还没成熟，先等等');
                return;
            }
            const plot = getFarmPlotStateByElement(plotEl);
            const seed = plot ? FARM_SEEDS[plot.seedId] : null;
            if (!seed) return;
            harvestFarmCrop(plotEl, seed);
            return;
        }

        if (currentTool === 'shovel') {
            if (plotState === 'empty') {
                showFarmToast('这块地现在是空的');
                return;
            }
            clearFarmPlot(plotEl);
            showFarmToast('已铲除当前作物');
            return;
        }

        if (plotState === 'ready') {
            const plot = getFarmPlotStateByElement(plotEl);
            const seed = plot ? FARM_SEEDS[plot.seedId] : null;
            showFarmToast(seed ? `${seed.name} 已成熟，快去收获` : '作物已成熟');
            return;
        }
        if (plotState === 'planted') {
            showFarmToast('种子已经种下，记得先浇水');
            return;
        }
        if (plotState === 'growing') {
            showFarmToast('已经浇过水，等待现实时间成熟');
            return;
        }
        showFarmToast('切换工具后就能开始种地啦');
    }

    function plantFarmSeed(plotEl, seed, rebateGold = 0) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot) return;
        plot.state = 'planted';
        plot.seedId = seed.id;
        plot.readyAt = null;
        plot.growDuration = null;
        renderFarmPlots();
        saveGardenGameState();
        showFarmToast(rebateGold > 0
            ? `已种下${seed.name}，返还 ${rebateGold} 金币，记得浇水`
            : `已种下${seed.name}，记得浇水`);
    }

    function waterFarmPlot(plotEl) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot || plot.state !== 'planted' || !plot.seedId) return;
        const seed = FARM_SEEDS[plot.seedId];
        if (!seed) return;
        plotEl.style.backgroundColor = 'var(--farm-dirt-wet)';
        window.setTimeout(() => {
            plotEl.style.backgroundColor = '';
        }, 500);
        const fastWaterApplied = consumeRogueModifier('farm_fast_water');
        const growDuration = Math.max(60 * 1000, Math.round(seed.time * (fastWaterApplied ? getRogueModifierValue('farm_fast_water', 0.75) : 1)));
        plot.state = 'growing';
        plot.growDuration = growDuration;
        plot.readyAt = Date.now() + growDuration;
        renderFarmPlots();
        saveGardenGameState();
        showFarmToast(fastWaterApplied ? '已浇水，速熟效果已生效' : '已浇水，开始按现实时间生长');
    }

    function harvestFarmCrop(plotEl, seed) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot) return;
        let rewardQty = 1;
        if (consumeRogueModifier('farm_double_crop') && Math.random() < getRogueModifierValue('farm_double_crop', 0.35)) {
            rewardQty += 1;
        }
        const cropMeta = ITEM_META[seed.inventoryId];
        if (cropMeta && cropMeta.sellPrice >= 25 && isRogueModifierActive('farm_big_crop')) {
            rewardQty += 1;
        }
        addInventoryItem(seed.inventoryId, rewardQty);
        plot.state = 'empty';
        plot.seedId = '';
        plot.readyAt = null;
        plot.growDuration = null;
        state.gardenGame.farm.exp += 10;
        progressRogueFarmHarvest();

        let leveledUp = false;
        while (state.gardenGame.farm.exp >= 100) {
            state.gardenGame.farm.exp -= 100;
            state.gardenGame.farm.level += 1;
            leveledUp = true;
        }

        renderFarmPlots();
        saveGardenGameState();
        refreshGardenEconomyUi();
        showFarmToast(leveledUp
            ? `收获 ${seed.name} x${rewardQty}，已存入仓库 · 升到 ${state.gardenGame.farm.level} 级`
            : `收获 ${seed.name} x${rewardQty}，已存入仓库`);
    }

    function clearFarmPlot(plotEl) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot) return;
        plot.state = 'empty';
        plot.seedId = '';
        plot.readyAt = null;
        plot.growDuration = null;
        renderFarmPlots();
        saveGardenGameState();
    }

    function showFarmToast(message) {
        if (!farmToastEl || !message) return;
        farmToastEl.textContent = message;
        farmToastEl.classList.add('is-visible');
        window.clearTimeout(state.farmToastTimeout);
        state.farmToastTimeout = window.setTimeout(() => {
            if (farmToastEl) farmToastEl.classList.remove('is-visible');
        }, 2000);
    }

    function initPastureScreen() {
        if (!pastureFieldEl || !pastureShopPanelEl || !pastureCoinsEl || !pastureExpEl) return;
        if (!state.pastureGame.initialized) {
            pastureFieldEl.addEventListener('click', handlePastureAreaClick);
            pastureToolBtns.forEach((button) => {
                button.addEventListener('click', () => {
                    const tool = button.dataset.pastureTool;
                    if (tool) setPastureTool(tool);
                });
            });
            pastureShopItems.forEach((button) => {
                button.addEventListener('click', () => {
                    const animalType = button.dataset.pastureAnimal;
                    if (animalType) selectPastureAnimalToBuy(animalType);
                });
            });
            state.pastureGame.initialized = true;
        }

        ensurePastureTimers();
        syncPastureStats();
        syncPastureToolUi();
        selectPastureAnimalToBuy(state.pastureGame.selectedAnimalToBuy, false);
        renderPastureAnimals();
    }

    function syncPastureStats() {
        if (pastureCoinsEl) pastureCoinsEl.textContent = String(state.gardenGame ? state.gardenGame.coins : 0);
        if (pastureExpEl) pastureExpEl.textContent = `Lv.${state.gardenGame ? state.gardenGame.pasture.level : 1}`;
    }

    function syncPastureToolUi() {
        pastureToolBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.pastureTool === state.pastureGame.currentTool);
        });
        pastureShopItems.forEach((button) => {
            button.classList.toggle('selected', button.dataset.pastureAnimal === state.pastureGame.selectedAnimalToBuy);
        });
        if (pastureShopPanelEl) {
            pastureShopPanelEl.style.display = state.pastureGame.currentTool === 'shop' ? 'flex' : 'none';
        }
    }

    function setPastureTool(tool) {
        if (!tool) return;
        state.pastureGame.currentTool = tool;
        if (tool === 'shop' && !state.pastureGame.selectedAnimalToBuy) {
            state.pastureGame.selectedAnimalToBuy = 'chicken';
        }
        syncPastureToolUi();
        vibrate(15);
    }

    function selectPastureAnimalToBuy(type, shouldVibrate = true) {
        if (!PASTURE_ANIMAL_DATA[type]) return;
        state.pastureGame.selectedAnimalToBuy = type;
        syncPastureToolUi();
        if (shouldVibrate) vibrate(15);
    }

    function openPastureScreen() {
        initPastureScreen();
        if (!pastureScreenEl) return;
        closeFarmScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        state.pastureScreenOpen = true;
        state.currentHomeSection = 'pasture';
        pastureScreenEl.classList.add('is-open');
        pastureScreenEl.setAttribute('aria-hidden', 'false');
        renderPastureAnimals();
        syncPastureStats();
        vibrate(20);
    }

    function closePastureScreen(options) {
        if (!pastureScreenEl) return;
        const silent = !!(options && options.silent);
        state.pastureScreenOpen = false;
        state.currentHomeSection = 'home';
        pastureScreenEl.classList.remove('is-open');
        pastureScreenEl.setAttribute('aria-hidden', 'true');
        if (!silent) vibrate(20);
    }

    function ensurePastureTimers() {
        if (!state.pastureGame.progressTimer) {
            state.pastureGame.progressTimer = window.setInterval(() => {
                const changed = advancePastureAnimalsProgress();
                renderPastureAnimals();
                if (changed) saveGardenGameState();
            }, 1000);
        }
        if (!state.pastureGame.roamTimer) {
            state.pastureGame.roamTimer = window.setInterval(() => {
                roamPastureAnimals();
            }, 2000);
        }
    }

    function advancePastureAnimalsProgress() {
        const now = Date.now();
        let changed = false;
        getPastureAnimals().forEach((animal) => {
            changed = advancePastureAnimalByClock(animal, now) || changed;
        });
        return changed;
    }

    function showPastureToast(message) {
        if (!pastureToastEl || !message) return;
        pastureToastEl.textContent = message;
        pastureToastEl.classList.add('is-visible');
        window.clearTimeout(state.pastureToastTimeout);
        state.pastureToastTimeout = window.setTimeout(() => {
            if (pastureToastEl) pastureToastEl.classList.remove('is-visible');
        }, 2000);
    }

    function handlePastureAreaClick(event) {
        if (!pastureFieldEl) return;
        if (event.target.closest('.garden-pasture-animal-wrapper')) return;
        if (state.pastureGame.currentTool !== 'shop' || !state.pastureGame.selectedAnimalToBuy) return;

        const animalType = state.pastureGame.selectedAnimalToBuy;
        const animalData = PASTURE_ANIMAL_DATA[animalType];
        if (!animalData) return;
        if (!state.gardenGame || state.gardenGame.coins < animalData.cost) {
            showPastureToast('金币不足！');
            return;
        }

        const rect = pastureFieldEl.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        updateGardenCoins(-animalData.cost);
        getPastureAnimals().push(createPastureAnimalState(animalType, x, y, false));
        renderPastureAnimals();
        saveGardenGameState();
        refreshGardenEconomyUi();
        showPastureToast(`购买了幼崽 ${animalData.babyEmoji}`);
    }

    function createPastureAnimalState(type, x, y, isAdult) {
        return {
            id: `animal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type,
            age: isAdult ? 'adult' : 'baby',
            state: 'hungry',
            x: Math.max(10, Math.min(90, x)),
            y: Math.max(15, Math.min(85, y)),
            stateEndsAt: null
        };
    }

    function setPastureAnimalPosition(wrapper, x, y) {
        if (!wrapper) return;
        const nextX = Math.max(10, Math.min(90, x));
        const nextY = Math.max(15, Math.min(85, y));
        wrapper.dataset.x = String(nextX);
        wrapper.dataset.y = String(nextY);
        wrapper.style.left = `calc(${nextX}% - 25px)`;
        wrapper.style.top = `calc(${nextY}% - 30px)`;
    }

    function getPastureAnimalById(animalId) {
        return getPastureAnimals().find((animal) => animal.id === animalId) || null;
    }

    function getPastureAnimalBubble(animal, data, isEating) {
        if (isEating) {
            return { text: `${data.food} 吃吃吃...`, color: '#333' };
        }
        if (animal.state === 'ready') {
            return { text: `可收获 ${data.produceEmoji}`, color: '#2e7d32' };
        }
        if (animal.state === 'growing') {
            return { text: '成长中 ⏳', color: '#333' };
        }
        if (animal.state === 'producing') {
            return { text: '生产中 ⏳', color: '#333' };
        }
        return { text: '饿了 😫', color: '#333' };
    }

    function renderPastureAnimals() {
        if (!pastureFieldEl) return;
        const now = Date.now();
        pastureFieldEl.innerHTML = '';
        getPastureAnimals().forEach((animal) => {
            const data = PASTURE_ANIMAL_DATA[animal.type];
            if (!data) return;
            const isEating = Number(state.pastureGame.visualEatingUntil[animal.id] || 0) > now;
            const bubbleMeta = getPastureAnimalBubble(animal, data, isEating);
            const wrapper = document.createElement('div');
            const classNames = ['garden-pasture-animal-wrapper', animal.age === 'adult' ? 'garden-pasture-age-adult' : 'garden-pasture-age-baby'];
            if (animal.state === 'hungry') classNames.push('garden-pasture-state-hungry');
            if (animal.state === 'ready') classNames.push('garden-pasture-state-ready');
            if (isEating || animal.state === 'hungry' || animal.state === 'ready') classNames.push('garden-pasture-show-bubble');
            wrapper.className = classNames.join(' ');
            wrapper.dataset.pastureId = animal.id;
            wrapper.dataset.type = animal.type;
            wrapper.dataset.state = animal.state;
            wrapper.dataset.age = animal.age;
            wrapper.innerHTML = `
                <div class="garden-pasture-bubble" style="color:${bubbleMeta.color};">${bubbleMeta.text}</div>
                <div class="garden-pasture-animal-emoji">${animal.age === 'adult' ? data.adultEmoji : data.babyEmoji}</div>
            `;
            setPastureAnimalPosition(wrapper, animal.x, animal.y);
            wrapper.addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation();
                interactWithPastureAnimal(wrapper);
            });
            pastureFieldEl.appendChild(wrapper);
        });
    }

    function interactWithPastureAnimal(wrapper) {
        if (!wrapper) return;
        const animal = getPastureAnimalById(wrapper.dataset.pastureId);
        if (!animal) return;
        const data = PASTURE_ANIMAL_DATA[animal.type];
        if (!data) return;

        const animalState = animal.state;
        const animalAge = animal.age;
        const bubble = wrapper.querySelector('.garden-pasture-bubble');
        if (!bubble) return;

        if (state.pastureGame.currentTool === 'pointer') {
            wrapper.classList.add('garden-pasture-show-bubble');
            window.setTimeout(() => {
                if (!wrapper.isConnected) return;
                if (wrapper.dataset.state !== 'ready' && wrapper.dataset.state !== 'hungry') {
                    wrapper.classList.remove('garden-pasture-show-bubble');
                }
            }, 2000);
            return;
        }

        if (state.pastureGame.currentTool === 'feed' && animalState === 'hungry') {
            animal.state = animalAge === 'baby' ? 'growing' : 'producing';
            let durationMultiplier = 1;
            if (consumeRogueModifier('pasture_fast_feed')) {
                durationMultiplier *= getRogueModifierValue('pasture_fast_feed', 0.7);
            }
            if (animalAge === 'baby' && isRogueModifierActive('pasture_baby_boost')) {
                durationMultiplier *= getRogueModifierValue('pasture_baby_boost', 0.6);
            }
            const baseDuration = animalAge === 'baby' ? data.growTime : data.produceTime;
            animal.stateEndsAt = Date.now() + Math.max(1000, Math.round(baseDuration * durationMultiplier));
            state.pastureGame.visualEatingUntil[animal.id] = Date.now() + 1500;
            saveGardenGameState();
            renderPastureAnimals();
            const refreshedWrapper = pastureFieldEl ? pastureFieldEl.querySelector(`[data-pasture-id="${animal.id}"]`) : null;
            if (refreshedWrapper) {
                showPastureFoodAnimation(refreshedWrapper, data.food);
            }
            showPastureToast(animalAge === 'baby' ? '喂食成功，开始成长' : '喂食成功，开始生产');
            return;
        }

        if (state.pastureGame.currentTool === 'harvest') {
            if (animalAge === 'baby') {
                showPastureToast('还在幼崽期，不能收获哦！');
                return;
            }
            if (animalState !== 'ready') {
                showPastureToast('还没有可以收获的产物');
                return;
            }

            animal.state = 'hungry';
            animal.stateEndsAt = null;
            let rewardQty = 1;
            if (consumeRogueModifier('pasture_twin_yield') && Math.random() < getRogueModifierValue('pasture_twin_yield', 0.35)) {
                rewardQty += 1;
            }
            if (isRogueModifierActive('pasture_type_bonus') && !rogueModifierHasFlag('pasture_type_bonus', animal.type)) {
                rewardQty += 1;
                rogueModifierAddFlag('pasture_type_bonus', animal.type);
            }
            addInventoryItem(data.inventoryId, rewardQty);
            progressRoguePastureHarvest();
            renderPastureAnimals();
            saveGardenGameState();
            refreshGardenEconomyUi();
            showPastureToast(`获得 ${data.produceName} ${data.produceEmoji} x${rewardQty}，已存入仓库`);
        }
    }

    function showPastureFoodAnimation(animalWrapper, foodEmoji) {
        if (!pastureFieldEl || !animalWrapper) return;
        const food = document.createElement('div');
        food.className = 'garden-pasture-food-bowl';
        food.textContent = foodEmoji;
        pastureFieldEl.appendChild(food);

        const animalRect = animalWrapper.getBoundingClientRect();
        const pastureRect = pastureFieldEl.getBoundingClientRect();
        food.style.left = `${(animalRect.left - pastureRect.left) + 40}px`;
        food.style.top = `${(animalRect.top - pastureRect.top) - 50}px`;
        food.style.opacity = '1';
        food.style.transform = 'scale(0.5)';

        window.setTimeout(() => {
            food.style.transform = 'scale(1.2) translateY(50px)';
            window.setTimeout(() => {
                food.style.opacity = '0';
                window.setTimeout(() => {
                    if (food.parentNode) food.parentNode.removeChild(food);
                }, 500);
            }, 1000);
        }, 50);
    }

    function showPastureCoinAnimation(animalWrapper) {
        if (!pastureFieldEl || !animalWrapper) return;
        const coin = document.createElement('div');
        const animalRect = animalWrapper.getBoundingClientRect();
        const pastureRect = pastureFieldEl.getBoundingClientRect();
        coin.textContent = '🪙';
        coin.style.position = 'absolute';
        coin.style.left = `${(animalRect.left - pastureRect.left) + 25}px`;
        coin.style.top = `${animalRect.top - pastureRect.top}px`;
        coin.style.fontSize = '30px';
        coin.style.pointerEvents = 'none';
        coin.style.zIndex = '25';
        coin.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        pastureFieldEl.appendChild(coin);

        window.setTimeout(() => {
            coin.style.transform = 'translateY(-100px) scale(1.5)';
            coin.style.opacity = '0';
            window.setTimeout(() => {
                if (coin.parentNode) coin.parentNode.removeChild(coin);
            }, 1000);
        }, 50);
    }

    function showPastureGrowAnimation(wrapper) {
        if (!pastureFieldEl || !wrapper) return;
        const effect = document.createElement('div');
        const animalRect = wrapper.getBoundingClientRect();
        const pastureRect = pastureFieldEl.getBoundingClientRect();
        effect.textContent = '✨';
        effect.style.position = 'absolute';
        effect.style.left = `${(animalRect.left - pastureRect.left) + 20}px`;
        effect.style.top = `${animalRect.top - pastureRect.top}px`;
        effect.style.fontSize = '40px';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '25';
        effect.style.transition = 'all 1s';
        pastureFieldEl.appendChild(effect);

        wrapper.style.transform = 'scale(1.3)';
        window.setTimeout(() => {
            if (wrapper.isConnected) wrapper.style.transform = 'scale(1)';
        }, 300);
        window.setTimeout(() => {
            effect.style.transform = 'translateY(-60px) scale(1.5)';
            effect.style.opacity = '0';
            window.setTimeout(() => {
                if (effect.parentNode) effect.parentNode.removeChild(effect);
            }, 1000);
        }, 50);
    }

    function startPastureRoaming(wrapper) {
        if (!wrapper) return;
    }

    function roamPastureAnimals() {
        if (!getPastureAnimals().length) return;
        const now = Date.now();
        let moved = false;
        getPastureAnimals().forEach((animal) => {
            if (Number(state.pastureGame.visualEatingUntil[animal.id] || 0) > now) return;
            if (Math.random() >= 0.2) return;
            animal.x = Math.max(10, Math.min(90, animal.x + (Math.random() * 20 - 10)));
            animal.y = Math.max(15, Math.min(85, animal.y + (Math.random() * 20 - 10)));
            moved = true;
        });
        if (!moved) return;
        renderPastureAnimals();
        saveGardenGameState();
    }

    function initKitchenScreen() {
        if (!kitchenOverlayEl) return;
        if (!state.kitchenGame.initialized) {
            kitchenCookBtns.forEach((button) => {
                button.addEventListener('click', () => {
                    const recipeId = button.dataset.kitchenCook;
                    if (recipeId) cookKitchenRecipe(recipeId);
                });
            });

            kitchenOverlayEl.addEventListener('click', (event) => {
                if (!state.kitchenGame.qteActive) return;
                event.stopPropagation();
                handleKitchenQteHit();
            });

            state.kitchenGame.initialized = true;
        }

        syncKitchenCookButtons();
        syncGardenRogueUi();
    }

    function syncKitchenCookButtons() {
        kitchenCookBtns.forEach((button) => {
            const recipeId = button.dataset.kitchenCook;
            const recipe = recipeId ? KITCHEN_RECIPES[recipeId] : null;
            const canCook = !!recipe && hasInventoryItems(recipe.ingredients);
            const card = button.closest('[data-kitchen-recipe]');
            button.disabled = !canCook;
            button.textContent = canCook ? '烹饪' : '材料不足';
            if (card) {
                card.classList.toggle('is-disabled', !canCook);
            }
        });
        syncKitchenSkipButton();
    }

    function openKitchenScreen() {
        initKitchenScreen();
        if (!kitchenScreenEl) return;
        closePastureScreen({ silent: true });
        closeFarmScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        state.kitchenScreenOpen = true;
        state.currentHomeSection = 'kitchen';
        kitchenScreenEl.classList.add('is-open');
        kitchenScreenEl.setAttribute('aria-hidden', 'false');
        syncKitchenCookButtons();
        syncGardenRogueUi();
        vibrate(20);
    }

    function closeKitchenScreen(options) {
        if (!kitchenScreenEl) return;
        const silent = !!(options && options.silent);
        stopKitchenQte(true);
        state.kitchenScreenOpen = false;
        state.currentHomeSection = 'home';
        kitchenScreenEl.classList.remove('is-open');
        kitchenScreenEl.setAttribute('aria-hidden', 'true');
        if (!silent) vibrate(20);
    }

    function cookKitchenRecipe(recipeId) {
        const recipe = KITCHEN_RECIPES[recipeId];
        if (!recipe) return;
        if (!hasInventoryItems(recipe.ingredients)) {
            syncKitchenCookButtons();
            showKitchenToast('材料不足');
            return;
        }
        state.kitchenGame.currentRecipeId = recipeId;
        startKitchenQte();
    }

    function startKitchenQte() {
        if (!kitchenOverlayEl || !kitchenQteContainerEl || !kitchenQteDialEl || !kitchenQtePointerEl || !kitchenQteHintEl) return;

        const qteMultiplier = consumeRogueModifier('kitchen_easy_qte') ? getRogueModifierValue('kitchen_easy_qte', 1.35) : 1;
        const whiteWidth = Math.min(180, 90 * qteMultiplier);
        const yellowWidth = Math.min(whiteWidth - 10, 15 * qteMultiplier);
        const randomStart = Math.floor(Math.random() * Math.max(1, (320 - whiteWidth))) + 20;
        state.kitchenGame.whiteStart = randomStart;
        state.kitchenGame.whiteEnd = randomStart + whiteWidth;
        state.kitchenGame.yellowStart = randomStart + ((whiteWidth - yellowWidth) / 2);
        state.kitchenGame.yellowEnd = state.kitchenGame.yellowStart + yellowWidth;
        state.kitchenGame.currentAngle = 0;
        state.kitchenGame.qteActive = true;
        state.kitchenGame.spinDuration = 1.5 + Math.random() * 1.0;

        kitchenQteDialEl.style.background = `conic-gradient(
            #444 0deg,
            #444 ${state.kitchenGame.whiteStart - 0.5}deg,
            white ${state.kitchenGame.whiteStart}deg,
            white ${state.kitchenGame.yellowStart - 0.5}deg,
            #FF9800 ${state.kitchenGame.yellowStart}deg,
            #FF9800 ${state.kitchenGame.yellowEnd}deg,
            white ${state.kitchenGame.yellowEnd + 0.5}deg,
            white ${state.kitchenGame.whiteEnd}deg,
            #444 ${state.kitchenGame.whiteEnd + 0.5}deg,
            #444 360deg
        )`;

        kitchenOverlayEl.classList.add('is-active');
        kitchenQteContainerEl.classList.add('is-active');
        kitchenQteHintEl.classList.add('is-active');

        kitchenQtePointerEl.style.animation = 'none';
        kitchenQtePointerEl.style.transform = 'rotate(0deg) translateZ(0)';
        void kitchenQtePointerEl.offsetWidth;
        kitchenQtePointerEl.style.animation = `gardenKitchenSpinPointer ${state.kitchenGame.spinDuration}s linear infinite`;
        state.kitchenGame.startTime = performance.now();
        saveGardenGameState();
    }

    function handleKitchenQteHit() {
        if (!state.kitchenGame.qteActive || !kitchenQtePointerEl) return;
        const elapsedSeconds = (performance.now() - state.kitchenGame.startTime) / 1000;
        const progress = (elapsedSeconds / state.kitchenGame.spinDuration) % 1;
        const angle = progress * 360;
        state.kitchenGame.currentAngle = angle;

        kitchenQtePointerEl.style.animation = 'none';
        kitchenQtePointerEl.style.transform = `rotate(${angle}deg) translateZ(0)`;

        if (angle >= state.kitchenGame.yellowStart && angle <= state.kitchenGame.yellowEnd) {
            endKitchenQte(true, '完美成功！', 'perfect');
            return;
        }
        if (angle >= state.kitchenGame.whiteStart && angle <= state.kitchenGame.whiteEnd) {
            endKitchenQte(true, '普通成功！', 'normal');
            return;
        }
        endKitchenQte(false, '点错时机啦！烹饪失败...');
    }

    function endKitchenQte(isSuccess, message, quality) {
        state.kitchenGame.qteActive = false;
        window.setTimeout(() => {
            stopKitchenQte(true);
            if (!isSuccess) {
                showKitchenToast(`❌ ${message}`);
                return;
            }

            const recipe = KITCHEN_RECIPES[state.kitchenGame.currentRecipeId] || { id: null, name: '料理', emoji: '🍳', primaryIngredient: null, ingredients: {} };
            if (!spendInventoryItems(recipe.ingredients)) {
                syncKitchenCookButtons();
                showKitchenToast('材料不足，未能完成烹饪');
                return;
            }
            let outputQty = 1;
            if (consumeRogueModifier('kitchen_bonus_output')) {
                outputQty += 1;
            }
            if (recipe.id) {
                addInventoryItem(recipe.id, outputQty);
            }
            let returnedPrimary = false;
            if (recipe.primaryIngredient && consumeRogueModifier('kitchen_primary_save')) {
                addInventoryItem(recipe.primaryIngredient, 1);
                returnedPrimary = true;
            }
            progressRogueKitchenSuccess();
            saveGardenGameState();
            refreshGardenEconomyUi();
            const prefix = quality === 'perfect' ? '✨[完美品质]✨' : '✅';
            showKitchenToast(`${prefix} ${recipe.name} ${recipe.emoji} x${outputQty} 已存入仓库${returnedPrimary ? ' · 已返还 1 份主材料' : ''}`);
        }, 500);
    }

    function stopKitchenQte(resetPointer) {
        state.kitchenGame.qteActive = false;
        if (kitchenOverlayEl) kitchenOverlayEl.classList.remove('is-active');
        if (kitchenQteContainerEl) kitchenQteContainerEl.classList.remove('is-active');
        if (kitchenQteHintEl) kitchenQteHintEl.classList.remove('is-active');
        if (resetPointer && kitchenQtePointerEl) {
            kitchenQtePointerEl.style.animation = 'none';
            kitchenQtePointerEl.style.transform = 'rotate(0deg) translateZ(0)';
        }
    }

    function showKitchenToast(message) {
        if (!kitchenToastEl || !message) return;
        kitchenToastEl.textContent = message;
        kitchenToastEl.classList.add('is-visible');
        window.clearTimeout(state.kitchenToastTimeout);
        state.kitchenToastTimeout = window.setTimeout(() => {
            if (kitchenToastEl) kitchenToastEl.classList.remove('is-visible');
        }, 2500);
    }

    function triggerActivitiesPlayFeedback(playBtn) {
        if (!playBtn) return;
        const icon = playBtn.querySelector('i');
        if (!icon) return;

        icon.classList.remove('ph-play');
        icon.classList.add('ph-spinner-gap', 'is-spinning');

        window.clearTimeout(playBtn.spinTimer);
        playBtn.spinTimer = window.setTimeout(() => {
            icon.classList.remove('ph-spinner-gap', 'is-spinning');
            icon.classList.add('ph-play');
        }, 800);
    }

    function openActivitiesView() {
        init();
        if (!screenEl) return;
        syncGardenTitle();
        syncGardenLayoutFromActiveContact();
        switchView('activities');
        setDrawerOpen(false);
        closeFloraScreen();
        syncFloraFromEngine();
        screenEl.classList.remove('hidden');
    }

    function openWhisperChallengeFromActivities() {
        openActivitiesView();
        if (window.WhisperChallenge && typeof window.WhisperChallenge.openApp === 'function') {
            window.WhisperChallenge.openApp({ returnTarget: 'garden-activities' });
        }
    }

    function bindActivitiesInteractions() {
        if (!activitiesViewEl || activitiesViewEl.dataset.bound === 'true') return;

        activitiesViewEl.dataset.bound = 'true';
        activitiesViewEl.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-garden-action]');
            if (actionButton) {
                const action = actionButton.dataset.gardenAction;
                vibrate(20);
                if (action === 'back-home') {
                    closeApp();
                    return;
                }
                if (action === 'search-activities') {
                    return;
                }
            }

            const tabButton = event.target.closest('.garden-activities-tab');
            if (tabButton) {
                activitiesViewEl.querySelectorAll('.garden-activities-tab').forEach((button) => {
                    button.classList.toggle('is-active', button === tabButton);
                });
                vibrate(15);
                return;
            }

            const playButton = event.target.closest('.garden-activities-play-btn');
            if (playButton) {
                event.stopPropagation();
                vibrate(20);
                const playCard = playButton.closest('.garden-activities-card');
                if (playCard && playCard.dataset.activitiesCard === 'whisper') {
                    openWhisperChallengeFromActivities();
                    return;
                }
                if (playCard && playCard.dataset.activitiesCard === 'farm') {
                    openFarmRogueChallengeFromActivities();
                    return;
                }
                triggerActivitiesPlayFeedback(playButton);
                return;
            }

            const card = event.target.closest('.garden-activities-card');
            if (card) {
                vibrate(20);
                if (card.dataset.activitiesCard === 'whisper') {
                    openWhisperChallengeFromActivities();
                    return;
                }
                if (card.dataset.activitiesCard === 'farm') {
                    openFarmRogueChallengeFromActivities();
                    return;
                }
                triggerActivitiesPlayFeedback(card.querySelector('.garden-activities-play-btn'));
            }
        });
    }

    function initStorageView() {
        renderStorageItems(state.gardenGame && state.gardenGame.storage ? state.gardenGame.storage.tab : 'crops');
        syncStorageSellSheetUi();
        if (!storageViewEl || storageViewEl.dataset.bound === 'true') return;

        storageViewEl.dataset.bound = 'true';
        storageViewEl.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-storage-action]');
            if (actionButton) {
                const action = actionButton.dataset.storageAction;
                vibrate(20);
                if (action === 'exit') {
                    closeApp();
                }
                return;
            }

            const sellActionButton = event.target.closest('[data-storage-sell-action]');
            if (sellActionButton) {
                const sellAction = sellActionButton.dataset.storageSellAction;
                if (sellAction === 'cancel') {
                    closeStorageSellSheet();
                }
                if (sellAction === 'confirm' && state.storageSell.itemId) {
                    confirmStorageSell(state.storageSell.itemId, state.storageSell.qty);
                }
                vibrate(15);
                return;
            }

            const sellStepButton = event.target.closest('[data-storage-sell-step]');
            if (sellStepButton) {
                const step = sellStepButton.dataset.storageSellStep;
                if (step === 'all') {
                    setStorageSellQty(getInventoryCount(state.storageSell.itemId));
                } else {
                    setStorageSellQty((state.storageSell.qty || 1) + Number(step));
                }
                vibrate(12);
                return;
            }

            const itemCard = event.target.closest('[data-storage-item-id]');
            if (itemCard) {
                openStorageSellSheet(itemCard.dataset.storageItemId);
                vibrate(15);
                return;
            }

            const tabButton = event.target.closest('[data-storage-tab]');
            if (!tabButton) return;

            const nextTab = tabButton.dataset.storageTab;
            if (!nextTab || !STORAGE_TABS[nextTab] || !state.gardenGame) return;
            state.gardenGame.storage.tab = nextTab;
            saveGardenGameState();
            renderStorageItems(nextTab);
            vibrate(15);
        });
    }

    function renderStorageItems(type) {
        if (!storageGridEl) return;

        const nextType = sanitizeStorageTab(type);
        const items = STORAGE_TABS[nextType].itemIds
            .map((itemId) => ({ ...ITEM_META[itemId], count: getInventoryCount(itemId) }))
            .filter((item) => item.count > 0);
        renderStorageSpecialOrderCard();

        if (state.gardenGame && state.gardenGame.storage) {
            state.gardenGame.storage.tab = nextType;
        }

        storageTabBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.storageTab === nextType);
        });

        if (!items.length) {
            storageGridEl.innerHTML = '<div class="garden-storage-empty">当前分类暂无库存</div>';
            syncStorageSellSheetUi();
            return;
        }

        storageGridEl.innerHTML = items.map((item) => (
            `<button class="garden-storage-item" data-storage-item-id="${item.id}" type="button">
                <div class="garden-storage-item-count">${item.count}</div>
                <div class="garden-storage-item-icon">${item.emoji}</div>
                <div class="garden-storage-item-name">${item.name}</div>
                <div class="garden-storage-item-price">${getSellUnitPrice(item.id)} 金币/个</div>
            </button>`
        )).join('');

        syncStorageSellSheetUi();
    }

    function openStorageSellSheet(itemId) {
        if (!ITEM_META[itemId] || getInventoryCount(itemId) <= 0) return;
        state.storageSell.itemId = itemId;
        state.storageSell.qty = 1;
        syncStorageSellSheetUi();
    }

    function closeStorageSellSheet() {
        state.storageSell.itemId = null;
        state.storageSell.qty = 1;
        syncStorageSellSheetUi();
    }

    function setStorageSellQty(nextQty) {
        if (!state.storageSell.itemId) return;
        const maxQty = getInventoryCount(state.storageSell.itemId);
        const normalizedQty = Math.max(1, Math.min(maxQty, Math.floor(nextQty || 1)));
        state.storageSell.qty = normalizedQty;
        syncStorageSellSheetUi();
    }

    function syncStorageSellSheetUi() {
        if (!storageSellSheetEl) return;
        const itemId = state.storageSell.itemId;
        const meta = itemId ? ITEM_META[itemId] : null;
        const stockCount = itemId ? getInventoryCount(itemId) : 0;
        const isOpen = !!meta && stockCount > 0;
        storageSellSheetEl.classList.toggle('is-open', isOpen);
        storageSellSheetEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (!isOpen) return;

        state.storageSell.qty = Math.max(1, Math.min(stockCount, state.storageSell.qty || 1));
        if (storageSellIconEl) storageSellIconEl.textContent = meta.emoji;
        if (storageSellNameEl) storageSellNameEl.textContent = meta.name;
        if (storageSellStockEl) storageSellStockEl.textContent = `当前持有 ${stockCount}`;
        if (storageSellPriceEl) storageSellPriceEl.textContent = `单价 ${getSellUnitPrice(itemId)} 金币`;
        if (storageSellQtyEl) storageSellQtyEl.textContent = String(state.storageSell.qty);
        if (storageSellTotalEl) storageSellTotalEl.textContent = `${calculateStorageSellGold(itemId, state.storageSell.qty)} 金币`;
        if (storageSellConfirmBtn) {
            const disabled = state.storageSell.qty < 1 || state.storageSell.qty > stockCount;
            storageSellConfirmBtn.disabled = disabled;
        }
    }

    function confirmStorageSell(itemId, qty) {
        const meta = ITEM_META[itemId];
        if (!meta) return;
        const stockCount = getInventoryCount(itemId);
        const sellQty = Math.max(0, Math.min(stockCount, Math.floor(qty || 0)));
        if (sellQty < 1 || sellQty > stockCount) return;

        const totalGold = calculateStorageSellGold(itemId, sellQty);
        addInventoryItem(itemId, -sellQty);
        updateGardenCoins(totalGold);
        const orderResult = applySellToCurrentOrder(itemId, sellQty);
        saveGardenGameState();
        refreshGardenEconomyUi();

        if (orderResult && orderResult.finishedRun) {
            closeStorageSellSheet();
            openCurrentRogueStageScreen();
            return;
        }

        if (getInventoryCount(itemId) > 0) {
            state.storageSell.qty = Math.min(state.storageSell.qty, getInventoryCount(itemId));
            syncStorageSellSheetUi();
            return;
        }

        closeStorageSellSheet();
    }

    function hasResidentCharacterAssetDbSupport() {
        return typeof window !== 'undefined' && 'indexedDB' in window;
    }

    function openResidentCharacterAssetDb() {
        if (!hasResidentCharacterAssetDbSupport()) {
            return Promise.reject(new Error('indexeddb-not-supported'));
        }
        if (state.residentFigureAssetDbPromise) {
            return state.residentFigureAssetDbPromise;
        }

        state.residentFigureAssetDbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(GARDEN_FIGURE_ASSET_DB_NAME, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(GARDEN_FIGURE_ASSET_STORE)) {
                    db.createObjectStore(GARDEN_FIGURE_ASSET_STORE, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('indexeddb-open-failed'));
        }).catch((error) => {
            state.residentFigureAssetDbPromise = null;
            throw error;
        });

        return state.residentFigureAssetDbPromise;
    }

    async function saveResidentCharacterAssetFile(file) {
        const db = await openResidentCharacterAssetDb();
        const assetId = `garden_figure_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const record = {
            id: assetId,
            blob: file,
            name: file && file.name ? file.name : 'figure',
            type: file && file.type ? file.type : '',
            updatedAt: Date.now()
        };

        await new Promise((resolve, reject) => {
            const tx = db.transaction(GARDEN_FIGURE_ASSET_STORE, 'readwrite');
            tx.objectStore(GARDEN_FIGURE_ASSET_STORE).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('indexeddb-write-failed'));
            tx.onabort = () => reject(tx.error || new Error('indexeddb-write-aborted'));
        });

        return record;
    }

    async function readResidentCharacterAssetRecord(assetId) {
        if (!assetId) return null;
        const db = await openResidentCharacterAssetDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(GARDEN_FIGURE_ASSET_STORE, 'readonly');
            const request = tx.objectStore(GARDEN_FIGURE_ASSET_STORE).get(assetId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('indexeddb-read-failed'));
        });
    }

    async function getResidentCharacterAssetObjectUrl(assetId) {
        if (!assetId) return '';

        const cachedUrl = state.residentFigureAssetUrlCache.get(assetId);
        if (cachedUrl) return cachedUrl;

        const record = await readResidentCharacterAssetRecord(assetId);
        if (!record || !record.blob) return '';

        const objectUrl = URL.createObjectURL(record.blob);
        state.residentFigureAssetUrlCache.set(assetId, objectUrl);
        return objectUrl;
    }

    async function deleteResidentCharacterAsset(assetId) {
        if (!assetId || !hasResidentCharacterAssetDbSupport()) return;

        const cachedUrl = state.residentFigureAssetUrlCache.get(assetId);
        if (cachedUrl) {
            URL.revokeObjectURL(cachedUrl);
            state.residentFigureAssetUrlCache.delete(assetId);
        }

        const db = await openResidentCharacterAssetDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(GARDEN_FIGURE_ASSET_STORE, 'readwrite');
            tx.objectStore(GARDEN_FIGURE_ASSET_STORE).delete(assetId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('indexeddb-delete-failed'));
            tx.onabort = () => reject(tx.error || new Error('indexeddb-delete-aborted'));
        });
    }

    function getContactFigureDraftFile(fieldKey) {
        return state.contactFigureDraftFiles && state.contactFigureDraftFiles[fieldKey]
            ? state.contactFigureDraftFiles[fieldKey]
            : null;
    }

    function clearContactFigureDraftFile(fieldKey) {
        const draft = getContactFigureDraftFile(fieldKey);
        if (draft && draft.previewUrl) {
            URL.revokeObjectURL(draft.previewUrl);
        }
        if (!state.contactFigureDraftFiles) {
            state.contactFigureDraftFiles = createEmptyContactFigureDraftFiles();
        }
        state.contactFigureDraftFiles[fieldKey] = null;
    }

    function resetContactFigureDraftFiles() {
        ['idle', 'runLeft', 'runRight'].forEach(clearContactFigureDraftFile);
        state.contactFigureDraftFiles = createEmptyContactFigureDraftFiles();
    }

    function setContactFigureDraftFile(fieldKey, file) {
        clearContactFigureDraftFile(fieldKey);
        if (!file) return;
        if (!state.contactFigureDraftFiles) {
            state.contactFigureDraftFiles = createEmptyContactFigureDraftFiles();
        }
        state.contactFigureDraftFiles[fieldKey] = {
            file,
            name: file.name || 'figure',
            previewUrl: URL.createObjectURL(file)
        };
    }

    function getContactFigureInputSource(inputEl, fieldKey = '') {
        const manualUrl = inputEl && typeof inputEl.value === 'string' ? inputEl.value.trim() : '';
        if (manualUrl) {
            return { url: manualUrl, assetId: '', kind: 'url' };
        }

        const draft = fieldKey ? getContactFigureDraftFile(fieldKey) : null;
        if (draft && draft.previewUrl) {
            return { url: draft.previewUrl, assetId: '', kind: 'draft' };
        }

        const assetId = inputEl && inputEl.dataset ? String(inputEl.dataset.assetId || '').trim() : '';
        if (assetId) {
            return { url: '', assetId, kind: 'asset' };
        }

        return { url: '', assetId: '', kind: 'empty' };
    }

    function getContactFigureFieldConfigMeta(fieldKey) {
        if (fieldKey === 'runLeft') {
            return {
                urlKey: 'runLeftUrl',
                assetIdKey: 'runLeftAssetId',
                inputEl: contactFigureRunLeftInputEl,
                previewEl: contactFigureRunLeftPreviewEl,
                emptyLabel: '暂无左跑图'
            };
        }
        if (fieldKey === 'runRight') {
            return {
                urlKey: 'runRightUrl',
                assetIdKey: 'runRightAssetId',
                inputEl: contactFigureRunRightInputEl,
                previewEl: contactFigureRunRightPreviewEl,
                emptyLabel: '暂无右跑图'
            };
        }
        return {
            urlKey: 'idleUrl',
            assetIdKey: 'idleAssetId',
            inputEl: contactFigureIdleInputEl,
            previewEl: contactFigureIdlePreviewEl,
            emptyLabel: '暂无站立图'
        };
    }

    function ensureContactFigurePreviewImage(previewEl) {
        if (!previewEl) return null;

        let imageEl = previewEl.querySelector('.garden-contact-figure-preview-img');
        if (imageEl) return imageEl;

        imageEl = document.createElement('img');
        imageEl.className = 'garden-contact-figure-preview-img';
        imageEl.alt = 'contact figure preview';
        imageEl.draggable = false;
        imageEl.loading = 'eager';
        imageEl.style.width = '100%';
        imageEl.style.height = '100%';
        imageEl.style.display = 'block';
        imageEl.style.objectFit = 'contain';
        imageEl.style.objectPosition = 'center bottom';
        imageEl.style.borderRadius = 'inherit';
        imageEl.style.pointerEvents = 'none';
        imageEl.style.opacity = '0';
        imageEl.style.transition = 'opacity 0.18s ease';

        previewEl.insertBefore(imageEl, previewEl.firstChild || null);
        return imageEl;
    }

    function syncContactFigurePreview(previewEl, url, emptyLabel) {
        if (!previewEl) return;
        const nextUrl = sanitizeResidentCharacterUrl(url);
        const labelEl = previewEl.querySelector('.garden-contact-figure-preview-label');
        const imageEl = ensureContactFigurePreviewImage(previewEl);
        previewEl.style.backgroundImage = 'none';
        previewEl.classList.toggle('is-empty', !nextUrl);
        if (imageEl) {
            if (nextUrl) {
                if (imageEl.getAttribute('src') !== nextUrl) {
                    imageEl.setAttribute('src', nextUrl);
                }
                imageEl.style.opacity = '1';
            } else {
                imageEl.removeAttribute('src');
                imageEl.style.opacity = '0';
            }
        }
        if (labelEl) {
            labelEl.textContent = nextUrl ? '' : emptyLabel;
        }
    }
    function getContactFigureStoredValue(inputEl) {
        if (!inputEl) return '';
        const manualUrl = typeof inputEl.value === 'string' ? inputEl.value.trim() : '';
        if (manualUrl) return manualUrl;
        return inputEl.dataset && inputEl.dataset.uploadDataUrl
            ? String(inputEl.dataset.uploadDataUrl || '').trim()
            : '';
    }

    function isInlineImageDataUrl(value) {
        return typeof value === 'string' && /^data:image\//i.test(value.trim());
    }

    function updateContactFigureUploadStatus(fieldKey, inputEl) {
        if (!contactFigureModalEl || !inputEl) return;
        const statusEl = contactFigureModalEl.querySelector(`[data-figure-upload-status="${fieldKey}"]`);
        if (!statusEl) return;

        const manualUrl = typeof inputEl.value === 'string' ? inputEl.value.trim() : '';
        const uploadDataUrl = inputEl.dataset ? String(inputEl.dataset.uploadDataUrl || '').trim() : '';

        if (manualUrl) {
            statusEl.textContent = '当前使用：外部图片链接';
            return;
        }
        if (uploadDataUrl) {
            statusEl.textContent = '当前使用：浏览器内已上传动图';
            return;
        }
        statusEl.textContent = '当前使用：未设置';
    }

    function readContactFigureFormConfig() {
        return sanitizeResidentCharacter({
            idleUrl: getContactFigureStoredValue(contactFigureIdleInputEl),
            runLeftUrl: getContactFigureStoredValue(contactFigureRunLeftInputEl),
            runRightUrl: getContactFigureStoredValue(contactFigureRunRightInputEl)
        });
    }

    function updateContactFigureFormPreviews() {
        syncContactFigurePreview(contactFigureIdlePreviewEl, getContactFigureStoredValue(contactFigureIdleInputEl), '暂无站立图');
        syncContactFigurePreview(contactFigureRunLeftPreviewEl, getContactFigureStoredValue(contactFigureRunLeftInputEl), '暂无左跑图');
        syncContactFigurePreview(contactFigureRunRightPreviewEl, getContactFigureStoredValue(contactFigureRunRightInputEl), '暂无右跑图');
        updateContactFigureUploadStatus('idle', contactFigureIdleInputEl);
        updateContactFigureUploadStatus('runLeft', contactFigureRunLeftInputEl);
        updateContactFigureUploadStatus('runRight', contactFigureRunRightInputEl);
    }

    function fillContactFigureForm(contactId) {
        const resolvedContactId = resolveGardenContactId(contactId);
        const displayName = getGardenContactDisplayName(resolvedContactId);
        const config = getContactFigureConfig(resolvedContactId);

        state.contactFigureEditingId = resolvedContactId;
        if (contactFigureModalTitleEl) {
            contactFigureModalTitleEl.textContent = `${displayName}的形象设置`;
        }
        if (contactFigureIdleInputEl) {
            contactFigureIdleInputEl.value = isInlineImageDataUrl(config.idleUrl) ? '' : config.idleUrl;
            contactFigureIdleInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.idleUrl) ? config.idleUrl : '';
        }
        if (contactFigureRunLeftInputEl) {
            contactFigureRunLeftInputEl.value = isInlineImageDataUrl(config.runLeftUrl) ? '' : config.runLeftUrl;
            contactFigureRunLeftInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.runLeftUrl) ? config.runLeftUrl : '';
        }
        if (contactFigureRunRightInputEl) {
            contactFigureRunRightInputEl.value = isInlineImageDataUrl(config.runRightUrl) ? '' : config.runRightUrl;
            contactFigureRunRightInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.runRightUrl) ? config.runRightUrl : '';
        }
        updateContactFigureFormPreviews();
    }
    function readImageFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error || new Error('file-read-failed'));
            reader.readAsDataURL(file);
        });
    }

    async function applyContactFigureUpload(fieldKey, file) {
        const meta = getContactFigureFieldConfigMeta(fieldKey);
        if (!meta.inputEl || !file) return;

        if (!(file.type || '').toLowerCase().startsWith('image/')) {
            window.alert('请选择图片或动图文件。');
            return;
        }
        if (file.size > 900 * 1024) {
            window.alert('图片过大，当前浏览器直传建议控制在 900KB 以内，优先使用 WebP 动图。');
            return;
        }

        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            if (!dataUrl) {
                window.alert('图片读取失败，请重试。');
                return;
            }
            meta.inputEl.value = '';
            meta.inputEl.dataset.uploadDataUrl = dataUrl;
            updateContactFigureFormPreviews();
        } catch (error) {
            window.alert('图片读取失败，请重试。');
        }
    }

    function closeContactFigureModal() {
        if (!contactFigureModalEl) return;
        contactFigureModalEl.classList.remove('is-open');
        state.contactFigureEditingId = null;
        window.setTimeout(() => {
            if (contactFigureModalEl && !contactFigureModalEl.classList.contains('is-open')) {
                contactFigureModalEl.hidden = true;
            }
        }, 180);
    }

    function openContactFigureSettings(contactId = null) {
        init();
        ensureContactFigureModal();
        if (!contactFigureModalEl) return;

        fillContactFigureForm(contactId);
        contactFigureModalEl.hidden = false;
        window.requestAnimationFrame(() => {
            if (!contactFigureModalEl) return;
            contactFigureModalEl.classList.add('is-open');
        });
    }

    function ensureContactFigureModal() {
        if (!screenEl || contactFigureModalEl) return;

        const modal = document.createElement('div');
        modal.className = 'garden-contact-figure-modal';
        modal.hidden = true;
        modal.innerHTML = `
            <div class="garden-contact-figure-backdrop"></div>
            <div class="garden-contact-figure-panel" role="dialog" aria-modal="true" aria-label="联系人形象设置">
                <div class="garden-contact-figure-handle"></div>
                <div class="garden-contact-figure-head">
                    <div class="garden-contact-figure-title">联系人形象设置</div>
                    <button class="garden-contact-figure-close" type="button" aria-label="关闭">×</button>
                </div>
                <div class="garden-contact-figure-form">
                    <div class="garden-contact-figure-tip">可直接在网页里上传动图。注意：这种方式只会保存在当前用户自己的浏览器里，不会自动同步给所有用户。</div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-idle">站立动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-idle-preview"><span class="garden-contact-figure-preview-label">暂无站立图</span></div>
                        </div>
                        <input id="garden-contact-figure-idle" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="idle">上传站立图</button>
                            <span data-figure-upload-status="idle" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-idle-file" type="file" accept="image/*" hidden />
                    </div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-run-left">向左跑动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-run-left-preview"><span class="garden-contact-figure-preview-label">暂无左跑图</span></div>
                        </div>
                        <input id="garden-contact-figure-run-left" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="runLeft">上传左跑图</button>
                            <span data-figure-upload-status="runLeft" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-run-left-file" type="file" accept="image/*" hidden />
                    </div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-run-right">向右跑动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-run-right-preview"><span class="garden-contact-figure-preview-label">暂无右跑图</span></div>
                        </div>
                        <input id="garden-contact-figure-run-right" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="runRight">上传右跑图</button>
                            <span data-figure-upload-status="runRight" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-run-right-file" type="file" accept="image/*" hidden />
                    </div>
                </div>
                <div class="garden-contact-figure-actions">
                    <button class="garden-contact-figure-action is-muted" type="button" data-figure-action="cancel">取消</button>
                    <button class="garden-contact-figure-action is-danger" type="button" data-figure-action="clear">清空</button>
                    <button class="garden-contact-figure-action is-primary" type="button" data-figure-action="save">保存</button>
                </div>
            </div>
        `;
        screenEl.appendChild(modal);

        contactFigureModalEl = modal;
        contactFigureModalTitleEl = modal.querySelector('.garden-contact-figure-title');
        contactFigureIdleInputEl = modal.querySelector('#garden-contact-figure-idle');
        contactFigureRunLeftInputEl = modal.querySelector('#garden-contact-figure-run-left');
        contactFigureRunRightInputEl = modal.querySelector('#garden-contact-figure-run-right');
        contactFigureIdlePreviewEl = modal.querySelector('#garden-contact-figure-idle-preview');
        contactFigureRunLeftPreviewEl = modal.querySelector('#garden-contact-figure-run-left-preview');
        contactFigureRunRightPreviewEl = modal.querySelector('#garden-contact-figure-run-right-preview');

        const closeButton = modal.querySelector('.garden-contact-figure-close');
        const backdrop = modal.querySelector('.garden-contact-figure-backdrop');
        const cancelButton = modal.querySelector('[data-figure-action="cancel"]');
        const clearButton = modal.querySelector('[data-figure-action="clear"]');
        const saveButton = modal.querySelector('[data-figure-action="save"]');
        const idleFileInput = modal.querySelector('#garden-contact-figure-idle-file');
        const runLeftFileInput = modal.querySelector('#garden-contact-figure-run-left-file');
        const runRightFileInput = modal.querySelector('#garden-contact-figure-run-right-file');
        const uploadButtons = Array.from(modal.querySelectorAll('[data-figure-upload]'));

        [contactFigureIdleInputEl, contactFigureRunLeftInputEl, contactFigureRunRightInputEl].forEach((input) => {
            if (!input) return;
            input.addEventListener('input', updateContactFigureFormPreviews);
        });

        uploadButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const fieldKey = button.dataset.figureUpload;
                if (fieldKey === 'idle' && idleFileInput) idleFileInput.click();
                if (fieldKey === 'runLeft' && runLeftFileInput) runLeftFileInput.click();
                if (fieldKey === 'runRight' && runRightFileInput) runRightFileInput.click();
            });
        });

        if (idleFileInput) {
            idleFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('idle', idleFileInput.files && idleFileInput.files[0] ? idleFileInput.files[0] : null);
                idleFileInput.value = '';
            });
        }
        if (runLeftFileInput) {
            runLeftFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('runLeft', runLeftFileInput.files && runLeftFileInput.files[0] ? runLeftFileInput.files[0] : null);
                runLeftFileInput.value = '';
            });
        }
        if (runRightFileInput) {
            runRightFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('runRight', runRightFileInput.files && runRightFileInput.files[0] ? runRightFileInput.files[0] : null);
                runRightFileInput.value = '';
            });
        }

        if (closeButton) closeButton.addEventListener('click', closeContactFigureModal);
        if (backdrop) backdrop.addEventListener('click', closeContactFigureModal);
        if (cancelButton) cancelButton.addEventListener('click', closeContactFigureModal);
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (!state.contactFigureEditingId) {
                    closeContactFigureModal();
                    return;
                }
                setContactFigureConfig(state.contactFigureEditingId, createEmptyResidentCharacter());
                closeContactFigureModal();
                vibrate(15);
            });
        }
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                if (!state.contactFigureEditingId) {
                    closeContactFigureModal();
                    return;
                }
                setContactFigureConfig(state.contactFigureEditingId, readContactFigureFormConfig());
                closeContactFigureModal();
                vibrate(15);
            });
        }
    }

    function createEmptyGardenLayoutStore() {
        return {
            contacts: {}
        };
    }

    function createDefaultGardenLayout() {
        return {
            wall: {
                background: '',
                backgroundSize: '',
                backgroundColor: ''
            },
            floor: {
                background: '',
                backgroundSize: '',
                backgroundColor: ''
            },
            residentCharacter: {
                idleUrl: '',
                idleAssetId: '',
                runLeftUrl: '',
                runLeftAssetId: '',
                runRightUrl: ''
                ,runRightAssetId: ''
            },
            items: []
        };
    }

    function sanitizeGardenSurface(rawSurface) {
        const surface = rawSurface && typeof rawSurface === 'object' ? rawSurface : {};
        return {
            background: typeof surface.background === 'string' ? surface.background : '',
            backgroundSize: typeof surface.backgroundSize === 'string' ? surface.backgroundSize : '',
            backgroundColor: typeof surface.backgroundColor === 'string' ? surface.backgroundColor : ''
        };
    }

    function sanitizeResidentCharacterUrl(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function createEmptyResidentCharacter() {
        return {
            idleUrl: '',
            idleAssetId: '',
            runLeftUrl: '',
            runLeftAssetId: '',
            runRightUrl: ''
            ,runRightAssetId: ''
        };
    }

    function sanitizeResidentCharacter(rawCharacter) {
        const source = rawCharacter && typeof rawCharacter === 'object' ? rawCharacter : {};
        return {
            idleUrl: sanitizeResidentCharacterUrl(source.idleUrl),
            idleAssetId: sanitizeResidentCharacterUrl(source.idleAssetId),
            runLeftUrl: sanitizeResidentCharacterUrl(source.runLeftUrl),
            runLeftAssetId: sanitizeResidentCharacterUrl(source.runLeftAssetId),
            runRightUrl: sanitizeResidentCharacterUrl(source.runRightUrl)
            ,runRightAssetId: sanitizeResidentCharacterUrl(source.runRightAssetId)
        };
    }

    function sanitizeGardenItem(rawItem) {
        if (!rawItem || typeof rawItem !== 'object') return null;
        if (typeof rawItem.type !== 'string' || !SHAPE_GENERATORS[rawItem.type]) return null;

        const placement = rawItem.placement === 'wall' ? 'wall' : 'floor';
        const item = {
            type: rawItem.type,
            placement,
            left: typeof rawItem.left === 'string' ? rawItem.left : (placement === 'wall' ? '50%' : '50%'),
            top: typeof rawItem.top === 'string' ? rawItem.top : (placement === 'wall' ? '30%' : '80%')
        };

        if (rawItem.portal === 'flora' || rawItem.type === 'flora_portal_plant') {
            item.fixed = true;
            item.portal = 'flora';
        }

        return item;
    }

    function sanitizeGardenLayout(rawLayout) {
        const layout = rawLayout && typeof rawLayout === 'object' ? rawLayout : {};
        return {
            wall: sanitizeGardenSurface(layout.wall),
            floor: sanitizeGardenSurface(layout.floor),
            residentCharacter: sanitizeResidentCharacter(layout.residentCharacter),
            items: Array.isArray(layout.items)
                ? layout.items.map(sanitizeGardenItem).filter(Boolean)
                : []
        };
    }

    function readGardenLayouts() {
        if (state.gardenLayouts) return state.gardenLayouts;

        const emptyStore = createEmptyGardenLayoutStore();

        try {
            const raw = window.localStorage.getItem(GARDEN_LAYOUT_STORAGE_KEY);
            if (!raw) {
                state.gardenLayouts = emptyStore;
                return state.gardenLayouts;
            }

            const parsed = JSON.parse(raw);
            const store = createEmptyGardenLayoutStore();
            const contacts = parsed && parsed.contacts && typeof parsed.contacts === 'object' ? parsed.contacts : {};
            Object.keys(contacts).forEach((contactId) => {
                store.contacts[contactId] = sanitizeGardenLayout(contacts[contactId]);
            });
            state.gardenLayouts = store;
            return state.gardenLayouts;
        } catch (error) {
            console.warn('[garden-app] layout-read-failed', error);
            state.gardenLayouts = emptyStore;
            return state.gardenLayouts;
        }
    }

    function writeGardenLayouts() {
        if (!state.gardenLayouts) return;
        try {
            window.localStorage.setItem(GARDEN_LAYOUT_STORAGE_KEY, JSON.stringify(state.gardenLayouts));
        } catch (error) {
            console.warn('[garden-app] layout-write-failed', error);
        }
    }

    function resolveGardenContactId(explicitContactId = null) {
        if (explicitContactId) return String(explicitContactId);
        if (window.FloraEngine && typeof window.FloraEngine.getSnapshot === 'function') {
            const snapshot = window.FloraEngine.getSnapshot();
            if (snapshot && snapshot.contactId) {
                return String(snapshot.contactId);
            }
        }
        if (window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
            return String(window.iphoneSimState.currentChatContactId);
        }
        return '__default__';
    }

    function getStoredGardenLayout(contactId) {
        const store = readGardenLayouts();
        const resolvedContactId = resolveGardenContactId(contactId);
        return store.contacts[resolvedContactId] ? sanitizeGardenLayout(store.contacts[resolvedContactId]) : null;
    }

    function findGardenContact(contactId) {
        if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return null;
        return window.iphoneSimState.contacts.find((contact) => String(contact.id) === String(contactId)) || null;
    }

    function getGardenContactDisplayName(contactId) {
        const contact = findGardenContact(contactId);
        if (!contact) return '\u8be5\u8054\u7cfb\u4eba';
        return contact.remark || contact.nickname || contact.name || '\u8be5\u8054\u7cfb\u4eba';
    }

    function getContactFigureConfig(contactId = null) {
        const layout = getStoredGardenLayout(contactId);
        return layout ? sanitizeResidentCharacter(layout.residentCharacter) : createEmptyResidentCharacter();
    }

    function setContactFigureConfig(contactId = null, config = {}) {
        const resolvedContactId = resolveGardenContactId(contactId);
        const store = readGardenLayouts();
        const existingLayout = store.contacts[resolvedContactId]
            ? sanitizeGardenLayout(store.contacts[resolvedContactId])
            : createDefaultGardenLayout();

        existingLayout.residentCharacter = sanitizeResidentCharacter(config);
        store.contacts[resolvedContactId] = existingLayout;
        state.gardenLayouts = store;
        writeGardenLayouts();

        if (String(state.currentGardenContactId || '') === String(resolvedContactId)) {
            refreshActiveContactFigure();
        }

        return sanitizeResidentCharacter(existingLayout.residentCharacter);
    }

    function serializeSurface(targetEl) {
        if (!targetEl) {
            return sanitizeGardenSurface(null);
        }
        return {
            background: targetEl.style.background || '',
            backgroundSize: targetEl.style.backgroundSize || '',
            backgroundColor: targetEl.style.backgroundColor || ''
        };
    }

    function applySurface(targetEl, surface) {
        if (!targetEl) return;
        const nextSurface = sanitizeGardenSurface(surface);
        targetEl.style.background = nextSurface.background || '';
        targetEl.style.backgroundSize = nextSurface.backgroundSize || '';
        targetEl.style.backgroundColor = nextSurface.backgroundColor || '';
    }

    function createItemSnapshot(itemEl) {
        if (!itemEl || !itemEl.dataset || !itemEl.dataset.itemType) return null;

        const isPortalFlora = itemEl.dataset.portal === 'flora' || itemEl.dataset.itemType === 'flora_portal_plant';
        if (itemEl.dataset.fixed === 'true' && !isPortalFlora) {
            return null;
        }

        const snapshot = {
            type: itemEl.dataset.itemType,
            placement: itemEl.dataset.placement === 'wall' ? 'wall' : 'floor',
            left: itemEl.style.left || '50%',
            top: itemEl.style.top || (itemEl.dataset.placement === 'wall' ? '30%' : '80%')
        };

        if (isPortalFlora) {
            snapshot.fixed = true;
            snapshot.portal = 'flora';
        }

        return snapshot;
    }

    function collectCurrentGardenLayout() {
        const layout = createDefaultGardenLayout();
        if (!state.roomEl) {
            return layout;
        }

        layout.wall = serializeSurface(state.wallEl);
        layout.floor = serializeSurface(state.floorEl);
        layout.residentCharacter = getContactFigureConfig(resolveGardenContactId(state.currentGardenContactId));
        layout.items = Array.from(state.roomEl.querySelectorAll('.item-container'))
            .map(createItemSnapshot)
            .filter(Boolean);

        return sanitizeGardenLayout(layout);
    }

    function clearRoomItems() {
        if (!state.roomEl) return;
        Array.from(state.roomEl.querySelectorAll('.item-container')).forEach((itemEl) => {
            if (itemEl.petInterval) clearInterval(itemEl.petInterval);
            itemEl.remove();
        });
    }

    function buildItemOptionsFromSnapshot(itemSnapshot) {
        const options = {
            left: itemSnapshot.left,
            top: itemSnapshot.top
        };

        if (itemSnapshot.portal === 'flora' || itemSnapshot.type === 'flora_portal_plant') {
            options.fixed = true;
            options.portal = 'flora';
            options.ariaLabel = '\u6253\u5f00\u5fc3\u60c5\u7eff\u690d';
            options.className = 'is-fixed-portal';
            options.onClick = openFloraScreen;
        }

        return options;
    }

    function applyGardenLayout(layout) {
        if (!state.roomEl) return;

        const nextLayout = sanitizeGardenLayout(layout);
        clearResidentCharacterFigure();
        clearRoomItems();
        applySurface(state.wallEl, nextLayout.wall);
        applySurface(state.floorEl, nextLayout.floor);

        nextLayout.items.forEach((itemSnapshot) => {
            createRoomItem(itemSnapshot.type, itemSnapshot.placement, buildItemOptionsFromSnapshot(itemSnapshot));
        });

        ensureFixedFloraPlant();
        refreshActiveContactFigure(nextLayout.residentCharacter);
        syncFloraFromEngine();
    }

    function persistGardenLayoutForContact(contactId = null) {
        if (!state.roomEl) return;

        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const store = readGardenLayouts();
        store.contacts[resolvedContactId] = collectCurrentGardenLayout();
        state.gardenLayouts = store;
        writeGardenLayouts();
    }

    function restoreGardenLayoutForContact(contactId = null) {
        const resolvedContactId = resolveGardenContactId(contactId);
        const layout = getStoredGardenLayout(resolvedContactId) || createDefaultGardenLayout();
        state.currentGardenContactId = resolvedContactId;
        applyGardenLayout(layout);
    }

    function syncGardenLayoutFromActiveContact() {
        const activeContactId = resolveGardenContactId();
        if (state.currentGardenContactId && state.currentGardenContactId !== activeContactId) {
            persistGardenLayoutForContact(state.currentGardenContactId);
        }
        restoreGardenLayoutForContact(activeContactId);
    }

    function initEditor() {
        if (!editorHost || editorHost.shadowRoot) {
            state.shadowRoot = editorHost ? editorHost.shadowRoot : null;
            cacheShadowElements();
            ensureFixedFloraPlant();
            return;
        }

        const shadowRoot = editorHost.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/regular/style.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/fill/style.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/bold/style.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/duotone/style.css">
            <link rel="stylesheet" href="css/garden_app_shadow.css?v=4">

            <div class="garden-editor-root">
                <div class="bg-blob blob-1"></div>
                <div class="bg-blob blob-2"></div>

                <main id="room">
                    <div class="room-wall" id="roomWall"></div>
                    <div class="room-floor" id="roomFloor"></div>
                    <div class="resident-character-layer" id="residentCharacterLayer"></div>
                    <div class="toast" id="toast"><i class="fas fa-hand-pointer"></i> 丝滑拖拽，双击收回</div>
                </main>

                <div class="decor-panel glass" id="decorPanel">
                    <div class="tabs" id="gardenPanelTabs"></div>
                    <div class="panel-content" id="gardenPanelContent"></div>
                </div>
            </div>
        `;

        state.shadowRoot = shadowRoot;
        cacheShadowElements();
        renderPanel();
        shadowRoot.addEventListener('click', handleShadowClick);
        setDrawerOpen(false);
        ensureFixedFloraPlant();
    }

    function cacheShadowElements() {
        if (!state.shadowRoot) return;
        state.roomEl = state.shadowRoot.getElementById('room');
        state.wallEl = state.shadowRoot.getElementById('roomWall');
        state.floorEl = state.shadowRoot.getElementById('roomFloor');
        state.residentLayerEl = state.shadowRoot.getElementById('residentCharacterLayer');
        state.toastEl = state.shadowRoot.getElementById('toast');
        state.drawerEl = state.shadowRoot.getElementById('decorPanel');
        state.tabsEl = state.shadowRoot.getElementById('gardenPanelTabs');
        state.panelContentEl = state.shadowRoot.getElementById('gardenPanelContent');
    }

    function renderPanel() {
        if (!state.tabsEl || !state.panelContentEl) return;

        state.tabsEl.innerHTML = PANEL_TABS.map((tab) => `
            <button type="button" class="tab${tab.key === state.activeTab ? ' active' : ''}" data-tab-key="${tab.key}">
                <i class="${tab.icon}"></i>
                <span>${tab.label}</span>
            </button>
        `).join('');

        state.panelContentEl.innerHTML = PANEL_TABS.map((tab) => `
            <div class="item-grid${tab.key === state.activeTab ? ' active' : ''}" id="tab-${tab.key}">
                ${tab.items.map((item, index) => renderCard(tab.key, item, index)).join('')}
            </div>
        `).join('');
    }

    function renderCard(tabKey, item, index) {
        if (item.kind === 'texture') {
            return `
                <button type="button" class="item-card" data-tab-key="${tabKey}" data-item-index="${index}">
                    <div class="texture-swatch" style="${item.swatchStyle}"></div>
                    <span class="item-name">${item.name}</span>
                </button>
            `;
        }

        return `
            <button type="button" class="item-card" data-tab-key="${tabKey}" data-item-index="${index}">
                <i class="${item.icon} card-icon" style="color: ${item.color};"></i>
                <span class="item-name">${item.name}</span>
            </button>
        `;
    }

    function handleShadowClick(event) {
        const tabBtn = event.target.closest('.tab');
        if (tabBtn) {
            switchPanelTab(tabBtn.dataset.tabKey);
            return;
        }

        const card = event.target.closest('.item-card');
        if (!card) return;

        const tab = PANEL_TABS.find((item) => item.key === card.dataset.tabKey);
        const action = tab && tab.items[Number(card.dataset.itemIndex)];
        if (!action) return;

        if (action.kind === 'spawn') {
            spawnItem(action.itemType, action.placement);
            return;
        }

        changeTexture(action.target, action.background, action.bgSize, action.bgColor);
    }

    function isEventWithinElement(event, element) {
        if (!event || !element) return false;

        if (typeof event.composedPath === 'function') {
            const path = event.composedPath();
            if (Array.isArray(path) && path.includes(element)) {
                return true;
            }
        }

        const target = event.target;
        return !!(target && typeof element.contains === 'function' && element.contains(target));
    }

    function handleOutsideDrawerClick(event) {
        if (!state.drawerOpen || state.currentView !== 'home') return;
        if (isEventWithinElement(event, state.drawerEl)) return;
        if (isEventWithinElement(event, togglePanelBtn)) return;
        setDrawerOpen(false);
    }

    function switchPanelTab(tabKey) {
        state.activeTab = tabKey;
        if (!state.shadowRoot) return;

        state.shadowRoot.querySelectorAll('.tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.tabKey === tabKey);
        });
        state.shadowRoot.querySelectorAll('.item-grid').forEach((grid) => {
            grid.classList.toggle('active', grid.id === `tab-${tabKey}`);
        });
        vibrate(20);
    }

    function createRoomItem(type, placement, options = {}) {
        if (!state.roomEl || !SHAPE_GENERATORS[type]) return null;

        const item = document.createElement('div');
        item.className = `item-container${options.className ? ` ${options.className}` : ''}`;
        item.innerHTML = SHAPE_GENERATORS[type];
        item.dataset.itemType = type;
        item.dataset.placement = placement;
        item.style.left = options.left || '50%';
        item.style.top = options.top || (placement === 'wall' ? '30%' : '80%');

        if (type.startsWith('pet_')) {
            item.dataset.isPet = 'true';
        }
        if (options.fixed) {
            item.dataset.fixed = 'true';
        }
        if (options.portal) {
            item.dataset.portal = options.portal;
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', options.ariaLabel || '可交互物件');
        }

        if (!options.noDrag) {
            makeDraggable(item);
        }

        if (typeof options.onClick === 'function') {
            item.addEventListener('click', (clickEvent) => {
                if (item.dataset.justDragged === 'true') {
                    clickEvent.preventDefault();
                    clickEvent.stopPropagation();
                    return;
                }
                clickEvent.stopPropagation();
                options.onClick(clickEvent);
            });
            item.addEventListener('keydown', (keyEvent) => {
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    keyEvent.preventDefault();
                    options.onClick(keyEvent);
                }
            });
        }

        item.addEventListener('dblclick', function (dblEvent) {
            dblEvent.stopPropagation();
            if (this.dataset.fixed === 'true') return;
            const removedContactId = state.currentGardenContactId;
            if (this.petInterval) clearInterval(this.petInterval);
            this.style.animation = 'popOut 0.3s forwards';
            vibrate(20);
            setTimeout(() => {
                this.remove();
                persistGardenLayoutForContact(removedContactId);
            }, 300);
        });

        state.roomEl.appendChild(item);
        updateZIndex(item);

        if (item.dataset.isPet) {
            startPetAI(item);
        }

        return item;
    }

    function ensureFixedFloraPlant() {
        if (!state.roomEl || state.roomEl.querySelector('.item-container[data-portal="flora"]')) return;

        createRoomItem('flora_portal_plant', 'floor', {
            left: '18%',
            top: '84%',
            fixed: true,
            portal: 'flora',
            ariaLabel: '\u6253\u5f00\u5fc3\u60c5\u7eff\u690d',
            className: 'is-fixed-portal',
            onClick: openFloraScreen
        });
    }

    function spawnItem(type, placement) {
        const item = createRoomItem(type, placement);
        if (!item) return;

        persistGardenLayoutForContact();
        showToast();
        vibrate(30);
    }

    function startPetAI(item) {

        const petShape = item.querySelector('.shape-pet');
        const flipper = item.querySelector('.pet-flipper');
        if (!petShape || !flipper) return;

        item.petInterval = setInterval(() => {
            if (item.classList.contains('dragging')) return;

            const rand = Math.random();
            if (rand < 0.4) {
                petShape.classList.remove('is-walking');
                petShape.classList.add('is-sitting');
                flipper.style.transform = 'scaleX(1)';
                item.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
            } else {
                petShape.classList.remove('is-sitting');
                petShape.classList.add('is-walking');

                const currentLeft = parseFloat(item.style.left) || 50;
                const currentTop = parseFloat(item.style.top) || 80;
                const dirX = (Math.random() - 0.5) * 30;
                const dirY = (Math.random() - 0.5) * 10;
                const newLeft = Math.max(10, Math.min(90, currentLeft + dirX));
                const newTop = Math.max(65, Math.min(95, currentTop + dirY));

                flipper.style.transform = newLeft > currentLeft ? 'scaleX(1)' : 'scaleX(-1)';

                item.style.transition = 'left 3s linear, top 3s linear';
                item.style.left = `${newLeft}%`;
                item.style.top = `${newTop}%`;
                updateZIndex(item, newTop);
            }
        }, 3000);
    }

    function makeDraggable(el) {
        let isDragging = false;
        let hasMoved = false;
        let startX;
        let startY;
        let startLeftPercent;
        let startTopPercent;

        const startDrag = (event) => {
            isDragging = true;
            hasMoved = false;
            el.classList.add('dragging');

            if (el.dataset.isPet) {
                const petShape = el.querySelector('.shape-pet');
                if (petShape) petShape.classList.remove('is-walking', 'is-sitting');
            }

            startLeftPercent = parseFloat(el.style.left) || 50;
            startTopPercent = parseFloat(el.style.top) || 50;
            startX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            startY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            vibrate(15);
        };

        const drag = (event) => {
            if (!isDragging || !state.roomEl) return;
            event.preventDefault();

            const currentX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            const currentY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            const dx = currentX - startX;
            const dy = currentY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                hasMoved = true;
            }
            const roomRect = state.roomEl.getBoundingClientRect();

            let newLeftPercent = startLeftPercent + (dx / roomRect.width) * 100;
            let newTopPercent = startTopPercent + (dy / roomRect.height) * 100;

            newLeftPercent = Math.max(0, Math.min(newLeftPercent, 100));

            const wallLimitPercent = 60;
            if (el.dataset.placement === 'wall') {
                newTopPercent = Math.max(0, Math.min(newTopPercent, wallLimitPercent));
            } else {
                newTopPercent = Math.max(wallLimitPercent - 5, Math.min(newTopPercent, 100));
            }

            el.style.left = `${newLeftPercent}%`;
            el.style.top = `${newTopPercent}%`;
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            el.classList.remove('dragging');
            updateZIndex(el);

            if (hasMoved) {
                el.dataset.justDragged = 'true';
                clearTimeout(el.justDraggedTimer);
                el.justDraggedTimer = setTimeout(() => {
                    delete el.dataset.justDragged;
                }, 220);
                persistGardenLayoutForContact();
            }

            if (el.dataset.isPet) {
                const petShape = el.querySelector('.shape-pet');
                const flipper = el.querySelector('.pet-flipper');
                if (petShape) petShape.classList.add('is-sitting');
                if (flipper) flipper.style.transform = 'scaleX(1)';
            }
        };

        el.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    function updateZIndex(el, dynamicTop = null) {
        if (el.dataset.placement === 'wall') {
            el.style.zIndex = '5';
        } else if (el.querySelector('.shape-rug')) {
            el.style.zIndex = '10';
        } else {
            const topPercent = dynamicTop !== null ? dynamicTop : parseFloat(el.style.top);
            el.style.zIndex = String(Math.floor(topPercent));
        }
    }

    function randomInRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function clampResidentFigureValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function clearResidentCharacterTimers() {
        if (state.residentFigureLoopTimer) {
            clearTimeout(state.residentFigureLoopTimer);
            state.residentFigureLoopTimer = null;
        }
        if (state.residentFigureMoveTimer) {
            clearTimeout(state.residentFigureMoveTimer);
            state.residentFigureMoveTimer = null;
        }
    }

    function clearResidentCharacterFigure() {
        clearResidentCharacterTimers();
        state.residentFigurePreloadToken += 1;
        if (state.residentFigureEl) {
            state.residentFigureEl.remove();
            state.residentFigureEl = null;
        }
    }

    function resolveResidentCharacterUrl(config, pose) {
        const nextConfig = sanitizeResidentCharacter(config);
        if (pose === 'run-left') {
            return nextConfig.runLeftUrl || nextConfig.runRightUrl || nextConfig.idleUrl || '';
        }
        if (pose === 'run-right') {
            return nextConfig.runRightUrl || nextConfig.runLeftUrl || nextConfig.idleUrl || '';
        }
        return nextConfig.idleUrl || nextConfig.runLeftUrl || nextConfig.runRightUrl || '';
    }

    function getResidentCharacterImageEl(figureEl) {
        if (!figureEl) return null;
        return figureEl.querySelector('.resident-character-sprite-img');
    }

    function waitForResidentCharacterImageEl(imageEl, timeout = 1200) {
        if (!imageEl) return Promise.resolve('empty');
        const currentUrl = imageEl.currentSrc || imageEl.getAttribute('src') || '';
        if (!currentUrl) return Promise.resolve('empty');
        if (imageEl.complete) {
            return Promise.resolve(imageEl.naturalWidth > 0 ? 'loaded' : 'error');
        }

        return new Promise((resolve) => {
            let timeoutId = null;
            const finalize = (status) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                imageEl.removeEventListener('load', handleLoad);
                imageEl.removeEventListener('error', handleError);
                resolve(status);
            };

            const handleLoad = () => finalize('loaded');
            const handleError = () => finalize('error');

            imageEl.addEventListener('load', handleLoad, { once: true });
            imageEl.addEventListener('error', handleError, { once: true });
            timeoutId = window.setTimeout(() => finalize('timeout'), timeout);
        });
    }

    function preloadResidentCharacterUrl(url) {
        if (!url) return Promise.resolve('empty');

        const existingEntry = state.residentFigureImageCache.get(url);
        if (existingEntry) {
            return existingEntry.promise;
        }

        const preloadImage = new Image();
        const entry = {
            status: 'loading',
            promise: null
        };

        entry.promise = new Promise((resolve) => {
            const finalize = (status) => {
                preloadImage.onload = null;
                preloadImage.onerror = null;
                entry.status = status;
                if (status === 'error') {
                    state.residentFigureImageCache.delete(url);
                }
                resolve(status);
            };

            preloadImage.onload = () => finalize('loaded');
            preloadImage.onerror = () => finalize('error');
            preloadImage.src = url;
        });

        state.residentFigureImageCache.set(url, entry);
        return entry.promise;
    }

    async function prepareResidentCharacterLoop(config, figureEl) {
        const preloadToken = state.residentFigurePreloadToken;
        scheduleResidentCharacterLoop(config);

        const spriteImageEl = getResidentCharacterImageEl(figureEl);
        await waitForResidentCharacterImageEl(spriteImageEl);

        if (preloadToken !== state.residentFigurePreloadToken || state.residentFigureEl !== figureEl) {
            return;
        }

        const preloadQueue = [
            resolveResidentCharacterUrl(config, 'run-left'),
            resolveResidentCharacterUrl(config, 'run-right')
        ].filter((url, index, array) => Boolean(url) && array.indexOf(url) === index);

        for (const url of preloadQueue) {
            await preloadResidentCharacterUrl(url);
            if (preloadToken !== state.residentFigurePreloadToken || state.residentFigureEl !== figureEl) {
                return;
            }
        }
    }

    function updateResidentCharacterPose(config, pose) {
        const figureEl = state.residentFigureEl;
        if (!figureEl) return;

        const spriteEl = figureEl.querySelector('.resident-character-sprite');
        const imageEl = getResidentCharacterImageEl(figureEl);
        const nextUrl = resolveResidentCharacterUrl(config, pose);

        figureEl.dataset.pose = pose;
        figureEl.classList.toggle('is-running', pose !== 'idle');
        figureEl.classList.toggle('is-idle', pose === 'idle');
        figureEl.classList.toggle('is-running-left', pose === 'run-left');
        figureEl.classList.toggle('is-running-right', pose === 'run-right');

        if (spriteEl) {
            spriteEl.classList.toggle('is-empty', !nextUrl);
        }

        if (!imageEl) return;

        if (nextUrl) {
            if (imageEl.getAttribute('src') !== nextUrl) {
                imageEl.setAttribute('src', nextUrl);
            }
            imageEl.dataset.pose = pose;
        } else {
            imageEl.removeAttribute('src');
            imageEl.dataset.pose = '';
        }

        imageEl.classList.toggle('is-empty', !nextUrl);
    }

    function scheduleResidentCharacterLoop(config) {
        const figureEl = state.residentFigureEl;
        if (!figureEl) return;

        updateResidentCharacterPose(config, 'idle');
        figureEl.style.transition = 'left 240ms ease-out, top 240ms ease-out';

        const idleDelay = randomInRange(600, 1200);
        state.residentFigureLoopTimer = window.setTimeout(() => {
            const currentLeft = parseFloat(figureEl.dataset.left || figureEl.style.left) || 50;
            const currentTop = parseFloat(figureEl.dataset.top || figureEl.style.top) || 84;
            let direction = Math.random() < 0.5 ? 'left' : 'right';
            const deltaX = randomInRange(12, 28);

            if (direction === 'left' && currentLeft <= CONTACT_FIGURE_MIN_LEFT + 6) {
                direction = 'right';
            } else if (direction === 'right' && currentLeft >= CONTACT_FIGURE_MAX_LEFT - 6) {
                direction = 'left';
            }

            const nextLeft = clampResidentFigureValue(
                currentLeft + (direction === 'left' ? -deltaX : deltaX),
                CONTACT_FIGURE_MIN_LEFT,
                CONTACT_FIGURE_MAX_LEFT
            );
            const nextTop = clampResidentFigureValue(
                currentTop + randomInRange(-4, 4),
                CONTACT_FIGURE_MIN_TOP,
                CONTACT_FIGURE_MAX_TOP
            );
            const duration = Math.round(randomInRange(2000, 4000));

            updateResidentCharacterPose(config, direction === 'left' ? 'run-left' : 'run-right');
            figureEl.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
            figureEl.style.left = `${nextLeft}%`;
            figureEl.style.top = `${nextTop}%`;
            figureEl.dataset.left = String(nextLeft);
            figureEl.dataset.top = String(nextTop);
            figureEl.style.zIndex = String(Math.floor(nextTop));

            state.residentFigureMoveTimer = window.setTimeout(() => {
                scheduleResidentCharacterLoop(config);
            }, duration + 60);
        }, idleDelay);
    }

    function ensureResidentCharacterLayer() {
        if (!state.roomEl) return null;
        if (!state.residentLayerEl || !state.residentLayerEl.isConnected) {
            state.residentLayerEl = state.shadowRoot ? state.shadowRoot.getElementById('residentCharacterLayer') : null;
        }
        if (!state.residentLayerEl) {
            const layer = document.createElement('div');
            layer.id = 'residentCharacterLayer';
            layer.className = 'resident-character-layer';
            state.roomEl.appendChild(layer);
            state.residentLayerEl = layer;
        }
        return state.residentLayerEl;
    }

    function refreshActiveContactFigure(config = null) {
        const layerEl = ensureResidentCharacterLayer();
        if (!layerEl) return;

        clearResidentCharacterFigure();

        const activeConfig = sanitizeResidentCharacter(config || getContactFigureConfig(state.currentGardenContactId));
        const hasAnyFigure = Boolean(activeConfig.idleUrl || activeConfig.runLeftUrl || activeConfig.runRightUrl);
        if (!hasAnyFigure || state.currentView !== 'home') {
            return;
        }

        const figureEl = document.createElement('div');
        const startLeft = randomInRange(28, 72);
        const startTop = randomInRange(80, 88);
        figureEl.className = 'resident-character is-idle';
        figureEl.dataset.left = String(startLeft);
        figureEl.dataset.top = String(startTop);
        figureEl.style.left = `${startLeft}%`;
        figureEl.style.top = `${startTop}%`;
        figureEl.style.zIndex = String(Math.floor(startTop));
        figureEl.innerHTML = `
            <div class="resident-character-shadow"></div>
            <div class="resident-character-sprite">
                <img class="resident-character-sprite-img" alt="resident pose" draggable="false" loading="eager" />
            </div>
        `;

        layerEl.appendChild(figureEl);
        state.residentFigureEl = figureEl;
        updateResidentCharacterPose(activeConfig, 'idle');
        prepareResidentCharacterLoop(activeConfig, figureEl);
    }

    function changeTexture(target, background, bgSize = 'auto', bgColor = 'transparent') {
        const targetEl = target === 'wall' ? state.wallEl : state.floorEl;
        if (!targetEl) return;

        targetEl.style.background = background;
        targetEl.style.backgroundSize = bgSize;
        targetEl.style.backgroundColor = bgColor;
        persistGardenLayoutForContact();
        vibrate(20);
    }

    function showToast() {
        if (!state.toastEl) return;
        state.toastEl.classList.add('show');
        clearTimeout(state.toastTimeout);
        state.toastTimeout = setTimeout(() => {
            if (state.toastEl) state.toastEl.classList.remove('show');
        }, 2500);
    }

    function saveDesign() {
        if (state.currentView !== 'home' || !saveBtn || saveBtn.disabled) return;

        persistGardenLayoutForContact();

        const originalHTML = saveBtn.dataset.originalHtml || saveBtn.innerHTML;
        saveBtn.dataset.originalHtml = originalHTML;
        clearTimeout(state.saveResetTimer);
        clearTimeout(state.saveDoneTimer);
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>保存中...</span>';

        state.saveResetTimer = setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-circle-check"></i><span>保存成功</span>';
            saveBtn.classList.add('is-saved');
            state.saveDoneTimer = setTimeout(() => {
                saveBtn.innerHTML = originalHTML;
                saveBtn.classList.remove('is-saved');
            }, 1500);
        }, 800);
    }

    function setDrawerOpen(open) {
        state.drawerOpen = Boolean(open) && state.currentView === 'home';
        if (state.drawerEl) {
            state.drawerEl.classList.toggle('is-open', state.drawerOpen);
        }
        if (togglePanelBtn) {
            togglePanelBtn.classList.toggle('is-active', state.drawerOpen);
        }
    }

    function switchView(viewKey) {
        state.currentView = viewKey;
        setHomeEntryMenuOpen(false);
        setRogueProgressPanelOpen(false);
        syncHomeTutorialVisibility();
        if (viewKey !== 'gallery') {
            closeStorageSellSheet();
        }
        if (viewKey !== 'home') {
            closeFarmScreen({ silent: true });
            closePastureScreen({ silent: true });
            closeKitchenScreen({ silent: true });
        }
        viewEls.forEach((viewEl) => {
            viewEl.classList.toggle('active', viewEl.dataset.gardenView === viewKey);
        });
        navBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.gardenView === viewKey);
        });
        if (screenEl) {
            screenEl.classList.toggle('is-activities-view', viewKey === 'activities');
            screenEl.classList.toggle('is-storage-view', viewKey === 'gallery');
        }

        const isHome = viewKey === 'home';
        if (togglePanelBtn) togglePanelBtn.disabled = !isHome;
        if (saveBtn) saveBtn.disabled = !isHome;
        if (!isHome) {
            setDrawerOpen(false);
            closeFloraScreen();
            clearResidentCharacterFigure();
            return;
        }

        syncHomeEntryMenuSelection();
        refreshActiveContactFigure();
    }

    function syncFloraFromEngine() {
        const snapshot = window.FloraEngine && typeof window.FloraEngine.init === 'function'
            ? window.FloraEngine.init()
            : null;
        const stateKey = snapshot && snapshot.state ? snapshot.state : state.floraState;
        setFloraState(stateKey);
    }

    function handleFloraStateEvent(event) {
        const detail = event && event.detail ? event.detail : null;
        const stateKey = detail && detail.snapshot && detail.snapshot.state
            ? detail.snapshot.state
            : (detail && detail.state ? detail.state : null);
        if (!stateKey) return;
        setFloraState(stateKey);
    }

    function handleFloraContactEvent(event) {
        const detail = event && event.detail ? event.detail : null;
        const contactId = detail && detail.contactId ? String(detail.contactId) : resolveGardenContactId();
        if (state.currentGardenContactId && state.currentGardenContactId !== contactId) {
            persistGardenLayoutForContact(state.currentGardenContactId);
        }
        restoreGardenLayoutForContact(contactId);
        const stateKey = detail && detail.snapshot && detail.snapshot.state ? detail.snapshot.state : null;
        if (!stateKey) {
            syncFloraFromEngine();
            return;
        }
        setFloraState(stateKey);
    }

    function renderFloraParticles(particles) {
        return particles.map((particle) => `
            <div class="garden-flora-particle" style="left: ${particle.left}; animation-delay: ${particle.delay};">${particle.label}</div>
        `).join('');
    }

    function syncPortalPlantState(stateKey) {
        if (!state.roomEl) return;
        const portalPlant = state.roomEl.querySelector('.shape-flora-portal');
        if (!portalPlant) return;
        portalPlant.className = `shape-flora-portal flora-portal-state-${stateKey}`;
        const particles = portalPlant.querySelector('.flora-portal-particle-system');
        if (particles) {
            particles.style.opacity = stateKey === 'withering' || stateKey === 'withered' ? '0' : '1';
        }
    }

    function setFloraState(stateKey) {
        const nextStateKey = FLORA_STATES[stateKey] ? stateKey : 'healthy';
        state.floraState = nextStateKey;

        floraToggleBtns.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.floraState === nextStateKey);
            btn.disabled = true;
            btn.setAttribute('aria-disabled', 'true');
        });
        syncPortalPlantState(nextStateKey);
    }

    function openFloraScreen() {
        if (!floraScreenEl || state.currentView !== 'home') return;
        setDrawerOpen(false);
        syncFloraFromEngine();
        state.floraOpen = true;
        floraScreenEl.classList.add('is-open');
        floraScreenEl.setAttribute('aria-hidden', 'false');
        vibrate(15);
    }

    function closeFloraScreen() {
        if (!floraScreenEl) return;
        state.floraOpen = false;
        floraScreenEl.classList.remove('is-open');
        floraScreenEl.setAttribute('aria-hidden', 'true');
    }

    function openApp() {
        init();
        if (!screenEl) return;
        state.casualGardenGame = loadGardenGameState('casual');
        if (hasPersistedRogueActivitySave()) {
            state.rogueActivityGame = loadGardenGameState('rogue_activity');
        }
        setGardenMode('casual');
        syncRogueStateConsistency();
        saveGardenGameState();
        refreshGardenEconomyUi();
        syncHomeTutorialVisibility();
        renderFarmPlots();
        renderPastureAnimals();
        syncGardenTitle();
        syncGardenLayoutFromActiveContact();
        closeFarmScreen({ silent: true });
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        switchView('home');
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        syncFloraFromEngine();
        screenEl.classList.remove('hidden');
    }

    function closeApp() {
        if (!screenEl) return;
        persistGardenLayoutForContact();
        closeFarmScreen({ silent: true });
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        closeStorageSellSheet();
        setRogueProgressPanelOpen(false);
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        closeContactFigureModal();
        clearResidentCharacterFigure();
        screenEl.classList.add('hidden');
    }

    function vibrate(duration) {
        if (navigator.vibrate) navigator.vibrate(duration);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.GardenApp = {
        openApp,
        closeApp,
        openFarmScreen,
        closeFarmScreen,
        openPastureScreen,
        closePastureScreen,
        openKitchenScreen,
        closeKitchenScreen,
        openActivitiesView,
        openWhisperChallengeFromActivities,
        openContactFigureSettings,
        getContactFigureConfig,
        setContactFigureConfig,
        refreshActiveContactFigure
    };
})();
