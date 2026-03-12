(function () {
    'use strict';

    const GARDEN_TITLE_STORAGE_KEY = 'garden_app_custom_title_v1';
    const GARDEN_LAYOUT_STORAGE_KEY = 'garden_app_contact_layouts_v1';
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

    const FARM_SEEDS = {
        wheat: { id: 'wheat', name: '小麦', emoji: '🌾', cost: 10, reward: 20, time: 4000 },
        carrot: { id: 'carrot', name: '胡萝卜', emoji: '🥕', cost: 15, reward: 35, time: 6000 },
        tomato: { id: 'tomato', name: '番茄', emoji: '🍅', cost: 20, reward: 50, time: 8000 },
        corn: { id: 'corn', name: '玉米', emoji: '🌽', cost: 25, reward: 65, time: 10000 },
        pumpkin: { id: 'pumpkin', name: '南瓜', emoji: '🎃', cost: 35, reward: 90, time: 15000 }
    };

    const KITCHEN_RECIPES = {
        bread: { name: '香喷喷面包', emoji: '🍞' },
        cake: { name: '美味蛋糕', emoji: '🍰' },
        salad: { name: '田园沙拉', emoji: '🥗' },
        pizza: { name: '农家披萨', emoji: '🍕' },
        taco: { name: '烤肉卷饼', emoji: '🌮' },
        icecream: { name: '奶香冰淇淋', emoji: '🍨' }
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
        activeTab: 'pet',
        currentView: 'home',
        drawerOpen: false,
        currentHomeSection: 'home',
        homeEntryMenuOpen: false,
        farmScreenOpen: false,
        kitchenScreenOpen: false,
        farmToastTimeout: null,
        kitchenToastTimeout: null,
        farmGame: {
            initialized: false,
            coins: 100,
            level: 1,
            exp: 0,
            currentTool: 'pointer',
            currentSeed: 'wheat'
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
    let kitchenScreenEl;
    let kitchenCloseBtn;
    let kitchenOverlayEl;
    let kitchenQteContainerEl;
    let kitchenQteDialEl;
    let kitchenQtePointerEl;
    let kitchenQteHintEl;
    let kitchenToastEl;
    let kitchenCookBtns = [];
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

    function createEmptyContactFigureDraftFiles() {
        return {
            idle: null,
            runLeft: null,
            runRight: null
        };
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
        kitchenScreenEl = document.getElementById('garden-kitchen-screen');
        kitchenCloseBtn = document.getElementById('garden-kitchen-close-btn');
        kitchenOverlayEl = document.getElementById('garden-kitchen-overlay');
        kitchenQteContainerEl = document.getElementById('garden-kitchen-qte-container');
        kitchenQteDialEl = document.getElementById('garden-kitchen-qte-dial');
        kitchenQtePointerEl = document.getElementById('garden-kitchen-qte-pointer');
        kitchenQteHintEl = document.getElementById('garden-kitchen-qte-hint');
        kitchenToastEl = document.getElementById('garden-kitchen-toast');
        kitchenCookBtns = Array.from(document.querySelectorAll('#garden-app [data-kitchen-cook]'));
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

        closeBtn.addEventListener('click', closeApp);
        bindGardenTitleEditing();
        syncGardenTitle();
        syncActivitiesNavButton();
        bindActivitiesInteractions();
        ensureContactFigureModal();
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
            openFarmScreen();
            return;
        }

        if (targetKey === 'kitchen') {
            openKitchenScreen();
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

    function initFarmScreen() {
        if (!farmGridEl || !farmSeedListEl) return;
        if (state.farmGame.initialized) {
            syncFarmStats();
            syncFarmToolUi();
            return;
        }

        farmGridEl.innerHTML = '';
        for (let index = 0; index < 9; index += 1) {
            const plot = document.createElement('div');
            plot.className = 'garden-farm-plot';
            plot.dataset.state = 'empty';
            plot.dataset.seedId = '';
            plot.dataset.progress = '0';
            plot.innerHTML = '<span class="garden-farm-crop"></span><div class="garden-farm-progress-container"><div class="garden-farm-progress-fill"></div></div>';
            plot.addEventListener('click', () => handleFarmPlotClick(plot));
            farmGridEl.appendChild(plot);
        }

        farmSeedListEl.innerHTML = '';
        Object.values(FARM_SEEDS).forEach((seed, index) => {
            const item = document.createElement('div');
            item.className = `garden-farm-seed-item${index === 0 ? ' active' : ''}`;
            item.dataset.farmSeed = seed.id;
            item.innerHTML = `<div class="garden-farm-seed-emoji">${seed.emoji}</div><div class="garden-farm-seed-info"><i class="ri-copper-coin-fill" style="color:#FFD700;"></i>${seed.cost}</div>`;
            item.addEventListener('click', () => setFarmSeed(seed.id));
            farmSeedListEl.appendChild(item);
        });

        farmToolBtns.forEach((button) => {
            button.addEventListener('click', () => setFarmTool(button.dataset.farmTool));
        });

        syncFarmStats();
        syncFarmToolUi();
        state.farmGame.initialized = true;
    }

    function syncFarmStats() {
        if (farmCoinsEl) farmCoinsEl.textContent = String(state.farmGame.coins);
        if (farmLevelEl) farmLevelEl.textContent = String(state.farmGame.level);
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
            if (state.farmGame.coins < seed.cost) {
                showFarmToast('金币不足啦');
                return;
            }
            updateFarmCoins(-seed.cost);
            plantFarmSeed(plotEl, seed);
            return;
        }

        if (currentTool === 'water') {
            if (plotState !== 'growing') {
                showFarmToast('只有生长中的作物才能浇水');
                return;
            }
            waterFarmPlot(plotEl);
            return;
        }

        if (currentTool === 'harvest') {
            if (plotState !== 'ready') {
                showFarmToast('还没成熟，先等等');
                return;
            }
            const seed = FARM_SEEDS[plotEl.dataset.seedId];
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
            const seed = FARM_SEEDS[plotEl.dataset.seedId];
            showFarmToast(seed ? `${seed.name} 已成熟，快去收获` : '作物已成熟');
            return;
        }
        if (plotState === 'growing') {
            showFarmToast('作物正在努力生长中');
            return;
        }
        showFarmToast('切换工具后就能开始种地啦');
    }

    function plantFarmSeed(plotEl, seed) {
        clearFarmPlot(plotEl, { keepToast: true });
        plotEl.dataset.state = 'growing';
        plotEl.dataset.seedId = seed.id;
        plotEl.dataset.progress = '0';
        plotEl.classList.add('growing');
        const cropEl = plotEl.querySelector('.garden-farm-crop');
        const progressFillEl = plotEl.querySelector('.garden-farm-progress-fill');
        if (cropEl) cropEl.textContent = '🌱';
        if (progressFillEl) progressFillEl.style.width = '0%';

        const updateInterval = 100;
        const step = (updateInterval / seed.time) * 100;
        plotEl.growInterval = window.setInterval(() => {
            advanceFarmPlotGrowth(plotEl, step);
        }, updateInterval);
        showFarmToast(`已种下${seed.name}`);
    }

    function advanceFarmPlotGrowth(plotEl, amount) {
        if (!plotEl || plotEl.dataset.state !== 'growing') return;
        const progressFillEl = plotEl.querySelector('.garden-farm-progress-fill');
        let progress = Number(plotEl.dataset.progress || '0');
        progress = Math.min(100, progress + amount);
        plotEl.dataset.progress = String(progress);
        if (progressFillEl) progressFillEl.style.width = `${progress}%`;
        if (progress < 100) return;

        window.clearInterval(plotEl.growInterval);
        plotEl.growInterval = null;
        plotEl.dataset.state = 'ready';
        plotEl.classList.remove('growing');
        plotEl.classList.add('ready');
        const seed = FARM_SEEDS[plotEl.dataset.seedId];
        const cropEl = plotEl.querySelector('.garden-farm-crop');
        if (cropEl) cropEl.textContent = seed ? seed.emoji : '🌾';
    }

    function waterFarmPlot(plotEl) {
        if (!plotEl) return;
        plotEl.style.backgroundColor = 'var(--farm-dirt-wet)';
        window.setTimeout(() => {
            plotEl.style.backgroundColor = '';
        }, 500);
        advanceFarmPlotGrowth(plotEl, 18);
        showFarmToast('已浇水，生长加速');
    }

    function harvestFarmCrop(plotEl, seed) {
        clearFarmPlot(plotEl, { keepToast: true });
        updateFarmCoins(seed.reward);
        state.farmGame.exp += 10;
        showFarmToast(`收获 ${seed.name}，获得 ${seed.reward} 金币`);
        if (state.farmGame.exp < 100) return;

        state.farmGame.level += 1;
        state.farmGame.exp = 0;
        syncFarmStats();
        showFarmToast(`升级啦！当前等级 ${state.farmGame.level}`);
    }

    function clearFarmPlot(plotEl) {
        if (!plotEl) return;
        if (plotEl.growInterval) {
            window.clearInterval(plotEl.growInterval);
            plotEl.growInterval = null;
        }
        plotEl.dataset.state = 'empty';
        plotEl.dataset.seedId = '';
        plotEl.dataset.progress = '0';
        plotEl.classList.remove('growing', 'ready');
        const cropEl = plotEl.querySelector('.garden-farm-crop');
        const progressFillEl = plotEl.querySelector('.garden-farm-progress-fill');
        if (cropEl) cropEl.textContent = '';
        if (progressFillEl) progressFillEl.style.width = '0%';
    }

    function updateFarmCoins(amount) {
        state.farmGame.coins += amount;
        syncFarmStats();
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

    function initKitchenScreen() {
        if (!kitchenOverlayEl) return;
        if (state.kitchenGame.initialized) return;

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

    function openKitchenScreen() {
        initKitchenScreen();
        if (!kitchenScreenEl) return;
        closeFarmScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        state.kitchenScreenOpen = true;
        state.currentHomeSection = 'kitchen';
        kitchenScreenEl.classList.add('is-open');
        kitchenScreenEl.setAttribute('aria-hidden', 'false');
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
        if (!KITCHEN_RECIPES[recipeId]) return;
        state.kitchenGame.currentRecipeId = recipeId;
        startKitchenQte();
    }

    function startKitchenQte() {
        if (!kitchenOverlayEl || !kitchenQteContainerEl || !kitchenQteDialEl || !kitchenQtePointerEl || !kitchenQteHintEl) return;

        const randomStart = Math.floor(Math.random() * 230) + 20;
        state.kitchenGame.whiteStart = randomStart;
        state.kitchenGame.whiteEnd = randomStart + 90;
        state.kitchenGame.yellowStart = randomStart + 37.5;
        state.kitchenGame.yellowEnd = state.kitchenGame.yellowStart + 15;
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

            const recipe = KITCHEN_RECIPES[state.kitchenGame.currentRecipeId] || { name: '料理', emoji: '🍳' };
            const prefix = quality === 'perfect' ? '✨[完美品质]✨' : '✅';
            showKitchenToast(`${prefix} 获得 ${recipe.name} ${recipe.emoji}`);
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
                triggerActivitiesPlayFeedback(card.querySelector('.garden-activities-play-btn'));
            }
        });
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
        if (viewKey !== 'home') {
            closeFarmScreen({ silent: true });
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
        syncGardenTitle();
        syncGardenLayoutFromActiveContact();
        closeFarmScreen({ silent: true });
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
        closeKitchenScreen({ silent: true });
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
