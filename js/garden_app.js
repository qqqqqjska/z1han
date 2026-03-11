(function () {
    'use strict';

    const GARDEN_TITLE_STORAGE_KEY = 'garden_app_custom_title_v1';
    const GARDEN_LAYOUT_STORAGE_KEY = 'garden_app_contact_layouts_v1';
    const GARDEN_TITLE_DEFAULT = '\u840c\u5ba0\u76f8\u4f34\u7684\u5bb6';
    const GARDEN_TITLE_MAX_LENGTH = 20;

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
        toastTimeout: null,
        saveResetTimer: null,
        saveDoneTimer: null,
        shadowRoot: null,
        roomEl: null,
        wallEl: null,
        floorEl: null,
        toastEl: null,
        drawerEl: null,
        tabsEl: null,
        panelContentEl: null,
        floraState: 'healthy',
        floraOpen: false,
        currentGardenContactId: null,
        gardenLayouts: null
    };

    let screenEl;
    let closeBtn;
    let togglePanelBtn;
    let saveBtn;
    let viewEls;
    let navBtns;
    let editorHost;
    let titleTextEl;
    let floraScreenEl;
    let floraAppEl;
    let floraBackBtn;
    let floraArtEl;
    let floraParticlesEl;
    let floraLogContentEl;
    let floraToggleBtns = [];

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
        togglePanelBtn.addEventListener('click', () => {
            if (state.currentView !== 'home') return;
            setDrawerOpen(!state.drawerOpen);
        });
        saveBtn.addEventListener('click', saveDesign);
        navBtns.forEach((btn) => {
            btn.addEventListener('click', () => switchView(btn.dataset.gardenView));
        });
        if (floraBackBtn) {
            floraBackBtn.addEventListener('click', closeFloraScreen);
        }
        window.addEventListener('moodflora:statechange', handleFloraStateEvent);
        window.addEventListener('moodflora:contactchange', handleFloraContactEvent);

        initEditor();
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
        clearRoomItems();
        applySurface(state.wallEl, nextLayout.wall);
        applySurface(state.floorEl, nextLayout.floor);

        nextLayout.items.forEach((itemSnapshot) => {
            createRoomItem(itemSnapshot.type, itemSnapshot.placement, buildItemOptionsFromSnapshot(itemSnapshot));
        });

        ensureFixedFloraPlant();
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
            item.setAttribute('aria-label', options.ariaLabel || '????');
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
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>保存中</span>';

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
        viewEls.forEach((viewEl) => {
            viewEl.classList.toggle('active', viewEl.dataset.gardenView === viewKey);
        });
        navBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.gardenView === viewKey);
        });

        const isHome = viewKey === 'home';
        if (togglePanelBtn) togglePanelBtn.disabled = !isHome;
        if (saveBtn) saveBtn.disabled = !isHome;
        if (!isHome) {
            setDrawerOpen(false);
            closeFloraScreen();
        }
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
        switchView('home');
        setDrawerOpen(false);
        closeFloraScreen();
        syncFloraFromEngine();
        screenEl.classList.remove('hidden');
    }

    function closeApp() {
        if (!screenEl) return;
        persistGardenLayoutForContact();
        setDrawerOpen(false);
        closeFloraScreen();
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
        closeApp
    };
})();
